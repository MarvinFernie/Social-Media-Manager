import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, LLMProvider } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { encryptionService } from '../utils/encryption';

class AuthController {
  async handleOAuthCallback(req: Request, res: Response, next: NextFunction) {
    console.log('Auth Controller - handleOAuthCallback started');
    console.log('Request user:', req.user);
    console.log('Request isAuthenticated:', req.isAuthenticated?.());
    
    try {
      if (!req.user) {
        console.error('Auth Controller - No user in request!');
        throw new AppError('Authentication failed - no user data received', 401);
      }
      
      const user = req.user as User;
      console.log('Auth Controller - User authenticated:', { id: user.id, email: user.email });
      
      if (!process.env.JWT_SECRET) {
        console.error('Auth Controller - JWT_SECRET not configured!');
        throw new AppError('Server configuration error', 500);
      }
      
      if (!process.env.FRONTEND_URL) {
        console.error('Auth Controller - FRONTEND_URL not configured!');
        throw new AppError('Server configuration error', 500);
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET as string
      );
      console.log('Auth Controller - JWT token created');

      // Redirect to frontend with token
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
      console.log('Auth Controller - Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Auth Controller - Error in handleOAuthCallback:', error);
      console.error('Error stack:', (error as Error).stack);
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      
      // Don't send sensitive data
      const { encryptedApiKey, ...safeUser } = user;
      
      res.json({
        status: 'success',
        data: {
          user: {
            ...safeUser,
            hasApiKey: !!encryptedApiKey
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLLMConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider, model, apiKey } = req.body;
      const user = req.user!;

      if (!provider || !model || !apiKey) {
        throw new AppError('Provider, model, and API key are required', 400);
      }

      if (!Object.values(LLMProvider).includes(provider)) {
        throw new AppError('Invalid LLM provider', 400);
      }

      const userRepository = AppDataSource.getRepository(User);
      
      // Encrypt the API key before storing
      const encryptedApiKey = encryptionService.encrypt(apiKey);

      await userRepository.update(user.id, {
        llmProvider: provider,
        llmModel: model,
        encryptedApiKey
      });

      res.json({
        status: 'success',
        message: 'LLM configuration updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeLLMConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const userRepository = AppDataSource.getRepository(User);
      
      // Clear the LLM configuration
      await userRepository.update(user.id, {
        llmProvider: null,
        llmModel: null,
        encryptedApiKey: null
      });

      res.json({
        status: 'success',
        message: 'LLM configuration revoked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Since we're using JWT, we don't need to do anything server-side
      // The client should remove the token
      res.json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();




