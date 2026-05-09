# ESSAYTO - AI Essay Coach & Corrector

AI-powered essay coaching platform supporting Indonesian, Chinese, and English languages.

## Features

- Multi-language essay correction (ID/CN/EN)
- Real-time grammar and vocabulary feedback
- Progress tracking and analytics
- Personalized topic generation
- PDF export functionality
- Mobile and web support

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- TailwindCSS
- React Query
- Kiro (mobile deployment)

**Backend:**
- Node.js + Express
- PostgreSQL
- Redis
- OpenAI API

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- OpenAI API key

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd essayto-monorepo
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Backend
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env with your configuration

# Frontend
cp packages/frontend/.env.example packages/frontend/.env
# Edit packages/frontend/.env with your configuration
```

4. Set up database
```bash
# Create PostgreSQL database
createdb essayto

# Run migrations (after implementing migration system)
npm run migrate --workspace=backend
```

5. Start development servers
```bash
npm run dev
```

This will start:
- Backend API: http://localhost:3000
- Frontend: http://localhost:5173

## Project Structure

```
essayto-monorepo/
├── packages/
│   ├── backend/          # Node.js API server
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── config/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   └── utils/
│   │   └── package.json
│   └── frontend/         # React application
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   └── utils/
│       └── package.json
└── package.json
```

## Development

### Backend
```bash
npm run dev:backend
```

### Frontend
```bash
npm run dev:frontend
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

## License

Proprietary
