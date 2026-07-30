import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function initDB() {
  const maxRetries = 5;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Successfully connected to PostgreSQL via Prisma');
      return;
    } catch (error) {
      if (i < maxRetries) {
        console.warn(`Attempt ${i}/${maxRetries} to connect to PostgreSQL failed. Retrying in 2s...`);
        await new Promise((res) => setTimeout(res, 2000));
      } else {
        console.warn('⚠️ Could not connect to PostgreSQL database. Running in-memory fallback mode.');
      }
    }
  }
}
