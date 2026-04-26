import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums/index.js';
import { UserPreferences } from '../interfaces/user-preferences.interface.js';
import { DEFAULT_USER_PREFERENCES } from '../constants/user.constants.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  surname!: string;

  @Column({ type: 'varchar', unique: true, length: 255 })
  email!: string;

  @Column({ type: 'varchar', name: 'password_hash', nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.user })
  role!: UserRole;

  @Column({ type: 'varchar', name: 'profile_image', nullable: true })
  profileImage!: string | null;

  @Column({ type: 'jsonb', default: DEFAULT_USER_PREFERENCES })
  preferences!: UserPreferences;

  @Column({ type: 'varchar', name: 'refresh_token_hash', nullable: true })
  refreshTokenHash!: string | null;

  @Column({ type: 'varchar', name: 'password_reset_token', nullable: true })
  passwordResetToken!: string | null;

  @Column({
    type: 'timestamp with time zone',
    name: 'password_reset_expires',
    nullable: true,
  })
  passwordResetExpires!: Date | null;

  @Column({ type: 'varchar', name: 'google_id', unique: true, nullable: true })
  googleId!: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', name: 'deleted_at' })
  deletedAt!: Date | null;
}
