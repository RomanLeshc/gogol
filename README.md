# Gogol AI Agent Onboarding Platform

A Next.js application for creating and managing AI agents with onboarding flow, chat widget, and simplified admin interface.

## Assumptions

1. **API Endpoints**: All API endpoints match the existing React app's contracts. The API client (`lib/api.ts`) mirrors the exact structure from the original app.

2. **Authentication**: Uses the same token storage mechanism (localStorage keys: `token-538`, `refreshToken-538`) and refresh logic as the original app.

3. **Agent Creation**: Creating an "agent" maps to creating an "app" via `POST /apps`. The AI bot configuration is part of the app model.

4. **File Uploads**: File uploads use `POST /files` endpoint, then documents are created via `POST /docs` with file locations.

5. **Chat Integration**: Chat widget uses simulated responses. In production, this should connect to the actual chat API endpoint (e.g., `POST /api/chat/:agentId` or XMPP-based chat).

6. **Theme Persistence**: Theme preference is stored in localStorage and optionally synced with backend via `PATCH /api/users/me/theme` if available.

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE=https://api.ethoradev.com/v1
NEXT_PUBLIC_API_V2=https://api.ethoradev.com/v2

# Embed Configuration
NEXT_PUBLIC_EMBED_KEY=your-embed-key-here

# Optional: Sentry for error tracking
NEXT_PUBLIC_SENTRY_DSN=

# Optional: Domain name for app config
NEXT_PUBLIC_DOMAIN_NAME=
```

## Getting Started

### Installation

```bash
npm install
# or
pnpm install
```

### Development

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
# or
pnpm build
pnpm start
```

## Project Structure

```
next-app/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home/dashboard
│   ├── login/             # Login page
│   ├── onboard/           # Onboarding wizard
│   ├── agents/            # Agents list and detail
│   ├── admin/             # Simplified admin
│   └── embed/             # Embed instructions
├── components/             # React components
│   ├── OnboardWizard.tsx  # Multi-step onboarding
│   ├── FileUploader.tsx   # Drag-and-drop file upload
│   ├── ChatWidget.tsx     # Chat interface
│   ├── ThemeProvider.tsx  # Theme management
│   └── Header.tsx         # App header
├── lib/                    # Utilities and API client
│   ├── api.ts             # API client (mirrors original app)
│   ├── types.ts           # TypeScript types
│   ├── store.ts           # Zustand store
│   └── utils.ts           # Utility functions
├── public/                 # Static assets
│   └── embed.js           # Embed script for external sites
└── __tests__/              # Unit tests
```

## Features

### Authentication Flow

- **Login**: `POST /users/login-with-email` or social login via `POST /users/login`
- **Callback**: `GET /api/auth/callback?token=...` handles OAuth callbacks
- **User Info**: `GET /users/me` fetches current user
- **Logout**: `POST /users/logout`

The auth flow automatically redirects unauthenticated users to `/login` and checks for onboarding completion.

### Onboarding Flow

The onboarding wizard (`/onboard`) guides users through:

1. **Source Selection**: Choose between website URL or document upload
2. **Configuration**:
   - **Website**: URL, crawl depth, robots.txt respect, sitemap usage
   - **Documents**: Multi-file upload (PDF, DOCX, TXT) with progress tracking
3. **Agent Settings**: Name, persona prompt, allowed domains, public/private toggle
4. **Finalize**: Creates agent via `POST /apps` and configures sources

**API Calls Made During Onboarding**:
- `POST /apps` - Create agent/app
- `POST /sources/site-crawl/:appId` - Add website source (if website selected)
- `POST /files` - Upload files (if documents selected)
- `POST /docs` - Create documents from uploaded files

### Agents Management

- **List**: `/agents` - View all agents with status indicators
- **Detail**: `/agents/[id]` - View agent details, documents, indexing status, settings, and chat preview
- **Status**: Agents show status as "indexing", "ready", "error", or "pending"

### Chat Widget

The chat widget (`components/ChatWidget.tsx`) provides:
- Real-time messaging interface
- Streaming response simulation
- Agent persona display
- Message history

