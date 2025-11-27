# 🆓 100% FREE Deployment Guide

Deploy PAPERPAL completely free using Render + Vercel!

## Cost: $0/month ✅

- **Render:** Free (backend + PostgreSQL)
- **Vercel:** Free (frontend)
- **Groq API:** Free
- **Total:** $0/month

## ⚠️ Free Tier Limitations

- Backend spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- 750 hours/month of runtime (more than enough)

---

## Step 1: Deploy Backend on Render

### Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (no credit card needed!)
3. Verify your email

### Create PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Name: `paperpal-db`
3. Database: `paperpal`
4. User: `paperpal`
5. Region: Choose closest to you
6. Plan: **Free** ✅
7. Click **"Create Database"**
8. Wait 2-3 minutes for provisioning
9. **Copy the "Internal Database URL"** (we'll need this)

### Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: **Paperpal**
3. Configure:
   - **Name:** `paperpal-backend`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `packages/backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** **Free** ✅

### Add Environment Variables
Click **"Environment"** tab and add:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=YOUR_INTERNAL_DATABASE_URL_FROM_STEP_ABOVE
JWT_SECRET=paperpal-super-secret-key-change-this-12345
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
CORS_ORIGIN=*
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important:** 
- Replace `DATABASE_URL` with your Internal Database URL from PostgreSQL
- Replace `GROQ_API_KEY` with your actual key

4. Click **"Create Web Service"**
5. Wait 5-10 minutes for first deployment
6. **Copy your backend URL** (e.g., `https://paperpal-backend.onrender.com`)

---

## Step 2: Deploy Frontend on Vercel

### Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub (no credit card needed!)
3. Verify your email

### Import Project
1. Click **"Add New..."** → **"Project"**
2. Click **"Import"** next to **Paperpal** repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `packages/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Add Environment Variable
1. Click **"Environment Variables"**
2. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** `YOUR_RENDER_BACKEND_URL` (from Step 1)
3. Click **"Deploy"**
4. Wait 2-3 minutes

**Your app is live!** 🎉

Copy your Vercel URL (e.g., `https://paperpal.vercel.app`)

---

## Step 3: Update CORS

1. Go back to Render
2. Click on your **paperpal-backend** service
3. Go to **"Environment"**
4. Update `CORS_ORIGIN` to your Vercel URL: `https://your-app.vercel.app`
5. Save (it will auto-redeploy)

---

## Step 4: Test Your App

1. Open your Vercel URL
2. Register a new account
3. Write a short essay: "This are a test."
4. Submit and wait for results

**Note:** First request might take 30 seconds if backend was sleeping.

---

## ✅ You're Done!

Share your Vercel URL with friends! Everything is 100% free! 🎉

---

## Troubleshooting

### "Network Error" on frontend
- Check if `VITE_API_URL` in Vercel matches your Render URL
- Make sure Render backend is running (check logs)
- Verify CORS_ORIGIN is set correctly

### Backend won't start
- Check Render logs: Service → Logs
- Verify DATABASE_URL is correct
- Make sure all environment variables are set

### Database connection error
- Verify you're using the **Internal Database URL** (not External)
- Check if PostgreSQL database is running in Render

### Essay stuck on "Processing"
- Check Render logs for errors
- Verify GROQ_API_KEY is correct
- Make sure model is `llama-3.3-70b-versatile`

### Backend is slow
- This is normal on free tier - it sleeps after 15 minutes
- First request wakes it up (takes ~30 seconds)
- After that, it's fast!

---

## Keeping Backend Awake (Optional)

If you want to prevent the backend from sleeping, you can use a free service like:
- **UptimeRobot** (https://uptimerobot.com) - pings your backend every 5 minutes
- **Cron-job.org** (https://cron-job.org) - scheduled pings

Just set it to ping your Render URL every 5-10 minutes.

---

## Summary

✅ **Render:** Backend + PostgreSQL (Free)
✅ **Vercel:** Frontend (Free)  
✅ **Groq:** AI API (Free)
✅ **GitHub:** Code hosting (Free)

**Total Cost: $0/month** 💰
