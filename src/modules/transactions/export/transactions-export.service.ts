import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Transaction } from '../entities/transaction.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { ExportTransactionsQueryDto } from '../dto/export-transactions-query.dto.js';
import { TransactionType } from '../../../common/enums/index.js';

class DisposablePdfDocument {
  readonly doc: PDFKit.PDFDocument;
  private readonly chunks: Buffer[] = [];
  private readonly endPromise: Promise<Buffer>;
  private ended = false;

  constructor(options?: PDFKit.PDFDocumentOptions) {
    this.doc = new PDFDocument(options);
    this.endPromise = new Promise<Buffer>((resolve, reject) => {
      this.doc.on('data', (chunk: Buffer) => this.chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(this.chunks)));
      this.doc.on('error', reject);
    });
  }

  async end(): Promise<Buffer> {
    this.ended = true;
    this.doc.end();
    return this.endPromise;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    if (!this.ended) {
      this.ended = true;
      this.doc.end();
      await this.endPromise;
    }
  }
}

@Injectable()
export class TransactionsExportService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findTransactionsForExport(
    userId: string,
    query: ExportTransactionsQueryDto,
  ): Promise<Transaction[]> {
    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'c')
      .where('t.user_id = :userId', { userId })
      .orderBy('t.date', 'DESC')
      .addOrderBy('t.created_at', 'DESC');

    if (query.dateFrom) {
      qb.andWhere('t.date >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('t.date <= :dateTo', { dateTo: query.dateTo });
    }

    return qb.getMany();
  }

  generateCsv(transactions: Transaction[]): string {
    const BOM = '\uFEFF';
    const headers = [
      'Fecha',
      'Tipo',
      'Categoria',
      'Descripcion',
      'Monto',
      'Metodo de pago',
    ];

    const rows = transactions.map((t) => [
      t.date,
      t.type,
      t.category?.name ?? 'Sin categoria',
      this.escapeCsvField(t.description ?? ''),
      String(t.amount),
      t.paymentMethod,
    ]);

    const lines = [headers, ...rows].map((row) => row.join(';'));
    return BOM + lines.join('\n');
  }

  async generatePdf(
    transactions: Transaction[],
    userId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<Buffer> {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });

    await using pdf = new DisposablePdfDocument({ size: 'A4', margin: 40 });

    this.renderHeader(pdf.doc, user, dateFrom, dateTo);
    this.renderTable(pdf.doc, transactions);
    this.renderSummary(pdf.doc, transactions);

    return pdf.end();
  }

  private renderHeader(
    doc: PDFKit.PDFDocument,
    user: User,
    dateFrom?: string,
    dateTo?: string,
  ): void {
    doc
      .fillColor('#6C63FF')
      .fontSize(20)
      .text('SpendWise - Reporte de Transacciones', { align: 'center' });

    doc.moveDown(0.5);
    doc.fillColor('#333333').fontSize(10);
    doc.text(`Usuario: ${user.name} ${user.surname}`, { align: 'center' });
    doc.text(`Email: ${user.email}`, { align: 'center' });

    if (dateFrom || dateTo) {
      const range = [
        dateFrom ? `Desde: ${dateFrom}` : '',
        dateTo ? `Hasta: ${dateTo}` : '',
      ]
        .filter(Boolean)
        .join('  |  ');
      doc.text(range, { align: 'center' });
    }

    doc.text(`Generado: ${new Date().toISOString().split('T')[0]}`, {
      align: 'center',
    });
    doc.moveDown(1);
  }

  private renderTable(
    doc: PDFKit.PDFDocument,
    transactions: Transaction[],
  ): void {
    const columns = [
      { label: 'Fecha', x: 40, width: 70 },
      { label: 'Tipo', x: 110, width: 60 },
      { label: 'Categoria', x: 170, width: 100 },
      { label: 'Descripcion', x: 270, width: 150 },
      { label: 'Monto', x: 420, width: 70 },
      { label: 'Metodo', x: 490, width: 70 },
    ];

    doc.fontSize(9).fillColor('#FFFFFF');
    const headerY = doc.y;
    doc.rect(40, headerY - 2, 520, 16).fill('#6C63FF');
    doc.fillColor('#FFFFFF');
    for (const col of columns) {
      doc.text(col.label, col.x, headerY, {
        width: col.width,
        lineBreak: false,
      });
    }

    doc.y = headerY + 18;
    doc.fillColor('#333333');

    for (let i = 0; i < transactions.length; i++) {
      if (doc.y > 750) {
        doc.addPage();
        doc.y = 40;
      }

      const t = transactions[i];
      const rowY = doc.y;

      if (i % 2 === 0) {
        doc.rect(40, rowY - 2, 520, 14).fill('#F5F5F5');
        doc.fillColor('#333333');
      }

      doc.text(t.date, columns[0].x, rowY, {
        width: columns[0].width,
        lineBreak: false,
      });
      doc.text(t.type, columns[1].x, rowY, {
        width: columns[1].width,
        lineBreak: false,
      });
      doc.text(t.category?.name ?? 'Sin categoria', columns[2].x, rowY, {
        width: columns[2].width,
        lineBreak: false,
      });
      doc.text(t.description ?? '', columns[3].x, rowY, {
        width: columns[3].width,
        lineBreak: false,
      });
      doc.text(String(t.amount), columns[4].x, rowY, {
        width: columns[4].width,
        lineBreak: false,
      });
      doc.text(t.paymentMethod, columns[5].x, rowY, {
        width: columns[5].width,
        lineBreak: false,
      });

      doc.y = rowY + 16;
    }

    if (transactions.length === 0) {
      doc.moveDown(0.5);
      doc.text('No se encontraron transacciones para el rango seleccionado.', {
        align: 'center',
      });
    }
  }

  private renderSummary(
    doc: PDFKit.PDFDocument,
    transactions: Transaction[],
  ): void {
    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpense;

    if (doc.y > 720) {
      doc.addPage();
    }

    doc.moveDown(1.5);
    doc.fontSize(11).fillColor('#6C63FF').text('Resumen', 40);
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333333');
    doc.text(`Total ingresos:  ${totalIncome.toFixed(2)} EUR`);
    doc.text(`Total gastos:    ${totalExpense.toFixed(2)} EUR`);
    doc
      .fillColor(balance >= 0 ? '#2E7D32' : '#C62828')
      .text(`Balance neto:    ${balance.toFixed(2)} EUR`);
  }

  private escapeCsvField(value: string): string {
    if (value.includes(';') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
