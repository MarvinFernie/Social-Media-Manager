import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { SocialAccount } from '../models/SocialAccount';
import { Platform } from '../models/PlatformContent';
import { AppError } from '../middleware/errorHandler';
import { platformService } from '../services/platform.service';

class PlatformController {
  async getConnectedAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const socialAccountRepository = AppDataSource.getRepository(SocialAccount);
      
      const accounts = await socialAccountRepository.find({
        where: { userId: user.id, isActive: true }
      });

      const accountsWithStatus = accounts.map(account => ({
        ...account,
        encryptedAccessToken: undefined,
        encryptedRefreshToken: undefined,
        needsReconnection: account.tokenExpiresAt && account.tokenExpiresAt < new Date()
      }));

      res.json({
        status: 'success',
        data: { accounts: accountsWithStatus }
      });
    } catch (error) {
      next(error);
    }
  }

  async connectPlatform(req: Request, res: Response, next: NextFunction) {
    try {
      const { platform } = req.params;
      const user = req.user!;

      if (!Object.values(Platform).includes(platform as Platform)) {
        throw new AppError('Invalid platform', 400);
      }

      // Generate OAuth URL for the platform
      const authUrl = await platformService.getOAuthUrl(platform as Platform, user.id);

      res.json({
        status: 'success',
        data: { authUrl }
      });
    } catch (error) {
      next(error);
    }
  }

  async disconnectPlatform(req: Request, res: Response, next: NextFunction) {
    try {
      const { platform } = req.params;
      const user = req.user!;

      const socialAccountRepository = AppDataSource.getRepository(SocialAccount);
      
      const result = await socialAccountRepository.update(
        { userId: user.id, platform: platform as Platform },
        { isActive: false }
      );

      if (result.affected === 0) {
        throw new AppError('Platform account not found', 404);
      }

      res.json({
        status: 'success',
        message: 'Platform disconnected successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { platform } = req.params;
      const user = req.user!;

      const socialAccountRepository = AppDataSource.getRepository(SocialAccount);
      const account = await socialAccountRepository.findOne({
        where: { userId: user.id, platform: platform as Platform }
      });

      if (!account) {
        throw new AppError('Platform account not found', 404);
      }

      const refreshed = await platformService.refreshToken(account);

      if (!refreshed) {
        throw new AppError('Failed to refresh token. Please reconnect the platform.', 400);
      }

      res.json({
        status: 'success',
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getPlatformProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { platform } = req.params;
      const user = req.user!;

      const socialAccountRepository = AppDataSource.getRepository(SocialAccount);
      const account = await socialAccountRepository.findOne({
        where: { userId: user.id, platform: platform as Platform, isActive: true }
      });

      if (!account) {
        throw new AppError('Platform account not found or not connected', 404);
      }

      const profile = await platformService.getPlatformProfile(account);

      res.json({
        status: 'success',
        data: { profile }
      });
    } catch (error) {
      next(error);
    }
  }

  async getPlatformLimits(req: Request, res: Response, next: NextFunction) {
    try {
      const { platform } = req.params;

      if (!Object.values(Platform).includes(platform as Platform)) {
        throw new AppError('Invalid platform', 400);
      }

      const limits = platformService.getPlatformLimits(platform as Platform);

      res.json({
        status: 'success',
        data: { limits }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const platformController = new PlatformController();
