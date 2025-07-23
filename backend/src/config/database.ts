import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Campaign } from '../models/Campaign';
import { PlatformContent } from '../models/PlatformContent';
import { SocialAccount } from '../models/SocialAccount';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true, // Temporarily enable for initial setup
  logging: true, // Enable logging to see what's happening
  entities: [User, Campaign, PlatformContent, SocialAccount],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

export async function initializeDatabase() {
  try {
    console.log('Database initialization starting...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configured' : 'Not configured');
    
    // Temporarily skip database initialization if DATABASE_URL is not properly configured
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('app-db.internal')) {
      console.log('Skipping database initialization - DATABASE_URL not configured');
      return false;
    }
    
    console.log('Initializing AppDataSource...');
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');
    console.log('AppDataSource.isInitialized:', AppDataSource.isInitialized);
    return true;
  } catch (error) {
    console.error('Error during Data Source initialization:', error);
    // Don't throw error for now to allow app to start
    console.log('Continuing without database connection');
    return false;
  }
}



