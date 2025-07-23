import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Campaign } from '../models/Campaign';
import { Platform } from '../models/PlatformContent';
import { User, LLMProvider } from '../models/User';
import { encryptionService } from '../utils/encryption';
import { AppError } from '../middleware/errorHandler';

interface ContentVariation {
  tone: string;
  content: string;
}

class LLMService {
  private getPlatformGuidelines(platform: Platform): string {
    const guidelines = {
      [Platform.LINKEDIN]: `
        - Professional tone, industry insights
        - Character limit: 3000
        - Best practices: Use relevant hashtags (3-5), mention industry leaders, include a call-to-action
        - Format: Well-structured paragraphs with clear spacing
      `,
      [Platform.TWITTER]: `
        - Concise, engaging, conversational
        - Character limit: 280 (or thread if needed)
        - Best practices: Use 1-2 hashtags, include mentions, emojis for engagement
        - Format: Short, punchy sentences or thread format
      `
    };
    return guidelines[platform];
  }

  private getToneVariations(platform: Platform): string[] {
    const tones = {
      [Platform.LINKEDIN]: ['Professional & Informative', 'Thought Leadership', 'Engaging & Conversational'],
      [Platform.TWITTER]: ['Casual & Fun', 'Direct & Informative', 'Engaging Question']
    };
    return tones[platform];
  }

  async generateContentVariations(
    campaign: Campaign,
    platforms: Platform[],
    user: User
  ): Promise<Record<Platform, ContentVariation[]>> {
    if (!user.encryptedApiKey || !user.llmProvider) {
      throw new AppError('LLM configuration not found', 400);
    }

    const apiKey = encryptionService.decrypt(user.encryptedApiKey);
    const results: Record<Platform, ContentVariation[]> = {} as any;

    for (const platform of platforms) {
      const tones = this.getToneVariations(platform);
      const guidelines = this.getPlatformGuidelines(platform);
      
      const variations: ContentVariation[] = [];

      for (const tone of tones) {
        const prompt = `
          Adapt the following content for ${platform} with a ${tone} tone:
          
          Original Content: ${campaign.originalContent}
          
          Platform Guidelines: ${guidelines}
          
          Please create an optimized version that follows the platform's best practices and character limits.
          Include appropriate hashtags and formatting for ${platform}.
          
          Return only the adapted content without any explanations.
        `;

        const content = await this.generateWithProvider(
          user.llmProvider,
          apiKey,
          user.llmModel || this.getDefaultModel(user.llmProvider),
          prompt
        );

        variations.push({ tone, content });
      }

      results[platform] = variations;
    }

    return results;
  }

  async refineContent(
    content: string,
    prompt: string,
    platform: Platform,
    user: User
  ): Promise<string> {
    if (!user.encryptedApiKey || !user.llmProvider) {
      throw new AppError('LLM configuration not found', 400);
    }

    const apiKey = encryptionService.decrypt(user.encryptedApiKey);
    const guidelines = this.getPlatformGuidelines(platform);

    const refinementPrompt = `
      Current ${platform} content: ${content}
      
      User request: ${prompt}
      
      Platform Guidelines: ${guidelines}
      
      Please refine the content according to the user's request while maintaining platform best practices.
      Return only the refined content without any explanations.
    `;

    return await this.generateWithProvider(
      user.llmProvider,
      apiKey,
      user.llmModel || this.getDefaultModel(user.llmProvider),
      refinementPrompt
    );
  }

  private async generateWithProvider(
    provider: LLMProvider,
    apiKey: string,
    model: string,
    prompt: string
  ): Promise<string> {
    try {
      switch (provider) {
        case LLMProvider.OPENAI:
          return await this.generateWithOpenAI(apiKey, model, prompt);
        case LLMProvider.ANTHROPIC:
          return await this.generateWithAnthropic(apiKey, model, prompt);
        case LLMProvider.GEMINI:
          return await this.generateWithGemini(apiKey, model, prompt);
        default:
          throw new AppError('Invalid LLM provider', 400);
      }
    } catch (error) {
      console.error('LLM generation error:', error);
      throw new AppError('Failed to generate content. Please check your API key and try again.', 500);
    }
  }

  private async generateWithOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
    const openai = new OpenAI({ apiKey });
    
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content || '';
  }

  private async generateWithAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
    const anthropic = new Anthropic({ apiKey });
    
    const response = await anthropic.messages.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  private async generateWithGemini(apiKey: string, model: string, prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private getDefaultModel(provider: LLMProvider): string {
    const defaults = {
      [LLMProvider.OPENAI]: 'gpt-4',
      [LLMProvider.ANTHROPIC]: 'claude-3-sonnet-20240229',
      [LLMProvider.GEMINI]: 'gemini-pro'
    };
    return defaults[provider];
  }
}

export const llmService = new LLMService();
