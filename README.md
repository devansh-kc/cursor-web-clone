# AI-Powered Code Editor (Cursor Clone)

A full-stack AI-powered code editor built with Next.js 16, Convex, and multiple AI integrations. This application replicates and extends the functionality of Cursor, providing an intelligent coding environment with real-time collaboration, AI assistance, and in-browser code execution.

## ✨ Features

- **Intelligent Code Editor**: Powered by CodeMirror 6 with custom extensions and One Dark theme for a premium coding experience
- **Multi-Model AI Assistance**: Choose between Claude Sonnet 4 (preferred) or Google Gemini 2.0 Flash (free tier) for:
  - Code generation and completion
  - Code explanation and documentation
  - Bug fixing and refactoring suggestions
  - Natural language to code conversion
- **In-Browser Code Execution**: Leverage WebContainer API with xterm.js to run code directly in the browser
- **Real-time Backend**: Convex for synchronous data updates and collaborative features
- **Authentication**: Secure user management with Clerk, including GitHub OAuth integration
- **Web Crawling Capabilities**: Firecrawl AI integration for intelligent web content extraction and analysis
- **Background Job Processing**: Inngest handles asynchronous tasks efficiently
- **Error Tracking**: Sentry integration for comprehensive error monitoring and debugging
- **Modern UI Components**: Beautiful, accessible interface built with shadcn/ui and Radix UI primitives

## 🛠️ Technology Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Editor** | CodeMirror 6, Custom Extensions, One Dark Theme |
| **Backend** | Convex (Real-time Database) |
| **Background Jobs** | Inngest |
| **AI Integration** | Claude Sonnet 4 (preferred), Google Gemini 2.0 Flash, Firecrawl AI |
| **Authentication** | Clerk with GitHub OAuth |
| **Code Execution** | WebContainer API, xterm.js |
| **UI Components** | shadcn/ui, Radix UI |
| **Error Monitoring** | Sentry |

## 📋 Prerequisites

Before you begin, ensure you have the following:

- [Node.js](https://nodejs.org/) (v20 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)
- [Convex](https://www.convex.dev/) account
- [Clerk](https://clerk.com/) account
- [Inngest](https://www.inngest.com/) account (for background jobs)
- [Sentry](https://sentry.io/) account (for error tracking)
- API Keys for:
  - Google Gemini 2.0 Flash (free tier available)
  - Claude Sonnet 4 (Anthropic API - optional, preferred)
  - Firecrawl AI

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/devansh-kc/cursor-web-clone.git
cd cursor-web-clone
```
### 2.Install dependencies

``` bash
npm install
# or
yarn install
# or
pnpm install
```
### 3. Set up environment variables
Create a .env.local file in the root directory:
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>

# Convex
NEXT_PUBLIC_CONVEX_URL=<your-convex-deployment-url>

# AI Providers
GEMINI_API_KEY=<your-google-gemini-api-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>  # For Claude Sonnet 4
FIREcrawl_API_KEY=<your-firecrawl-api-key>

# Inngest
INNGEST_EVENT_KEY=<your-inngest-event-key>
INNGEST_SIGNING_KEY=<your-inngest-signing-key>

# Sentry
SENTRY_DSN=<your-sentry-dsn>
NEXT_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
```
