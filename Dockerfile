# Step 1: Build stage
FROM node:20-slim AS builder

# Install OpenSSL for Prisma engine compatibility
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

# Step 2: Production stage
FROM node:20-slim AS runner

# Install OpenSSL for Prisma engine compatibility
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"
ENV PORT=3000

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["node", "dist/index.js"]
