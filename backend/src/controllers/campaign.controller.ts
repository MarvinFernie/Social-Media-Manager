import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { PlatformContent, Platform } from '../models/PlatformContent';
import { AppError } from '../middleware/errorHandler';
import { llmService } from '../services/llm.service';
import { platformService } from '../services/platform.service';

class CampaignController {
  async getCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const campaignRepository = AppDataSource.getRepository(Campaign);
      
      const campaigns = await campaignRepository.find({
        where: { userId: user.id },
        relations: ['platformContents'],
        order: { createdAt: 'DESC' }
      });

      res.json({
        status: 'success',
        data: { campaigns }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user!;
      const campaignRepository = AppDataSource.getRepository(Campaign);
      
      const campaign = await campaignRepository.findOne({
        where: { id, userId: user.id },
        relations: ['platformContents']
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404);
      }

      res.json({
        status: 'success',
        data: { campaign }
      });
    } catch (error) {
      next(error);
    }
  }

  async createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, originalContent, mediaFiles, links } = req.body;
      const user = req.user!;

      if (!title || !originalContent) {
        throw new AppError('Title and content are required', 400);
      }

      const campaignRepository = AppDataSource.getRepository(Campaign);
      
      const campaign = campaignRepository.create({
        userId: user.id,
        title,
        originalContent,
        mediaFiles,
        links,
        status: CampaignStatus.DRAFT
      });

      await campaignRepository.save(campaign);

      res.status(201).json({
        status: 'success',
        data: { campaign }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user!;
      const campaignRepository = AppDataSource.getRepository(Campaign);
      
      const campaign = await campaignRepository.findOne({
        where: { id, userId: user.id }
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404);
      }

      await campaignRepository.update(id, req.body);
      
      const updatedCampaign = await campaignRepository.findOne({
        where: { id },
        relations: ['platformContents']
      });

      res.json({
        status: 'success',
        data: { campaign: updatedCampaign }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user!;
      const campaignRepository = AppDataSource.getRepository(Campaign);
      
      const result = await campaignRepository.delete({
        id,
        userId: user.id
      });

      if (result.affected === 0) {
        throw new AppError('Campaign not found', 404);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async generatePlatformContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { platforms } = req.body;
      const user = req.user!;

      if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
        throw new AppError('Platforms array is required', 400);
      }

      const campaignRepository = AppDataSource.getRepository(Campaign);
      const campaign = await campaignRepository.findOne({
        where: { id, userId: user.id }
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404);
      }

      if (!user.encryptedApiKey) {
        throw new AppError('Please configure your LLM API key first', 400);
      }

      // Generate content for each platform
      const generatedContent = await llmService.generateContentVariations(
        campaign,
        platforms,
        user
      );

      // Save platform content
      const platformContentRepository = AppDataSource.getRepository(PlatformContent);
      
      for (const [platform, variations] of Object.entries(generatedContent)) {
        const platformContent = platformContentRepository.create({
          campaignId: campaign.id,
          platform: platform as Platform,
          variations
        });
        await platformContentRepository.save(platformContent);
      }

      const updatedCampaign = await campaignRepository.findOne({
        where: { id },
        relations: ['platformContents']
      });

      res.json({
        status: 'success',
        data: { campaign: updatedCampaign }
      });
    } catch (error) {
      next(error);
    }
  }

  async refineContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { platformContentId, prompt, selectedVariationIndex } = req.body;
      const user = req.user!;

      if (!platformContentId || !prompt) {
        throw new AppError('Platform content ID and prompt are required', 400);
      }

      const campaignRepository = AppDataSource.getRepository(Campaign);
      const campaign = await campaignRepository.findOne({
        where: { id, userId: user.id }
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404);
      }

      const platformContentRepository = AppDataSource.getRepository(PlatformContent);
      const platformContent = await platformContentRepository.findOne({
        where: { id: platformContentId, campaignId: id }
      });

      if (!platformContent) {
        throw new AppError('Platform content not found', 404);
      }

      // Get the content to refine
      const contentToRefine = selectedVariationIndex !== undefined
        ? platformContent.variations[selectedVariationIndex].content
        : platformContent.selectedContent || platformContent.variations[0].content;

      // Refine using LLM
      const refinedContent = await llmService.refineContent(
        contentToRefine,
        prompt,
        platformContent.platform,
        user
      );

      // Update platform content
      platformContent.selectedContent = refinedContent;
      platformContent.iterationHistory = [
        ...(platformContent.iterationHistory || []),
        {
          timestamp: new Date(),
          content: refinedContent,
          prompt
        }
      ];

      await platformContentRepository.save(platformContent);

      res.json({
        status: 'success',
        data: { platformContent }
      });
    } catch (error) {
      next(error);
    }
  }

  async publishCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user!;

      const campaignRepository = AppDataSource.getRepository(Campaign);
      const campaign = await campaignRepository.findOne({
        where: { id, userId: user.id },
        relations: ['platformContents']
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404);
      }

      const results = [];

      for (const platformContent of campaign.platformContents) {
        try {
          const result = await platformService.publishContent(
            platformContent,
            campaign,
            user
          );
          results.push(result);
        } catch (error) {
          results.push({
            platform: platformContent.platform,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Update campaign status
      campaign.status = CampaignStatus.PUBLISHED;
      await campaignRepository.save(campaign);

      res.json({
        status: 'success',
        data: { results }
      });
    } catch (error) {
      next(error);
    }
  }

  async publishToPlatform(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, platform } = req.params;
      const user = req.user!;

      const campaignRepository = AppDataSource.getRepository(Campaign);
      const campaign = await campaignRepository.findOne({
        where: { id, userId: user.id },
        relations: ['platformContents']
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404);
      }

      const platformContent = campaign.platformContents.find(
        pc => pc.platform === platform
      );

      if (!platformContent) {
        throw new AppError(`No content found for platform ${platform}`, 404);
      }

      const result = await platformService.publishContent(
        platformContent,
        campaign,
        user
      );

      res.json({
        status: 'success',
        data: { result }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const campaignController = new CampaignController();