**Embedding the Widget**:

1. **Script Tag**:
```html
<script 
  src="https://your-domain.com/embed.js" 
  data-agent-id="YOUR_AGENT_ID" 
  data-api-base="https://api.ethoradev.com/v1"
  data-position="bottom-right">
</script>
```

2. **NPM Package**:
```bash
npm install @ethora/ai-widget
```

```javascript
import { initEthoraWidget } from '@ethora/ai-widget';

initEthoraWidget({
  agentId: 'YOUR_AGENT_ID',
  apiBase: 'https://api.ethoradev.com/v1',
  position: 'bottom-right',
  theme: 'light'
});
```

### Simplified Admin

The admin interface (`/admin/simple`) provides:
- Agent list with status overview
- Quick actions (start/stop, delete)
- Agent details panel
- Focused on the single onboarding path

### Theme Support

- Theme toggle in header (light/dark/system)
- Persisted in localStorage
- System theme follows OS preference
- Optional backend sync via `PATCH /api/users/me/theme`

## Testing

Run unit tests:

```bash
npm test
# or
pnpm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Test Coverage

Tests are located in `__tests__/` directory:
- `FileUploader.test.tsx` - File upload component tests
- `OnboardWizard.test.tsx` - Onboarding wizard navigation tests
- `ChatWidget.test.tsx` - Chat widget message flow tests

## API Integration

All API calls use the client in `lib/api.ts`, which mirrors the original React app's API structure:

- **Base URLs**: Configured via `NEXT_PUBLIC_API_BASE` and `NEXT_PUBLIC_API_V2`
- **Authentication**: Tokens stored in localStorage, auto-refresh on 401
- **Error Handling**: Centralized error handling with user-friendly messages
- **Request/Response**: Exact payload shapes match the original app

### Key Endpoints Used

- `POST /users/login-with-email` - Email login
- `POST /users/login` - Social login
- `GET /users/me` - Get current user
- `POST /apps` - Create agent/app
- `GET /apps` - List apps/agents
- `GET /apps/:id` - Get app/agent details
- `PUT /apps/:id` - Update app/agent
- `DELETE /apps/:id` - Delete app/agent
- `POST /sources/site-crawl/:appId` - Add website source
- `POST /files` - Upload file
- `POST /docs` - Create document

## Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

Ensure all required environment variables are set in your deployment platform (Vercel, Netlify, etc.).

### Static Export (Optional)

To export as static site, update `next.config.js`:

```javascript
const nextConfig = {
  output: 'export',
};
```

## Acceptance Tests

### Manual Testing Steps

1. **Sign In → Onboarding**:
   - Navigate to `/login`
   - Sign in with email/password
   - Should redirect to `/onboard` if no agents exist
   - Complete onboarding wizard
   - Verify agent is created and visible on home page

2. **Upload Documents → Agent Creation**:
   - Go to `/onboard`
   - Select "Upload Documents"
   - Upload PDF/DOCX/TXT files
   - Configure agent settings
   - Verify agent is created
   - Check indexing status becomes "Ready"

3. **Embed Script**:
   - Go to `/embed`
   - Copy embed script
   - Add to a basic HTML page
   - Verify widget appears and is functional

4. **Chat Widget**:
   - Navigate to `/agents/[id]`
   - Go to "Chat Preview" tab
   - Send a message
   - Verify response appears

### Expected API Calls

During onboarding:
1. `POST /users/login-with-email` (if logging in)
2. `GET /users/me` (check auth)
3. `POST /apps` (create agent)
4. `POST /sources/site-crawl/:appId` OR `POST /files` + `POST /docs` (configure source)
5. `GET /apps/:id` (verify creation)

## Development Notes

- **TypeScript**: Strict mode enabled, no `any` types in main code
- **Styling**: Tailwind CSS utility classes, no UI library dependencies
- **State Management**: Zustand for global state
- **Animations**: Framer Motion for transitions
- **Data Fetching**: Direct fetch calls (can be replaced with SWR/React Query if needed)

## License

[Your License Here]

