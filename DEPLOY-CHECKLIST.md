# Deployment Checklist ✅

Follow these steps in order:

## ☐ 1. Create GitHub Repository
- [ ] Go to https://github.com/new
- [ ] Name: `essayto`
- [ ] Visibility: Public
- [ ] Don't initialize with README
- [ ] Click "Create repository"
- [ ] Copy the repository URL

## ☐ 2. Push Code to GitHub
```bash
git remote add origin YOUR_GITHUB_URL
git branch -M main
git push -u origin main
```

## ☐ 3. Deploy Backend on Railway

### Create Railway Account
- [ ] Go to https://railway.app
- [ ] Sign up with GitHub
- [ ] Verify your email

### Create New Project
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose your `essayto` repository
- [ ] Railway will create a service

### Add PostgreSQL Database
- [ ] Click "New" → "Database" → "Add PostgreSQL"
- [ ] Wait for it to provision

### Add Redis Database
- [ ] Click "New" → "Database" → "Add Redis"
- [ ] Wait for it to provision

### Configure Backend Service
- [ ] Click on your backend service
- [ ] Go to "Settings"
- [ ] Set Root Directory: `packages/backend`
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Start Command: `npm start`

### Add Environment Variables
- [ ] Go to "Variables" tab
- [ ] Add these variables:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=your-super-secret-jwt-key-change-this-to-something-random
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
LLM_PROVIDER=groq
CORS_ORIGIN=*
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

- [ ] Click "Deploy"
- [ ] Wait 3-5 minutes for deployment
- [ ] Copy your backend URL (e.g., `https://essayto-production.up.railway.app`)

## ☐ 4. Deploy Frontend on Vercel

### Create Vercel Account
- [ ] Go to https://vercel.com
- [ ] Sign up with GitHub
- [ ] Verify your email

### Import Project
- [ ] Click "Add New..." → "Project"
- [ ] Click "Import" next to your `essayto` repository
- [ ] Configure project:
  - Framework Preset: **Vite**
  - Root Directory: **packages/frontend**
  - Build Command: `npm run build`
  - Output Directory: `dist`

### Add Environment Variables
- [ ] Click "Environment Variables"
- [ ] Add:
  - Name: `VITE_API_URL`
  - Value: `YOUR_RAILWAY_BACKEND_URL` (from step 3)
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes
- [ ] Copy your frontend URL (e.g., `https://essayto.vercel.app`)

## ☐ 5. Update CORS Settings

- [ ] Go back to Railway
- [ ] Click on your backend service
- [ ] Go to "Variables"
- [ ] Update `CORS_ORIGIN` to your Vercel URL
- [ ] Click "Redeploy"

## ☐ 6. Test Your App

- [ ] Open your Vercel URL in a browser
- [ ] Try to register a new account
- [ ] Try to login
- [ ] Write and submit a test essay
- [ ] Check if corrections appear

## ☐ 7. Share with Friends! 🎉

Your app is live! Share the Vercel URL with your friends.

---

## Troubleshooting

### Backend won't start
- Check Railway logs: Service → Deployments → Click on latest → View logs
- Verify all environment variables are set correctly
- Make sure PostgreSQL and Redis are running

### Frontend shows "Network Error"
- Check if VITE_API_URL is correct in Vercel
- Verify CORS_ORIGIN in Railway matches your Vercel URL
- Check browser console for errors (F12)

### Database errors
- Check if migrations ran successfully in Railway logs
- Verify DATABASE_URL is connected to PostgreSQL service

### "Processing" never completes
- Check if GROQ_API_KEY is set correctly in Railway
- Verify the model name is `llama-3.3-70b-versatile`
- Check Railway logs for LLM errors

---

## Cost Estimate

- **Railway:** $5/month (includes everything: backend, PostgreSQL, Redis)
- **Vercel:** Free (hobby plan)
- **Groq API:** Free (with rate limits)

**Total: $5/month** 💰
