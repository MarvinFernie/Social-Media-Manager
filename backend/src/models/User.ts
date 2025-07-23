import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm';
import { Campaign } from './Campaign';
import { SocialAccount } from './SocialAccount';

export enum AuthProvider {
  GOOGLE = 'google',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter'
}

export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  providerId: string;

  @Column({
    type: 'enum',
    enum: AuthProvider
  })
  provider: AuthProvider;

  @Column()
  email: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  profilePicture: string | null;

  @Column({
    type: 'enum',
    enum: LLMProvider,
    nullable: true
  })
  llmProvider: LLMProvider | null;

  @Column({ type: 'varchar', nullable: true })
  llmModel: string | null;

  @Column({ type: 'varchar', nullable: true })
  encryptedApiKey: string | null;

  @Column({ type: 'json', nullable: true })
  preferences: Record<string, any> | null;

  @OneToMany(() => Campaign, campaign => campaign.user)
  campaigns: Campaign[];

  @OneToMany(() => SocialAccount, account => account.user)
  socialAccounts: SocialAccount[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}




