"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.initDB = initDB;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
async function initDB() {
    try {
        await exports.prisma.$connect();
        console.log(' Successfully connected to PostgreSQL via Prisma');
    }
    catch (error) {
        console.warn('⚠️ Could not connect to PostgreSQL database. Running in-memory mode.');
    }
}
