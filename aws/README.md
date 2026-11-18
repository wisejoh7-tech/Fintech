# AWS deployment

Reallapp is a stateful banking backend and should run as a container on AWS ECS/Fargate (or ECS on EC2). Use Amazon RDS for MySQL-compatible durable data, ElastiCache for Redis, and an Application Load Balancer for HTTPS. The committed root `Dockerfile` is the image contract and listens on `PORT` (default `3000`).

## Recommended architecture

- **ECR** stores the image built from the repository's root `Dockerfile`.
- **ECS/Fargate** runs the Express/Socket.IO container across private subnets.
- **RDS MySQL 8** supplies `DATABASE_URL`; use a TLS-enabled RDS instance in production.
- **ElastiCache Redis** supplies `REDIS_URL` when queue/adapter features are enabled.
- **Application Load Balancer** terminates TLS and forwards to container port `3000`.
- **Secrets Manager** stores all private credentials; do not commit `.env` or service-account JSON.

## Build and push the image

From the repository root:

```bash
aws ecr create-repository --repository-name reallapp --region us-east-1
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker build -t reallapp .
docker tag reallapp:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/reallapp:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/reallapp:latest
```

Replace `ACCOUNT_ID` and the region with the values for the AWS account. Configure the ECS service to deploy a new image tag or digest rather than relying on `latest` for production releases.

## ECS configuration

Use [`ecs-task-definition.example.json`](./ecs-task-definition.example.json) as a starting point. Store these values as ECS Secrets Manager references:

- `DATABASE_URL` — RDS MySQL URL, including TLS parameters required by the selected driver
- `REDIS_URL` — ElastiCache Redis URL, if Redis is enabled
- `GEMINI_API_KEY`
- `PAYSTACK_SECRET_KEY`
- `ENCRYPTION_KEY`
- `FIREBASE_SERVICE_ACCOUNT`

Set `NODE_ENV=production` and `PORT=3000`. The ALB health check should use `GET /api/health` and expect HTTP 200. Allow the ALB security group to reach port 3000; do not expose the task directly to the public internet.

## Database preparation

The container startup runs `npx prisma db push` through `start.sh`. For a first deployment, verify the RDS security group and TLS settings first. For controlled production migrations, replace this with a reviewed migration workflow before enabling automatic rollouts. Never use `--accept-data-loss` in production.

## Deploying updates

Build a new image, push it to ECR, update the ECS task definition image digest, and deploy the service. Confirm the ALB health check, `/api/health`, authentication, Paystack webhook delivery, and Socket.IO connections after rollout. Use CloudWatch logs and alarms for application errors, task restarts, database connections, and ALB 5xx responses.
