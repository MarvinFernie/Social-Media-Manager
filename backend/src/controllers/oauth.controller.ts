import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { SocialAccount } from '../models/SocialAccount';
import { Platform } from '../models/PlatformContent';
import { AppError } from '../middleware/errorHandler';
import { encryptionService } from '../utils/encryption';
import axios from 'axios';

class OAuthController {
  async handleLinkedInCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}/settings?error=linkedin_auth_failed`);
      }

      if (!code || !state) {
        throw new AppError('Invalid callback parameters', 400);
      }

      // Decode state to get userId
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const { userId } = stateData;

      // Exchange code for access token
      const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.BACKEND_URL}/api/platforms/callback/linkedin`,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, expires_in } = tokenResponse.data;

      // Get LinkedIn profile
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      const profile = profileResponse.data;
      const username = `${profile.localizedFirstName} ${profile.localizedLastName}`;

      // Save or update social account
      const socialAccountRepository = AppDataSource.getRepository(SocialAccount);
      
      let socialAccount = await socialAccountRepository.findOne({
        where: { userId, platform: Platform.LINKEDIN }
      });

      if (!socialAccount) {
        socialAccount = socialAccountRepository.create({
          userId,
          platform: Platform.LINKEDIN,
          platformUserId: profile.id,
          username,
        });
      }

      socialAccount.encryptedAccessToken = encryptionService.encrypt(access_token);
      socialAccount.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
      socialAccount.isActive = true;
      
      await socialAccountRepository.save(socialAccount);

      // Redirect to frontend settings page
      res.redirect(`${process.env.FRONTEND_URL}/settings?success=linkedin_connected`);
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/settings?error=linkedin_auth_failed`);
    }
  }

  async handleTwitterCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}/settings?error=twitter_auth_failed`);
      }

      if (!code || !state) {
        throw new AppError('Invalid callback parameters', 400);
      }

      // Decode state to get userId
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const { userId } = stateData;

      // Exchange code for access token
      const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.BACKEND_URL}/api/platforms/callback/twitter`,
        client_id: process.env.TWITTER_CLIENT_ID,
        code_verifier: 'challenge', // In production, this should be properly implemented with PKCE
      }, {
        auth: {
          username: process.env.TWITTER_CLIENT_ID!,
          password: process.env.TWITTER_CLIENT_SECRET!,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Get Twitter profile
      const profileResponse = await axios.get('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      const profile = profileResponse.data.data;

      // Save or update social account
      const socialAccountRepository = AppDataSource.getRepository(SocialAccount);
      
      let socialAccount = await socialAccountRepository.findOne({
        where: { userId, platform: Platform.TWITTER }
      });

      if (!socialAccount) {
        socialAccount = socialAccountRepository.create({
          userId,
          platform: Platform.TWITTER,
          platformUserId: profile.id,
          username: profile.username,
        });
      }

      socialAccount.encryptedAccessToken = encryptionService.encrypt(access_token);
      if (refresh_token) {
        socialAccount.encryptedRefreshToken = encryptionService.encrypt(refresh_token);
      }
      socialAccount.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
      socialAccount.isActive = true;
      
      await socialAccountRepository.save(socialAccount);

      // Redirect to frontend settings page
      res.redirect(`${process.env.FRONTEND_URL}/settings?success=twitter_connected`);
    } catch (error) {
      console.error('Twitter OAuth error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/settings?error=twitter_auth_failed`);
    }
  }
}

export const oauthController = new OAuthController();
