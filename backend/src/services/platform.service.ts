import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import { AppDataSource } from '../config/database';
import { SocialAccount } from '../models/SocialAccount';
import { PlatformContent, Platform, PostStatus } from '../models/PlatformContent';
import { Campaign } from '../models/Campaign';
import { User } from '../models/User';
import { encryptionService } from '../utils/encryption';
import { AppError } from '../middleware/errorHandler';

interface PlatformLimits {
  characterLimit: number;
  mediaLimit: number;
  videoSizeLimit: number;
  imageSizeLimit: number;
  supportedFormats: string[];
}

interface PublishResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

class PlatformService {
  getPlatformLimits(platform: Platform): PlatformLimits {
    const limits = {
      [Platform.LINKEDIN]: {
        characterLimit: 3000,
        mediaLimit: 9,
        videoSizeLimit: 5 * 1024 * 1024 * 1024, // 5GB
        imageSizeLimit: 10 * 1024 * 1024, // 10MB
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4']
      },
      [Platform.TWITTER]: {
        characterLimit: 280,
        mediaLimit: 4,
        videoSizeLimit: 512 * 1024 * 1024, // 512MB
        imageSizeLimit: 5 * 1024 * 1024, // 5MB
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov']
      }
    };
    return limits[platform];
  }

  async getOAuthUrl(platform: Platform, userId: string): Promise<string> {
    switch (platform) {
      case Platform.LINKEDIN:
        return this.getLinkedInOAuthUrl(userId);
      case Platform.TWITTER:
        return this.getTwitterOAuthUrl(userId);
      default:
        throw new AppError('Platform not supported', 400);
    }
  }

