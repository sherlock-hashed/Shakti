# 🚀 EC2 Backend Deployment Guide

This guide provides complete instructions to deploy the **Pulseboard Backend API & Cron Health Monitoring Engine** onto an **AWS EC2 (`t2.micro`)** instance.

---

## 📋 Architecture & Ports

* **Host Platform:** AWS EC2 (`Ubuntu 22.04 LTS`, `t2.micro`)
* **Ports Required in Security Group:**
  * `22` (SSH)
  * `80` (HTTP)
  * `443` (HTTPS)
  * `3000` (Custom TCP — Nginx Web UI)
  * `5000` (Custom TCP — Express API Server)

---

## 🌐 Step 1: MongoDB Atlas Setup (IP Whitelisting)

1. Log into your **MongoDB Atlas Console**.
2. Go to **Security** ➡️ **Network Access**.
3. Click **+ Add IP Address**.
4. Enter your **EC2 Public IPv4 Address** (or `0.0.0.0/0` during initial testing).
5. Click **Confirm**.

---

## 🖥️ Step 2: Launch AWS EC2 Instance (`t2.micro`)

1. Open **AWS EC2 Console** ➡️ Click **Launch Instance**.
2. **Name:** `pulseboard-backend`
3. **AMI:** `Ubuntu Server 22.04 LTS` (64-bit x86).
4. **Instance Type:** `t2.micro` (Free Tier Eligible).
5. **Key Pair:** Select or create a key pair (e.g. `pulseboard-key.pem`).
6. **Inbound Security Group Rules:**
   * `SSH` (Port `22`)
   * `HTTP` (Port `80`)
   * `HTTPS` (Port `443`)
   * `Custom TCP` (Port `3000`)
   * `Custom TCP` (Port `5000`)

---

## 🔑 Step 3: Connect via SSH

Open your terminal in the directory where your key is saved:

```bash
chmod 400 pulseboard-key.pem
ssh -i "pulseboard-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

## 🐳 Step 4: Install Docker & Docker Compose on EC2

Run the following commands on EC2:

```bash
sudo apt update && sudo apt install -y ca-certificates curl gnupg lsb-release git
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu
newgrp docker
```

---

## 📂 Step 5: Clone Repository & Create `.env`

```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY>.git pulseboard
cd pulseboard
nano server/.env
```

Paste your sanitized production configuration:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/pulseboard?retryWrites=true&w=majority
JWT_SECRET=your_production_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://<YOUR_EC2_PUBLIC_IP>:3000
NODE_ENV=production
```

Save with `Ctrl + O`, `Enter`, `Ctrl + X`.

Copy `.env` to the root folder:

```bash
cp server/.env .env
```

---

## 🚀 Step 6: Build & Deploy Container

```bash
docker compose up --build -d
```

Verify status:

```bash
docker ps
```

---

## 🔬 Step 7: Verify Live API Health & Automated Cron Checks

1. Test API Health:
   ```bash
   curl http://localhost:5000/api/health
   ```
2. Verify live logs and 1-minute cron sweeps:
   ```bash
   docker compose logs -f server
   ```

Output confirms MongoDB connection, active server, and continuous background health checks.
