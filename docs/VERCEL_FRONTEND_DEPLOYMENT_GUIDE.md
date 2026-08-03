# ⚡ Vercel Frontend Deployment Guide

This guide documents the complete process for deploying the **Pulseboard React Single Page Application (SPA)** to **Vercel** with HTTPS-to-HTTP API proxying and automatic CI/CD deployment.

---

## 📋 Architecture & Proxy Overview

```
[ Mobile / Web Client ] ──(HTTPS)──> [ Vercel Global CDN (Frontend) ]
                                              │
                                     (Vercel Server Rewrite Proxy)
                                              │
                                              ▼ (HTTP Port 5000)
                             [ AWS EC2 Backend Express API ]
```

Because Vercel serves web apps over **`HTTPS`**, browsers block direct unencrypted `HTTP` API calls due to **Mixed Content Security Rules**. To solve this permanently, Vercel routes `/api/*` traffic serverlessly to the EC2 backend instance.

---

## 🛠️ Step 1: Connect Repository to Vercel

1. Log into **[Vercel Dashboard](https://vercel.com)**.
2. Click **Add New...** ➡️ **Project**.
3. Import your GitHub repository (`<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY>`).

---

## ⚙️ Step 2: Configure Vercel Project Settings

On the **Configure Project** screen, set:

* **Project Name:** `pulseboard` *(or custom project name)*
* **Framework Preset:** `Vite`
* **Root Directory:** Click **Edit** ➡️ Select **`client`** *(Do not leave as root `/`)*
* **Build & Output Settings:**
  * **Build Command:** `npm run build`
  * **Output Directory:** `dist`

---

## 🔑 Step 3: Configure Environment Variables

Under **Environment Variables**, add:

| Key | Value | Purpose |
|-----|-------|---------|
| **`VITE_API_BASE_URL`** | **`/api`** | Uses relative API proxy routing to prevent Mixed Content browser blocks |

---

## 🔀 Step 4: Configure Vercel API Rewrites (`vercel.json`)

Ensure [`client/vercel.json`](../client/vercel.json) contains the following rewrite configuration:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://<YOUR_EC2_PUBLIC_IP>:5000/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🚀 Step 5: Deploy & Update EC2 `CLIENT_URL`

1. Click **Deploy** in Vercel.
2. Vercel will build the frontend and provide a live production HTTPS domain:
   `https://<YOUR_PROJECT_NAME>.vercel.app`
3. Update your EC2 backend configuration to match your live Vercel domain:

SSH into EC2 and update `server/.env`:
```bash
nano server/.env
# Set CLIENT_URL to your live Vercel HTTPS domain:
CLIENT_URL=https://<YOUR_PROJECT_NAME>.vercel.app
```

Restart backend containers:
```bash
cp server/.env .env
docker compose up -d
```

---

## ✅ Step 6: Verification Matrix

* **Frontend URL:** `https://<YOUR_PROJECT_NAME>.vercel.app`
* **Authentication:** Test Sign Up and Sign In across desktop & mobile devices over HTTPS.
* **Dashboard Telemetry:** Confirm real-time monitor cards, charts, and report exports load cleanly.
