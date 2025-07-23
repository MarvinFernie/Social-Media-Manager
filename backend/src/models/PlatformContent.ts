import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Campaign } from './Campaign';

export enum Platform {
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter'
}

export enum PostStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
  FAILED = 'failed'
}

@Entity('platform_contents')
export class PlatformContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign, campaign => campaign.platformContents)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({
    type: 'enum',
    enum: Platform
  })
  platform: Platform;

  @Column({ type: 'json' })
  variations: {
    tone: string;
    content: string;
  }[];

  @Column({ type: 'text', nullable: true })
  selectedContent: string | null;

  @Column({ type: 'text', nullable: true })
  finalContent: string | null;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT
  })
  status: PostStatus;

  @Column({ type: 'varchar', nullable: true })
  postId: string | null;

  @Column({ type: 'varchar', nullable: true })
  postUrl: string | null;

  @Column({ type: 'json', nullable: true })
  postMetrics: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  iterationHistory: {
    timestamp: Date;
    content: string;
    prompt: string;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  postedAt: Date | null;
}





