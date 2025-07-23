# Social Media Manager - Product Specification v2

## Overview
A lightweight web application that enables users to create content once and automatically adapt it for multiple social media platforms using AI. The system generates platform-optimized versions with varying tones, allowing users to review, refine, and post content efficiently.

## Core Features

### 1. Content Input & Management
- **Multi-format Input**: Support for text, images, videos, and links
- **Link Preview**: Basic metadata display for links within the application
- **Campaign Storage**: Content saved as multi-platform campaigns
- **Draft Persistence**: Indefinite storage of draft campaigns
- **Platform Selection**: Toggle interface to select target platforms for each post

### 2. AI-Powered Content Adaptation
- **Automatic Optimization**: LLM adapts content following platform-specific best practices:
  - Character limits
  - Hashtag conventions
  - Link embedding standards
  - Platform-appropriate formatting
- **Multi-tone Generation**: 3 versions per platform with platform-appropriate tone variations
- **Iterative Refinement**: Chat interface for refining selected versions
- **Provider Flexibility**: Support for OpenAI, Anthropic, and Gemini with:
  - User-configurable model selection
  - Sensible default models per provider

### 3. Supported Platforms
**Initial Launch:**
- LinkedIn
- X (Twitter)

**Architecture designed for easy expansion to other social platforms**

### 4. User Authentication & Account Management
- **Identity Providers**: 
  - LinkedIn
  - X
  - Google
- **Social Media Connections**: One-time OAuth connection with automatic background token management
- **Secure Storage**: Encrypted storage of:
  - LLM provider API keys (critical security requirement)
  - OAuth tokens
  - User preferences
  - Draft campaigns
- **Revocation Capabilities**: Users should have a way to revoke their LLM keys and social media integrations

## User Flow

### 1. Initial Setup
1. User authenticates via chosen identity provider (LinkedIn/X/Google)
2. User connects social media accounts (one-time OAuth flow)
3. User configures LLM provider and API key (securely stored)

### 2. Content Creation Flow
1. **Input Phase** (Left Panel):
   - User enters content (text, images, videos, links)
   - System displays basic link metadata
   - User toggles target platforms on/off

2. **Generation Phase**:
   - LLM generates 3 tone variations per selected platform
   - Each version optimized for platform best practices

3. **Review Phase** (Right Panel):
   - Platform-grouped display of generated versions
   - User selects preferred version per platform
   - Chat interface for iterative refinement

4. **Action Phase**:
   - Save as draft campaign
   - Post to individual platform
   - Post to all platforms simultaneously

### 3. Publishing & Error Handling
- **Individual Platform Posting**: Post to single platform from its draft
- **Bulk Posting**: Accept all drafts and post simultaneously
- **Failed Posts**: Manual retry option with clear error messaging

## Technical Requirements

### Security & Privacy
- **Data Access Control**: All data accessible only to authenticated user
- **Authentication**: All data requests authenticated using identity provider user ID
- **Encryption**: All sensitive data encrypted at rest, especially:
  - LLM API keys
  - OAuth tokens
  - User content
- **Data Isolation**: Strict user-level data segregation

### File Handling
- **Format Support**: Standard image and video formats
- **Size Validation**: Platform-specific file size limit enforcement
- **Original Asset Preservation**: No modification of uploaded media

### LLM Integration
- **Supported Providers**:
  - OpenAI (default model: specified by user)
  - Anthropic (default model: specified by user)
  - Gemini (default model: specified by user)
- **Platform Intelligence**: LLM understands and applies platform-specific:
  - Character limits
  - Best practices
  - Tone appropriateness
  - Link embedding conventions

### Platform Framework
- **Extensible Architecture**: Modular design for easy platform additions
- **Platform Abstraction**: Common interface with platform-specific implementations
- **Configuration-Driven**: Platform rules and limits in configuration files

## Data Models

### Campaign
```
- Campaign ID (unique)
- User ID (from identity provider)
- Created/Updated timestamps
- Original content:
  - Text
  - Media files (images/videos)
  - Links
- Platform versions:
  - Platform name
  - 3 generated variations
  - Selected/refined version
  - Post status
```

### User Profile
```
- User ID (from identity provider)
- Connected accounts:
  - Platform
  - OAuth tokens
  - Connection status
- LLM configuration:
  - Provider
  - Model
  - Encrypted API key
- Preferences
```

### Generated Content
```
- Platform
- Tone variation (1-3)
- Generated text
- Media references
- Iteration history
- Platform-specific metadata
```

## Non-Functional Requirements

### Performance
- Content generation < 10 seconds per platform
- Real-time link preview
- Responsive UI during generation

### Scalability
- Stateless architecture for horizontal scaling
- Efficient campaign storage
- CDN for media delivery

### Reliability
- Graceful handling of API failures
- Queue-based posting for reliability
- Clear error messaging

## Success Metrics
- Time saved: Measure reduction in time from idea to multi-platform posting
- Content quality: Track user satisfaction with generated variations
- Platform coverage: Percentage of posts using multiple platforms
- User retention: Active users over time

## Future Enhancements
- Additional platforms (Instagram, TikTok, Facebook, etc.)
- Post scheduling
- Analytics integration
- Team collaboration features
- Advanced templates
- Thread/article support
- Content calendar view

## Implementation Priorities
1. Core authentication and security
2. Basic content input and campaign management
3. LLM integration with tone variations
4. LinkedIn and X posting
5. Iterative refinement interface
6. Error handling and retry mechanisms
