# 🚀 Complete EC2 Production Setup Guide for MediaVerse

This guide covers everything from spinning up your AWS EC2 server to watching your automated GitHub Actions CI/CD deploy your code.

---

## Step 1: Create the EC2 Instance (AWS Console)
1. Log into your AWS Console and go to **EC2**.
2. Click **Launch Instance**.
3. **Name:** `mediaverse-production`
4. **AMI (OS):** Select **Ubuntu 24.04 LTS**.
5. **Instance Type:** Select `t3.small` or `t3.medium` (Node.js, MongoDB, and Redis need at least 2GB of RAM to comfortably run together).
6. **Key Pair:** Create a new key pair named `mediaverse-key`. **Download the `.pem` file and keep it safe!**
7. **Network Settings (Security Group):**
   - Check **Allow SSH traffic** (Port 22).
   - Check **Allow HTTP traffic from the internet** (Port 80).
   - Check **Allow HTTPS traffic from the internet** (Port 443).
8. **Storage:** Increase the Root volume to at least **20 GB** (gp3).
9. Click **Launch Instance**.

---

## Step 2: Connect to your Server
Wait a minute for the instance to boot, find its **Public IPv4 address**, and open your terminal on your computer:

```bash
# Fix permissions on your downloaded key (Mac/Linux only)
chmod 400 ~/Downloads/mediaverse-key.pem

# SSH into the server (Replace with your actual EC2 IP)
ssh -i ~/Downloads/mediaverse-key.pem ubuntu@YOUR_EC2_IP
```

---

## Step 3: Install Required Software
Run these commands one by one on your EC2 instance to install Node.js, Docker, PM2, and Nginx.

```bash
# 1. Update the system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Docker & Docker Compose
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
# (Note: You might need to log out and log back in for Docker permissions to apply)

# 4. Install PM2 (Process Manager) globally
sudo npm install -g pm2

# 5. Install Nginx
sudo apt install -y nginx
```

---

## Step 4: Clone the Repository & Setup
Now we get your code onto the server for the *first* time.

```bash
# Clone your repo (replace with your actual GitHub URL)
git clone https://github.com/YOUR_GITHUB_USERNAME/mediaverse.git
cd mediaverse/backend

# Install production dependencies
npm ci --only=production

# Create your .env file
nano .env
```

Paste your production environment variables into the `.env` file (Database URIs, AWS Keys, CloudFront Domain, JWT Secrets, etc.).
Press `Ctrl+O`, `Enter`, then `Ctrl+X` to save and exit.

---

## Step 5: Start the Infrastructure
Start MongoDB and Redis using Docker Compose. Because we fixed `docker-compose.yml` earlier, data will safely persist on the EC2 disk!

```bash
sudo docker-compose up -d
```
Check that they are running successfully: `sudo docker ps`.

---

## Step 6: Start the Application
Start your Node.js API and your Video Processing Worker using PM2.

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
*(Run the command that PM2 prints out to ensure it restarts automatically if the server reboots).*

---

## Step 7: Configure Nginx (Reverse Proxy)
We need to route Port 80 (HTTP) traffic from the outside world into PM2 (Port 8000).

```bash
# Open the default Nginx config
sudo nano /etc/nginx/sites-available/default
```

Delete everything inside and paste this:
```nginx
server {
    listen 80;
    server_name YOUR_EC2_IP; # Or your domain name if you have one

    client_max_body_size 500M; # Crucial for large video uploads!

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

Restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```
**Test it:** Type your EC2 Public IP into your browser. You should see your API running!

---

## Step 8: Wire up GitHub Actions (Automated CI/CD)
Finally, we connect GitHub to this server so future pushes deploy automatically.

1. Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
2. Create **`EC2_HOST`**: Paste your EC2 Public IPv4 address.
3. Create **`EC2_USERNAME`**: Type `ubuntu`.
4. Create **`EC2_SSH_KEY`**: Open that `mediaverse-key.pem` file you downloaded in Step 1 using a text editor (like Notepad or VSCode) on your local computer. Copy the *entire* text, including `-----BEGIN RSA PRIVATE KEY-----` and `-----END...`, and paste it into GitHub.

### 🎉 You are Done!
From now on, whenever you `git push` to the `main` branch:
1. GitHub runs your tests.
2. If they pass, GitHub secretly logs into your EC2 instance.
3. It runs `git pull`, updates packages, and runs `pm2 reload`.
4. Your server is updated seamlessly with **zero downtime**!
