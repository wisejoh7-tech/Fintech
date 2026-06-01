# Build Stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/server.ts ./
COPY --from=build /app/backend ./backend
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/tsconfig.json ./

# Install tsx to run server.ts directly or compile it
RUN npm install -g tsx

EXPOSE 3000

CMD ["tsx", "server.ts"]
