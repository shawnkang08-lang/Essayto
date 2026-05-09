# ESSAYTO Setup Guide

## Quick Start (After Docker is Installed)

### 1. Start Everything
Just double-click: **`start-dev.bat`**

This will:
- Start PostgreSQL and Redis in Docker
- Run database migrations
- Start the backend and frontend servers

### 2. Access ESSAYTO
- **Backend API:** http://localhost:3000
- **Frontend:** http://localhost:5173
- **Health Check:** http://localhost:3000/health

---

## Manual Setup

### Start Docker Containers
```bash
docker-compose up -d
```

### Run Database Migrations
```bash
npm run migrate --workspace=backend
```

### Start Development Servers
```bash
npm run dev
```

---

## Useful Commands

### Check if Docker containers are running
```bash
docker ps
```

### View container logs
```bash
docker logs essayto-postgres
docker logs essayto-redis
```

### Stop containers
```bash
docker-compose down
```

### Reset database (WARNING: Deletes all data)
```bash
docker-compose down -v
docker-compose up -d
npm run migrate --workspace=backend
```

---

## Configuration

### Environment Variables
Edit `packages/backend/.env` to configure:
- OpenAI API key (required for AI features)
- JWT secret
- Database credentials
- Redis settings

### OpenAI API Key
1. Get your API key from: https://platform.openai.com/api-keys
2. Open `packages/backend/.env`
3. Replace `your-openai-api-key-here` with your actual key

---

## Troubleshooting

### "Docker is not running"
- Make sure Docker Desktop is open and running
- Look for the whale icon in your system tray

### "Port already in use"
- Another app is using port 5432 or 6379
- Stop the other app or change ports in `docker-compose.yml`

### "Cannot connect to database"
- Wait 10 seconds after starting Docker
- Run: `docker logs essayto-postgres` to check for errors

### "Migrations failed"
- Make sure PostgreSQL container is running
- Try: `docker-compose restart postgres`
- Then run migrations again

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Essays
- `POST /api/essays/draft` - Save draft
- `POST /api/essays/:id/submit` - Submit for correction
- `GET /api/essays` - List essays
- `GET /api/essays/:id` - Get essay details

### Progress
- `GET /api/progress` - Get user progress
- `GET /api/progress/trends` - Get score trends
- `GET /api/progress/achievements` - Get achievements

### Topics
- `POST /api/topics/generate` - Generate topic
- `GET /api/topics/history` - Get topic history

### Translation
- `POST /api/translate` - Translate text

### Language Detection
- `POST /api/language/detect` - Detect language

---

## Development

### Backend Only
```bash
npm run dev --workspace=backend
```

### Frontend Only
```bash
npm run dev --workspace=frontend
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

---

## Production Build

```bash
npm run build
npm start
```

---

Need help? Check the logs or restart Docker containers!
