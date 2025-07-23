import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './User';
import { Platform } from './PlatformContent';

@Entity('social_accounts')
@Index(['userId', 'platform'], { unique: true })
export class SocialAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.socialAccounts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: Platform
  })
  platform: Platform;

  @Column()
  platformUserId: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'text' })
  encryptedAccessToken: string;

  @Column({ type: 'text', nullable: true })
  encryptedRefreshToken: string;

  @Column({ nullable: true })
  tokenExpiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
