import prisma from '../database/prisma';
import { FULL_CONSTITUTION_DATA } from '../data/constitutionData';

export interface ConstitutionArticleData {
  articleNumber: number;
  title: string;
  chapter?: string;
  part?: string;
  text: string;
  audioFileId?: string;
}

export class ConstitutionService {
  /**
   * Seed full 155 articles + Muqaddima into DB
   */
  public static async seedDefaultArticles(): Promise<number> {
    let createdCount = 0;
    for (const art of FULL_CONSTITUTION_DATA) {
      await prisma.constitutionArticle.upsert({
        where: { articleNumber: art.articleNumber },
        update: {
          title: art.title,
          part: art.part,
          chapter: art.chapter,
          text: art.text,
        },
        create: {
          articleNumber: art.articleNumber,
          title: art.title,
          part: art.part,
          chapter: art.chapter,
          text: art.text,
        },
      });
      createdCount++;
    }

    return createdCount;
  }

  /**
   * Get single article by number (0 = Muqaddima, 1..155 = Modda)
   */
  public static async getArticleByNumber(articleNumber: number) {
    await this.seedDefaultArticles();
    return prisma.constitutionArticle.findUnique({
      where: { articleNumber },
    });
  }

  /**
   * Update audio file ID for specific article
   */
  public static async updateAudioFileId(articleNumber: number, audioFileId: string, duration?: number) {
    await this.seedDefaultArticles();
    return prisma.constitutionArticle.update({
      where: { articleNumber },
      data: {
        audioFileId,
        audioDuration: duration || null,
      },
    });
  }

  /**
   * List articles with pagination
   */
  public static async listArticles(page: number = 1, limit: number = 10) {
    await this.seedDefaultArticles();
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.constitutionArticle.findMany({
        orderBy: { articleNumber: 'asc' },
        skip,
        take: limit,
      }),
      prisma.constitutionArticle.count(),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Search articles by query (number or text)
   */
  public static async searchArticles(query: string) {
    await this.seedDefaultArticles();
    const clean = query.trim();

    // If query is pure number
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num >= 0 && num <= 155) {
      const single = await this.getArticleByNumber(num);
      return single ? [single] : [];
    }

    // Keyword search
    return prisma.constitutionArticle.findMany({
      where: {
        OR: [
          { title: { contains: clean } },
          { text: { contains: clean } },
          { chapter: { contains: clean } },
        ],
      },
      take: 15,
      orderBy: { articleNumber: 'asc' },
    });
  }

  /**
   * Clear all attached audio file IDs from Constitution articles
   */
  public static async clearAllAudioFileIds(): Promise<number> {
    const res = await prisma.constitutionArticle.updateMany({
      data: {
        audioFileId: null,
        audioDuration: null,
      },
    });
    return res.count;
  }
}
export default ConstitutionService;
