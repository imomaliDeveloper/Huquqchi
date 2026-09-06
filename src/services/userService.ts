import prisma from '../database/prisma';
import { User } from '@prisma/client';

export class UserService {
  static async findByTelegramId(telegramId: number | bigint): Promise<User | null> {
    try {
      const bId = BigInt(telegramId);
      return await prisma.user.findUnique({
        where: { telegramId: bId },
      });
    } catch (error) {
      console.error('Error in UserService.findByTelegramId:', error);
      return null;
    }
  }

  static async createUser(data: {
    telegramId: number | bigint;
    username?: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    role?: string;
  }): Promise<User> {
    const bId = BigInt(data.telegramId);
    return await prisma.user.create({
      data: {
        telegramId: bId,
        username: data.username || null,
        firstName: data.firstName,
        lastName: data.lastName || null,
        phone: data.phone || null,
        role: data.role || null,
      },
    });
  }

  static async updateUser(
    telegramId: number | bigint,
    data: {
      firstName?: string;
      lastName?: string;
      username?: string;
      phone?: string;
      role?: string;
    }
  ): Promise<User> {
    const bId = BigInt(telegramId);
    return await prisma.user.update({
      where: { telegramId: bId },
      data,
    });
  }

  static async upsertUser(data: {
    telegramId: number | bigint;
    username?: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    role?: string;
  }): Promise<User> {
    const bId = BigInt(data.telegramId);
    return await prisma.user.upsert({
      where: { telegramId: bId },
      update: {
        firstName: data.firstName,
        lastName: data.lastName || null,
        username: data.username || null,
        phone: data.phone || null,
        role: data.role || null,
      },
      create: {
        telegramId: bId,
        username: data.username || null,
        firstName: data.firstName,
        lastName: data.lastName || null,
        phone: data.phone || null,
        role: data.role || null,
      },
    });
  }


  static async getUserStats(userId: number) {
    const totalQuizResults = await prisma.quizResult.count({
      where: { userId },
    });

    const aggregateScore = await prisma.quizResult.aggregate({
      where: { userId },
      _avg: { percentage: true },
      _sum: { score: true },
    });

    const totalAiConversations = await prisma.aIConversation.count({
      where: { userId },
    });

    return {
      totalQuizResults,
      avgQuizPercentage: aggregateScore._avg.percentage ? Math.round(aggregateScore._avg.percentage) : 0,
      totalAiConversations,
    };
  }
}

export default UserService;
