#!/bin/sh

# Run Prisma schema push for PostgreSQL
echo "Pushing database schema..."
npx prisma db push --accept-data-loss

# Start the application
echo "Starting application..."
npm start
