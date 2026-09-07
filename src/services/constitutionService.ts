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
   * Seed full 155 articles + Muqaddima into DB if missing
   */
  public static async seedDefaultArticles(): Promise<number> {
    try {
      const count = await prisma.constitutionArticle.count().catch(() => 0);
      if (count >= FULL_CONSTITUTION_DATA.length) {
        return 0;
      }

      const existing = await prisma.constitutionArticle.findMany({
        select: { articleNumber: true },
      }).catch(() => []);

      const existingNumbers = new Set(existing.map((e) => e.articleNumber));
      const toCreate = FULL_CONSTITUTION_DATA.filter((art) => !existingNumbers.has(art.articleNumber));

      if (toCreate.length > 0) {
        await prisma.constitutionArticle.createMany({
          data: toCreate.map((art) => ({
            articleNumber: art.articleNumber,
            title: art.title,
            part: art.part,
            chapter: art.chapter,
            text: art.text,
          })),
        }).catch(() => {});
      }
      return toCreate.length;
    } catch (err) {
      console.warn('⚠️ Constitution seed failed, will fallback to in-memory data:', err);
      return 0;
    }
  }

  /**
   * Get single article by number (0 = Muqaddima, 1..155 = Modda)
   */
  public static async getArticleByNumber(articleNumber: number) {
    await this.seedDefaultArticles().catch(() => 0);

    try {
      const art = await prisma.constitutionArticle.findUnique({
        where: { articleNumber },
      });
      if (art) return art;
    } catch (e) {}

    // In-memory fallback
    const memArt = FULL_CONSTITUTION_DATA.find((a) => a.articleNumber === articleNumber);
    if (!memArt) return null;

    return {
      id: articleNumber + 1,
      articleNumber: memArt.articleNumber,
      title: memArt.title,
      part: memArt.part,
      chapter: memArt.chapter,
      text: memArt.text,
      audioFileId: null,
      audioDuration: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Update audio file ID for specific article
   */
  public static async updateAudioFileId(articleNumber: number, audioFileId: string, duration?: number) {
    await this.seedDefaultArticles().catch(() => 0);
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
    await this.seedDefaultArticles().catch(() => 0);
    const skip = (page - 1) * limit;

    try {
      const [items, total] = await Promise.all([
        prisma.constitutionArticle.findMany({
          orderBy: { articleNumber: 'asc' },
          skip,
          take: limit,
        }),
        prisma.constitutionArticle.count(),
      ]);

      if (items && items.length > 0) {
        return {
          items,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        };
      }
    } catch (e) {}

    // In-memory fallback
    const total = FULL_CONSTITUTION_DATA.length;
    const memSlice = FULL_CONSTITUTION_DATA.slice(skip, skip + limit).map((a) => ({
      id: a.articleNumber + 1,
      articleNumber: a.articleNumber,
      title: a.title,
      part: a.part,
      chapter: a.chapter,
      text: a.text,
      audioFileId: null,
      audioDuration: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return {
      items: memSlice,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Search articles by query (number or text)
   */
  public static async searchArticles(query: string) {
    await this.seedDefaultArticles().catch(() => 0);
    const clean = query.trim();

    // If query is pure number
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num >= 0 && num <= 155) {
      const single = await this.getArticleByNumber(num);
      return single ? [single] : [];
    }

    try {
      const dbResults = await prisma.constitutionArticle.findMany({
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

      if (dbResults && dbResults.length > 0) {
        return dbResults;
      }
    } catch (e) {}

    // In-memory fallback keyword search
    const lower = clean.toLowerCase();
    const memResults = FULL_CONSTITUTION_DATA.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.text.toLowerCase().includes(lower) ||
        (a.chapter && a.chapter.toLowerCase().includes(lower))
    )
      .slice(0, 15)
      .map((a) => ({
        id: a.articleNumber + 1,
        articleNumber: a.articleNumber,
        title: a.title,
        part: a.part,
        chapter: a.chapter,
        text: a.text,
        audioFileId: null,
        audioDuration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    return memResults;
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
    }).catch(() => ({ count: 0 }));
    return res.count;
  }
}
export default ConstitutionService;
