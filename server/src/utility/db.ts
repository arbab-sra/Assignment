import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function initDB() {
  try {
    await prisma.$connect();
    console.log(' Successfully connected to PostgreSQL via Prisma');
  } catch (error) {
    console.warn('⚠️ Could not connect to PostgreSQL database. Running in-memory mode.');
  }
}
