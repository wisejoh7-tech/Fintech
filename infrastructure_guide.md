# AWS Deployment Guide for VIVA Banking

This guide outlines how to deploy the VIVA application using Docker, Nginx, and AWS.

## 1. Prerequisites
- AWS Account
- Domain Name (pointing to your AWS IP)
- SSL Certificates (placed in `./certs` directory)

## 2. Infrastructure Setup (AWS EC2)
1. **Launch an EC2 Instance:**
   - Use Ubuntu 22.04 LTS.
   - Instance Type: t3.medium (recommended for Docker & Redis).
   - Security Group: Open ports 80 (HTTP), 443 (HTTPS), and 22 (SSH).

2. **Install Docker & Docker Compose:**
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose -y
   sudo usermod -aG docker $USER
   # Logout and back in
   ```

## 3. Deployment Steps
1. **Clone the repository** to the EC2 instance.
2. **Setup SSL:** Place your `fullchain.pem` and `privkey.pem` in a `certs/` folder in the project root.
3. **Environment Variables:** Create a `.env` file with production values:
   ```env
   GEMINI_API_KEY=your_key
   PAYSTACK_SECRET_KEY=your_live_key
   DATABASE_URL=postgresql://user:password@db:5432/vivadb
   REDIS_URL=redis://redis:6379
   ```
4. **Launch the stack:**
   ```bash
   docker-compose up -d --build
   ```

## 4. Scaling (AWS ECS/Fargate Alternative)
For a more professional setup:
1. **AWS RDS:** Use Amazon RDS (PostgreSQL) instead of the local Docker container for database stability.
2. **AWS ElastiCache:** Use Amazon ElastiCache (Redis) for a managed cache.
3. **AWS ALB:** Use an Application Load Balancer to handle SSL termination and distribute traffic to multiple ECS tasks.

## 5. Monitoring
- **Socket.io:** The Redis adapter is enabled, allowing you to scale the backend to multiple instances while keeping real-time notifications synchronized.
- **Logs:** View logs using `docker-compose logs -f app`.
