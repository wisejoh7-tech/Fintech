# AWS deployment guide for Reallapp

This guide uses the committed Dockerfile and targets ECS/Fargate with RDS MySQL, ElastiCache Redis, Secrets Manager, and an Application Load Balancer.

## Architecture

- **ECR** stores versioned Reallapp images.
- **ECS/Fargate** runs the Express/Socket.IO backend.
- **RDS MySQL 8** stores Prisma data durably.
- **ElastiCache Redis** supports queues and multi-instance Socket.IO when enabled.
- **ALB** terminates HTTPS and forwards to container port 3000.
- **Secrets Manager** supplies protected runtime variables.

## Prerequisites

- AWS account and a domain managed in Route 53 or another DNS provider
- VPC with public subnets for the ALB and private subnets for ECS/RDS
- ECR repository, ECS cluster, task execution role, and task role
- RDS MySQL database and security group allowing traffic from ECS only
- Optional ElastiCache Redis cluster
- ACM certificate attached to the HTTPS ALB listener

## Image build

```bash
aws ecr create-repository --repository-name reallapp --region us-east-1
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker build -t reallapp:VERSION .
docker tag reallapp:VERSION ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/reallapp:VERSION
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/reallapp:VERSION
```

Register a new ECS task definition using [`aws/ecs-task-definition.example.json`](aws/ecs-task-definition.example.json), replacing the placeholder account, region, image, IAM role, and secret ARNs. Deploy the task through an ECS service with an ALB target group on port 3000.

## Runtime variables

Store these in Secrets Manager and reference them from the ECS task definition:

```text
DATABASE_URL=mysql://USER:PASSWORD@RDS_HOST:3306/vivadb?sslaccept=strict
REDIS_URL=redis://REDIS_HOST:6379
GEMINI_API_KEY=...
PAYSTACK_SECRET_KEY=...
ENCRYPTION_KEY=...
FIREBASE_SERVICE_ACCOUNT={...complete JSON object...}
```

Also set `NODE_ENV=production` and `PORT=3000` as normal environment variables. Never bake these values into the image.

## Health check and rollout

Configure the ALB health check to `GET /api/health` and expect HTTP 200. After deployment, verify the same endpoint through the HTTPS domain, then test authentication, Prisma reads/writes, Paystack webhooks, and Socket.IO. Use CloudWatch Logs and alarms for task restarts, database errors, and ALB 5xx responses.

The container startup runs `npx prisma db push` without `--accept-data-loss`. For a mature production workflow, replace automatic schema push with reviewed Prisma migrations and run them as a controlled release step. Keep RDS automated backups and test restoration before going live.
