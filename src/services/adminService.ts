import prisma from '../database/prisma';

export class AdminService {
  static async isAdmin(telegramId: number | bigint): Promise<boolean> {
    try {
      const bId = BigInt(telegramId);
      const admin = await prisma.admin.findUnique({
        where: { telegramId: bId },
      });
      return !!admin;
    } catch (error) {
      console.error('Error checking isAdmin:', error);
      return false;
    }
  }

  static async ensureSuperAdmin(telegramId: number | bigint, username?: string) {
    try {
      const bId = BigInt(telegramId);
      const existing = await prisma.admin.findUnique({ where: { telegramId: bId } });
      if (!existing) {
        await prisma.admin.create({
          data: {
            telegramId: bId,
            username: username || null,
            role: 'superadmin',
          },
        });
      }
    } catch (error) {
      console.error('Error ensuring superadmin:', error);
    }
  }

  static async getSystemStats() {
    const totalUsers = await prisma.user.count();

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const roleStatsMap: Record<string, number> = {};
    usersByRole.forEach((item) => {
      if (item.role) {
        roleStatsMap[item.role] = item._count.role;
      }
    });

    const totalArticles = await prisma.legalArticle.count();
    const totalCategories = await prisma.category.count();
    const totalQuizzes = await prisma.quiz.count();
    const totalQuizResults = await prisma.quizResult.count();
    const totalAiConversations = await prisma.aIConversation.count();
    const totalAiMessages = await prisma.aIMessage.count();

    return {
      totalUsers,
      roleStatsMap,
      totalArticles,
      totalCategories,
      totalQuizzes,
      totalQuizResults,
      totalAiConversations,
      totalAiMessages,
    };
  }

  static async getAllUsers() {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

export default AdminService;
