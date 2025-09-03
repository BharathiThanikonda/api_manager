# GitInsights - GitHub Repository Insights API

A powerful API platform that provides comprehensive insights into any GitHub repository. Get repository summaries, cool facts, star counts, latest versions, website URLs, and license information with a simple API call.

## 🌐 Live Demo

**Deployed Application:** [https://git-insights-bharathi.vercel.app/](https://git-insights-bharathi.vercel.app/)



## 🚀 Quick Start

### 1. Visit the Application
Go to [https://git-insights-bharathi.vercel.app/](https://git-insights-bharathi.vercel.app/)

### 2. Sign In
Click "Start Free Analysis" to sign in with your Google account

### 3. Create API Key
- Navigate to the Dashboard
- Click "API Key" to create your first API key
- Choose between Development (100 req/min) or Production (1000 req/min)

### 4. Test the API
- Go to the API Playground
- Enter your API key and a GitHub repository URL
- Click "Analyze Repository" to see results

## 📚 API Usage

### Endpoint
```
POST /api/github-summarizer
```

### Headers
```
Content-Type: application/json
x-apikey-header: YOUR_API_KEY
```

### Request Body
```json
{
  "repositoryUrl": "https://github.com/langchain-ai/langchain",
  "summaryType": "general"
}
```

### Response Format
```json
{
  "summary": "LangChain is a framework for developing applications powered by language models...",
  "cool_facts": [
    "Built by LangChain AI team",
    "Supports multiple language models",
    "Has extensive documentation"
  ],
  "stars": 56789,
  "latest_version": "v0.1.0",
  "website_url": "https://langchain.com",
  "license": "MIT"
}
```

## 🏗️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **NextAuth.js** - Authentication library
- **React Hooks** - State management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - PostgreSQL database and authentication
- **LangChain** - AI-powered text generation
- **GitHub API** - Repository data fetching

### Infrastructure
- **Vercel** - Hosting and deployment platform
- **PostgreSQL** - Database for API keys and usage tracking
- **Google OAuth** - User authentication

## 🔧 Rate Limits

### Development Keys
- **100 requests per minute**
- **1,000 requests per hour**
- **10,000 requests per day**
- **100,000 requests per month**

### Production Keys
- **1,000 requests per minute**
- **10,000 requests per hour**
- **100,000 requests per day**
- **1,000,000 requests per month**

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google OAuth credentials

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd api_manager
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env.local
```

Fill in your environment variables:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

4. **Set up database**


5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)



