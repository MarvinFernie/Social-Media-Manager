import axios from 'axios';
import { JSDOM } from 'jsdom';

interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

class LinkPreviewService {
  async getPreview(url: string): Promise<LinkPreview> {
    try {
      // Validate URL
      new URL(url);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SocialMediaManager/1.0)'
        },
        timeout: 5000,
        maxRedirects: 3
      });

      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      // Extract metadata
      const preview: LinkPreview = { url };

      // Try to get Open Graph tags first
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      const ogSiteName = document.querySelector('meta[property="og:site_name"]');

      if (ogTitle) {
        preview.title = (ogTitle as HTMLMetaElement).content;
      } else {
        const titleTag = document.querySelector('title');
        if (titleTag) preview.title = titleTag.textContent || undefined;
      }

      if (ogDescription) {
        preview.description = (ogDescription as HTMLMetaElement).content;
      } else {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) preview.description = (metaDescription as HTMLMetaElement).content;
      }

      if (ogImage) {
        preview.image = this.resolveUrl((ogImage as HTMLMetaElement).content, url);
      }

      if (ogSiteName) {
        preview.siteName = (ogSiteName as HTMLMetaElement).content;
      }

      return preview;
    } catch (error) {
      console.error('Link preview error:', error);
      // Return basic preview even if scraping fails
      return { url };
    }
  }

  private resolveUrl(possibleUrl: string, baseUrl: string): string {
    try {
      // If it's already a full URL, return it
      new URL(possibleUrl);
      return possibleUrl;
    } catch {
      // Otherwise, resolve it relative to the base URL
      return new URL(possibleUrl, baseUrl).toString();
    }
  }
}

export const linkPreviewService = new LinkPreviewService();
