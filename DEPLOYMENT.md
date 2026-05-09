# Deployment Guide

This guide will help you deploy ESSAYTO to the internet.

## Prerequisites

1. GitHub account
2. Vercel account (for frontend) - https://vercel.com
3. Railway account (for backend + database) - https://railway.app
4. Groq API key - https://console.groq.com

## Step 1: Push to GitHub

1. Create a new repository on GitHub: https://github.com/new
2. Name it `essayto` (or whatever you prefer)
3. Don't initialize with README (we already have one)
4. Copy the repository URL

5. Push your code:
```bash
git remote add origin YOUR_GITHUB_URL
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Railway

1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `essayto` repository
5. Railway will detect your monorepo

### Configure Backend Service:

1. Click "Add Service" → "Database" → "PostgreSQL"
2. Click "Add Service" → "Database" → "Redis"
3. Click "Add Service" → "GitHub Repo" → Select your repo
4. Set Root Directory: `packages/backend`
5. Set Build Command: `npm install && npm run build`
6. Set Start Command: `npm start`

### Add Environment Variables:

Go to your backend service → Variables → Add these:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=your-super-secret-jwt-key-change-this
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
LLM_PROVIDER=groq
CORS_ORIGIN=https://your-app.vercel.app
```

**Note:** Railway will auto-fill `DATABASE_URL` and `REDIS_URL` from your databases.

6. Click "Deploy"
7. Copy your backend URL (something like `https://essayto-backend.up.railway.app`)

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Vite
   - Root Directory: `packages/frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Add Environment Variables:

```
VITE_API_URL=https://your-backend-url.railway.app
```

5. Click "Deploy"
6. Wait 2-3 minutes for deployment
7. Your app will be live at `https://your-app.vercel.app`

## Step 4: Update CORS

Go back to Railway → Backend Service → Variables:
- Update `CORS_ORIGIN` to your Vercel URL: `https://your-app.vercel.app`
- Redeploy the backend

## Step 5: Run Database Migrations

In Railway, go to your backend service → Settings → Add this to start command:

```
npm run migrate && npm start
```

Or run migrations manually in Railway's terminal.

## Done! 🎉

Your app is now live! Share the Vercel URL with your friends.

## Updating Your App

Whenever you make changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Both Vercel and Railway will automatically detect changes and redeploy!

## Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Verify all environment variables are set
- Make sure DATABASE_URL and REDIS_URL are connected

### Frontend can't connect to backend
- Check VITE_API_URL is correct
- Verify CORS_ORIGIN in backend matches your Vercel URL
- Check browser console for errors

### Database errors
- Make sure migrations ran successfully
- Check PostgreSQL is running in Railway
- Verify DATABASE_URL is correct

## Cost

- **Vercel:** Free (hobby plan)
- **Railway:** $5/month (includes PostgreSQL + Redis + Backend)
- **Groq API:** Free (with rate limits)

**Total: ~$5/month**
