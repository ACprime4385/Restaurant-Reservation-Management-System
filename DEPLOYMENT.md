# Deployment Guide — Restaurant Reservation System

This guide walks you through deploying the restaurant reservation system to **Render.com** with a **MongoDB Atlas** database.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Set Up MongoDB Atlas](#set-up-mongodb-atlas)
3. [Deploy to Render](#deploy-to-render)
4. [Verify Deployment](#verify-deployment)
5. [Troubleshooting](#troubleshooting)
6. [Updating Deployment](#updating-deployment)

---

## Prerequisites

- GitHub account with the repo pushed
- Render.com account (free sign-up at [render.com](https://render.com))
- MongoDB Atlas account (free sign-up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
- This `render.yaml` file in the project root

---

## Set Up MongoDB Atlas

### Step 1: Create MongoDB Atlas Account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up with Google, GitHub, or email
3. Create a new organization or use default

### Step 2: Create a Free Cluster

1. Click **Create Deployment**
2. Select **Free** tier (M0 - 512 MB storage)
3. Choose cloud provider: **AWS** (US regions preferred for Render)
4. Click **Create Deployment**
5. Wait 2-3 minutes for cluster to initialize

### Step 3: Create Database User

1. In Atlas dashboard, go to **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Username: `restaurant_app` (example)
4. Password: Generate secure password or create your own (save this!)
5. Database User Privileges: **Built-in Role: Atlas Admin** (for development)
6. Click **Add User**

### Step 4: Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (for Render.com)
   - This adds `0.0.0.0/0` (accepts connections from any IP)
   - For production, restrict to Render's IP ranges
4. Click **Confirm**

### Step 5: Get Connection String

1. Go to **Databases** → click **Connect** on your cluster
2. Select **Drivers** tab
3. Language: **Node.js**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://restaurant_app:PASSWORD@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Replace `PASSWORD` with your actual password**
6. **Replace `cluster0` if different** (see your dashboard)
7. **Add database name** to connection string:
   ```
   mongodb+srv://restaurant_app:PASSWORD@cluster0.abc123.mongodb.net/restaurant-reservation?retryWrites=true&w=majority
   ```

**Save this connection string — you'll need it in Step 2 of Render deployment**

---

## Deploy to Render

### Step 1: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click **Sign Up** (use GitHub for easier authorization)
3. Authorize Render to access your GitHub account

### Step 2: Connect Repository

1. In Render dashboard, click **New +**
2. Select **Blueprint** → **Connect Repository**
3. Search for your repo: `restaurant-reservation-system`
4. Click **Connect**

### Step 3: Authorize GitHub

If prompted:
1. Click **Authorize render-oss**
2. Select the repository
3. Click **Authorize render-oss** to confirm

Render will auto-detect the `render.yaml` blueprint.

### Step 4: Configure Environment Variables

Render will show the services from `render.yaml`:
- `restaurant-api` (Backend Web Service)
- `restaurant-client` (Frontend Static Site)

**For the backend service, add environment variables:**

1. Click **restaurant-api** service
2. Under **Environment**, add:
   
   | Key | Value |
   |-----|-------|
   | `MONGO_URI` | `mongodb+srv://restaurant_app:PASSWORD@cluster0.abc123.mongodb.net/restaurant-reservation?retryWrites=true&w=majority` |
   | `JWT_SECRET` | Generate random: `openssl rand -base64 32` (or use online generator) |

3. Leave other variables as default:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`

4. Click **Save**

### Step 5: Deploy

1. Review both services:
   - **restaurant-api**: Web Service
   - **restaurant-client**: Static Site
2. Click **Deploy** (at the top right)
3. Wait 3-5 minutes for deployment to complete

**You'll see:**
- ✓ Backend building... → ✓ Backend live
- ✓ Frontend building... → ✓ Frontend live

---

## Verify Deployment

### Backend Health Check

```bash
curl https://restaurant-api.onrender.com/health
```

Expected response:
```json
{"status": "ok", "timestamp": "2024-01-15T12:34:56.789Z"}
```

### API Documentation

Visit in browser:
```
https://restaurant-api.onrender.com/api-docs
```

You should see Swagger UI with all endpoints listed.

### Frontend

Visit in browser:
```
https://restaurant-client.onrender.com
```

You should see the React app loaded.

### Test API Connection

1. Open frontend in browser
2. Sign up or log in
3. Try booking a reservation
4. Check browser DevTools → Network tab to verify API calls succeed

---

## Update Frontend API URL (if needed)

If backend URL differs from `restaurant-api.onrender.com`:

1. Edit `render.yaml`
2. Find frontend service `VITE_API_URL`
3. Update to your actual backend URL:
   ```yaml
   - key: VITE_API_URL
     value: https://YOUR-BACKEND-URL/api
   ```
4. Push to main branch — Render auto-redeploys

---

## Troubleshooting

### Backend Won't Start

**Error: "Cannot connect to MongoDB"**

1. Check `MONGO_URI` is correct:
   - Username and password correct?
   - Database name included?
   - Special characters URL-encoded?
   
2. Verify MongoDB Atlas networking:
   - Go to Network Access → check `0.0.0.0/0` is whitelisted
   - User exists in Database Access

3. View logs in Render:
   - Go to **restaurant-api** service
   - Click **Logs** tab
   - Look for error messages

### Frontend Shows Blank Page

**Error: "Failed to fetch /api/..."**

1. Check `VITE_API_URL` in `render.yaml`
2. Is backend URL correct?
3. Backend must be live (check health endpoint)
4. Check browser DevTools → Console for errors

### Slow First Load

Cold starts on free tier take 30-50 seconds. This is normal.

### Render Service Says "Build Failed"

1. Go to service → **Events** tab
2. Click failed build event
3. View **Build Logs**
4. Check for:
   - Missing dependencies: `npm install` should run
   - Port conflicts: Express should use `process.env.PORT`
   - Environment variables: Required vars missing?

**Common fixes:**
```bash
# Local test
npm install
npm run build  # or npm run start for server

# Verify package.json has correct start command
cat server/package.json | grep '"start"'
```

---

## Environment Variables Reference

### Backend (restaurant-api)

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for signing JWTs | Random 32-char string |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (Render assigns) | `5000` |

### Frontend (restaurant-client)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Backend API base URL | `https://restaurant-api.onrender.com/api` |

---

## Monitoring & Maintenance

### View Logs

1. Render dashboard → select service
2. Click **Logs** tab
3. Filter by:
   - Date/time
   - Error level

### Check Service Status

1. Each service shows **Live** (green) when healthy
2. Click service name to see:
   - Current logs
   - Deployment history
   - Environment variables (masked for security)

### Auto-Deploy

- Enabled: Any push to `main` branch redeploys automatically
- To disable: Service settings → **Auto-Deploy** toggle

### Manual Redeploy

1. Go to service
2. Click **Manual Deploy** (top right)
3. Select **Deploy latest commit**

---

## Scaling & Upgrades (Future)

### Upgrade from Free Tier

When ready for production:

1. **Render**: Upgrade to Starter ($7/month per service)
   - Persistent storage
   - Automatic restarts
   - Better performance

2. **MongoDB Atlas**: Upgrade to M2/M5
   - More storage (2-10GB)
   - Better uptime SLA
   - Enhanced security

### Manual Scaling

Render doesn't auto-scale on free tier. For future growth:

1. Service settings → **Scaling**
2. Increase **Num Instances**
3. Set **Auto-scaling** rules

---

## Rollback (If Needed)

If deployment breaks:

1. Go to service → **Deployment History**
2. Find previous working deployment
3. Click **Rollback**
4. Confirm

---

## Summary

| Step | Service | Status |
|------|---------|--------|
| 1 | Create MongoDB Atlas cluster | ✓ |
| 2 | Get connection string | ✓ |
| 3 | Create Render account | ✓ |
| 4 | Connect GitHub repo | ✓ |
| 5 | Add environment variables | ✓ |
| 6 | Deploy | ✓ |
| 7 | Verify endpoints | ✓ |

**Your app is now live!** 🚀

---

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **GitHub Issues**: Check repo for known issues
