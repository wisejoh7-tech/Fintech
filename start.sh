#!/bin/sh

# Run Prisma schema push for the managed MySQL/TiDB database.
# TiDB Cloud requires Prisma's explicit strict TLS transport flag.
if [ -n "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="$(node -e 'const u=new URL(process.env.DATABASE_URL); if (u.protocol === "mysql:" && !u.searchParams.has("sslaccept")) u.searchParams.set("sslaccept", "strict"); process.stdout.write(u.toString())')"
fi

echo "Pushing database schema..."
npx prisma db push

# Start the application
echo "Starting application..."
npm start
