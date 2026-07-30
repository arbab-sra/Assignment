# Multi-stage Dockerfile for YouTube Watch Party Backend Server

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma Engine compatibility on Alpine Linux
RUN apk add --no-cache openssl

# Copy dependency specifications and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies like prisma CLI)
RUN npm ci

# Copy full source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build


# Stage 2: Production Execution
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma Engine runtime on Alpine Linux
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=5001

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy pre-generated Prisma Client & binaries from builder stage
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled Javascript output and Prisma schema
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 5001

# Start backend server
CMD ["node", "dist/server.js"]
