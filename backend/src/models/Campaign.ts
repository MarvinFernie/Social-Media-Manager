import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { User } from './User';
import { PlatformContent } from './PlatformContent';

export enum CampaignStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  FAILED = 'failed'
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.campaigns)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  originalContent: string;

  @Column({ type: 'json', nullable: true })
  mediaFiles: {
    images?: string[];
    videos?: string[];
  } | null;

  @Column({ type: 'json', nullable: true })
  links: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
  }[] | null;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT
  })
  status: CampaignStatus;

  @OneToMany(() => PlatformContent, content => content.campaign)
  platformContents: PlatformContent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

