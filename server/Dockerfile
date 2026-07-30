# Multi-stage Dockerfile for YouTube Watch Party Backend Server

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for build
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and compile TypeScript
COPY . .
RUN npm run build

# Stage 2: Production Execution
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Copy production package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy generated Prisma Client and compiled Javascript output
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 5001

# Start backend server
CMD ["node", "dist/server.js"]