  private getLinkedInOAuthUrl(userId: string): string {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL}/api/platforms/callback/linkedin`;
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    const scope = 'r_liteprofile r_emailaddress w_member_social';
    
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
  }

  private getTwitterOAuthUrl(userId: string): string {
    // Twitter OAuth 2.0 implementation
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL}/api/platforms/callback/twitter`;
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    const scope = 'tweet.read tweet.write users.read offline.access';
    const codeChallenge = 'challenge'; // In production, generate proper PKCE challenge
    
    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`;
  }

  async refreshToken(account: SocialAccount): Promise<boolean> {
    if (!account.encryptedRefreshToken) {
      return false;
    }

    try {
      const refreshToken = encryptionService.decrypt(account.encryptedRefreshToken);
      
      switch (account.platform) {
        case Platform.LINKEDIN:
          return await this.refreshLinkedInToken(account, refreshToken);
        case Platform.TWITTER:
          return await this.refreshTwitterToken(account, refreshToken);
        default:
          return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  private async refreshLinkedInToken(account: SocialAccount, refreshToken: string): Promise<boolean> {
    // LinkedIn doesn't support refresh tokens, tokens are valid for 60 days
    // In production, implement proper token management
    return false;
  }

  private async refreshTwitterToken(account: SocialAccount, refreshToken: string): Promise<boolean> {
    try {
      const client = new TwitterApi({
        clientId: process.env.TWITTER_CLIENT_ID!,
        clientSecret: process.env.TWITTER_CLIENT_SECRET!
      });

      const { accessToken, refreshToken: newRefreshToken } = await client.refreshOAuth2Token(refreshToken);

      const socialAccountRepository = AppDataSource.getRepository(SocialAccount);
      account.encryptedAccessToken = encryptionService.encrypt(accessToken);
      if (newRefreshToken) {
        account.encryptedRefreshToken = encryptionService.encrypt(newRefreshToken);
      }
      account.tokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      
      await socialAccountRepository.save(account);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getPlatformProfile(account: SocialAccount): Promise<any> {
    const accessToken = encryptionService.decrypt(account.encryptedAccessToken);
    
    switch (account.platform) {
      case Platform.LINKEDIN:
        return await this.getLinkedInProfile(accessToken);
      case Platform.TWITTER:
        return await this.getTwitterProfile(accessToken);
      default:
        throw new AppError('Platform not supported', 400);
    }
  }

  private async getLinkedInProfile(accessToken: string): Promise<any> {
    try {
      // Get basic profile information
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Get email address (requires separate API call)
      const emailResponse = await axios.get(
        'https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const emailData = emailResponse.data.elements.find(
        (element: any) => element.type === 'EMAIL'
      );
      const email = emailData?.['handle~']?.emailAddress || '';
      
      return {
        id: profileResponse.data.id,
        name: `${profileResponse.data.localizedFirstName} ${profileResponse.data.localizedLastName}`,
        email: email,
        firstName: profileResponse.data.localizedFirstName,
        lastName: profileResponse.data.localizedLastName
      };
    } catch (error) {
      console.error('Error fetching LinkedIn profile:', error);
      throw new AppError('Failed to fetch LinkedIn profile', 500);
    }
  }

  private async getTwitterProfile(accessToken: string): Promise<any> {
    const client = new TwitterApi(accessToken);
    const user = await client.v2.me();
    return user.data;
  }

  async publishContent(
    platformContent: PlatformContent,
    campaign: Campaign,
    user: User
  ): Promise<PublishResult> {
    const socialAccountRepository = AppDataSource.getRepository(SocialAccount);
    const account = await socialAccountRepository.findOne({
      where: {
        userId: user.id,
        platform: platformContent.platform,
        isActive: true
      }
    });

    if (!account) {
      throw new AppError(`${platformContent.platform} account not connected`, 400);
    }

    const content = platformContent.finalContent || platformContent.selectedContent || platformContent.variations[0].content;
    
    try {
      let result: PublishResult;
      
      switch (platformContent.platform) {
        case Platform.LINKEDIN:
          result = await this.publishToLinkedIn(content, campaign.mediaFiles, account);
          break;
        case Platform.TWITTER:
          result = await this.publishToTwitter(content, campaign.mediaFiles, account);
          break;
        default:
          throw new AppError('Platform not supported', 400);
      }

      // Update platform content with publish results
      const platformContentRepository = AppDataSource.getRepository(PlatformContent);
      platformContent.status = result.success ? PostStatus.POSTED : PostStatus.FAILED;
      platformContent.postId = result.postId || null;
      platformContent.postUrl = result.postUrl || null;
      platformContent.postedAt = result.success ? new Date() : null;
      await platformContentRepository.save(platformContent);

      return result;
    } catch (error) {
      console.error('Publishing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AppError(`Failed to publish to ${platformContent.platform}: ${errorMessage}`, 500);
    }
  }

  private async publishToLinkedIn(
    content: string,
    mediaFiles: any,
    account: SocialAccount
  ): Promise<PublishResult> {
    try {
      const accessToken = encryptionService.decrypt(account.encryptedAccessToken);
      
      // First, get the user's LinkedIn profile ID
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const profileId = profileResponse.data.id;
      
      // Prepare the share content according to LinkedIn API v2 specification
      const shareContent = {
        author: `urn:li:person:${profileId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };
      
      // Post to LinkedIn
      const postResponse = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        shareContent,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );
      
      // Extract the post ID from the response header
      const postUrn = postResponse.headers['x-linkedin-id'] || postResponse.headers['x-restli-id'];
      const postId = postUrn ? postUrn.split(':').pop() : 'unknown';
      
      return {
        platform: Platform.LINKEDIN,
        success: true,
        postId: postId,
        postUrl: `https://www.linkedin.com/feed/update/urn:li:share:${postId}`
      };
    } catch (error: any) {
      console.error('LinkedIn publishing error:', error.response?.data || error.message);
      return {
        platform: Platform.LINKEDIN,
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error'
      };
    }
  }

  private async publishToTwitter(
    content: string,
    mediaFiles: any,
    account: SocialAccount
  ): Promise<PublishResult> {
    try {
      const accessToken = encryptionService.decrypt(account.encryptedAccessToken);
      const client = new TwitterApi(accessToken);
      
      const tweet = await client.v2.tweet(content);
      
      return {
        platform: Platform.TWITTER,
        success: true,
        postId: tweet.data.id,
        postUrl: `https://twitter.com/${account.username}/status/${tweet.data.id}`
      };
    } catch (error) {
      return {
        platform: Platform.TWITTER,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const platformService = new PlatformService();








