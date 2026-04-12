import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { TransactionsService } from './transactions.service.js';
import { TransactionsExportService } from './export/transactions-export.service.js';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionResponseDto,
  ListTransactionsQueryDto,
  ExportTransactionsQueryDto,
} from './dto/index.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { JwtPayload } from '../auth/interfaces/index.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly transactionsExportService: TransactionsExportService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListTransactionsQueryDto,
  ): Promise<PaginatedResponseDto<TransactionResponseDto>> {
    return this.transactionsService.findAll(user.sub, query);
  }

  @Get('export/csv')
  async exportCsv(
    @CurrentUser() user: JwtPayload,
    @Query() query: ExportTransactionsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const transactions =
      await this.transactionsExportService.findTransactionsForExport(
        user.sub,
        query,
      );
    const csv = this.transactionsExportService.generateCsv(transactions);
    const today = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="transacciones_${today}.csv"`,
    );
    res.send(csv);
  }

  @Get('export/pdf')
  async exportPdf(
    @CurrentUser() user: JwtPayload,
    @Query() query: ExportTransactionsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const transactions =
      await this.transactionsExportService.findTransactionsForExport(
        user.sub,
        query,
      );
    const pdfBuffer = await this.transactionsExportService.generatePdf(
      transactions,
      user.sub,
      query.dateFrom,
      query.dateTo,
    );
    const today = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="transacciones_${today}.pdf"`,
    );
    res.send(pdfBuffer);
  }

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.create(user.sub, dto);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.findOne(user.sub, id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.transactionsService.remove(user.sub, id);
  }
}
