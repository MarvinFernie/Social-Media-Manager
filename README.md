# Social Media Manager

A web application that enables users to create content once and automatically adapt it for multiple social media platforms using AI. The system generates platform-optimized versions with varying tones, allowing users to review, refine, and post content efficiently.

## Features

- 🔐 **OAuth Authentication** - Sign in with Google or LinkedIn
- 🤖 **AI-Powered Content Adaptation** - Support for OpenAI, Anthropic, and Gemini
- 📱 **Multi-Platform Support** - Currently supports LinkedIn and Twitter/X
- 🎨 **Tone Variations** - Generate 3 different tone variations per platform
- ✏️ **Content Refinement** - Iteratively refine generated content with AI
- 🔒 **Secure API Key Storage** - Encrypted storage of LLM API keys
- 📤 **Direct Publishing** - Post directly to social media platforms

## Tech Stack

### Backend
- Node.js with Express.js
- TypeScript
- PostgreSQL with TypeORM
- JWT Authentication
- OAuth 2.0 (Google, LinkedIn)
- Encryption for sensitive data

### Frontend
- React with TypeScript
- Material-UI
- React Router
- React Query (TanStack Query)
- Axios for API calls

## Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL
- API keys for:
  - Google OAuth
  - LinkedIn OAuth
  - LLM provider (OpenAI/Anthropic/Gemini)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with:
   - Database connection string
   - OAuth credentials
   - JWT secret
   - Encryption key

5. Run the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with:
   - Backend API URL
   - Google OAuth client ID

5. Run the development server:
```bash
npm start
```

## Deployment

Both frontend and backend are configured for deployment on Fly.io.

### Deploy Backend
```bash
cd backend
fly deploy
```

### Deploy Frontend
```bash
cd frontend
fly deploy
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/        # Database and passport config
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth and error handling
│   │   ├── models/        # TypeORM entities
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.tsx        # Main app component
│   └── Dockerfile
│
└── specs/                 # Product and development specifications
```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/linkedin` - LinkedIn OAuth login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/llm-config` - Update LLM configuration

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns/:id/generate` - Generate platform content
- `POST /api/campaigns/:id/refine` - Refine content with AI
- `POST /api/campaigns/:id/publish` - Publish to all platforms

### Platform Management
- `GET /api/platforms/accounts` - Get connected accounts
- `POST /api/platforms/connect/:platform` - Connect platform
- `GET /api/platforms/:platform/limits` - Get platform limits

## Contributing

Please read the development specification in `specs/development-spec.md` for development guidelines and best practices.

## License

This project is licensed under the MIT License.
