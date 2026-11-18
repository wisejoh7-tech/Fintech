# Build the Vite frontend and Prisma client in a Debian-based image.
FROM node:20-slim AS build

WORKDIR /app

# Prisma requires OpenSSL at generate/build time.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy manifests and schema first so Docker can cache dependency installation.
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# Copy the application only after dependencies are installed.
COPY . .
RUN npm run build

# Run the Express/Socket.IO server and serve the compiled frontend.
FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Prisma also needs OpenSSL at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/backend ./backend
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY start.sh ./start.sh

RUN chmod +x ./start.sh

EXPOSE 3000

CMD ["./start.sh"]
