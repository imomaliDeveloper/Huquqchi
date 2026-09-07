export interface ExamConfig {
  targetDate: string;        // ISO String for countdown timer target
  certTargetDate: string;    // ISO String for National Cert timer
  title: string;             // Display title on widget
  season: string;            // Badge label e.g., "2026 MAVSUM"
  source: string;            // Verification source tag
  lastChecked: string;       // Timestamp when last scraped/verified
  scrapedNotice?: string;    // Text excerpt of official announcement
}

export class ExamScraperService {
  private static config: ExamConfig = {
    targetDate: '2026-07-15T08:00:00.000Z',
    certTargetDate: '2026-11-01T09:00:00.000Z',
    title: '⏳ DTM va Milliy Sertifikat Imtihonlariga',
    season: '2026 MAVSUM',
    source: '@uzbmb_rasmiy (Bilim va Malakalarni Baholash Agentligi)',
    lastChecked: new Date().toISOString(),
    scrapedNotice: 'O‘zR Bilim va malakalarni baholash agentligi (sobiq DTM) rasmiy jadvali bo‘yicha'
  };

  /**
   * Get current exam countdown configuration
   */
  public static getExamConfig(): ExamConfig {
    return this.config;
  }

  /**
   * Manually update exam target dates (Admin overrides)
   */
  public static updateExamConfig(newConfig: Partial<ExamConfig>): ExamConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      lastChecked: new Date().toISOString()
    };
    return this.config;
  }

  /**
   * Scrape official Telegram public channel web preview (https://t.me/s/uzbmb_rasmiy)
   * to automatically detect announced exam dates for DTM & Milliy Sertifikat.
   */
  public static async scrapeOfficialExamDates(): Promise<{ success: boolean; config: ExamConfig; log: string }> {
    let logMessage = '';
    try {
      console.log('🔍 [ExamScraper] @uzbmb_rasmiy va uzbmb.uz kanallaridan rasmiy imtihon sanalarini qidirish boshlandi...');
      logMessage += 'Scraping started for @uzbmb_rasmiy...\n';

      const response = await fetch('https://t.me/s/uzbmb_rasmiy', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'uz,ru,en;q=0.9'
        }
      });

      if (!response.ok) {
        logMessage += `HTTP Error: ${response.status} ${response.statusText}\n`;
        return { success: false, config: this.config, log: logMessage };
      }

      const html = await response.text();
      
      // Clean HTML tags to get raw post messages
      const postRegex = /<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/gi;
      let match;
      const foundNotices: string[] = [];

      while ((match = postRegex.exec(html)) !== null) {
        const rawContent = match[1];
        if (!rawContent) continue;

        const rawText = rawContent.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
        const lowerText = rawText.toLowerCase();

        if (
          (lowerText.includes('imtihon') || lowerText.includes('sertifikat') || lowerText.includes('kirish')) &&
          (lowerText.includes('boshlanadi') || lowerText.includes('bo\'lib o\'tadi') || lowerText.includes('sanada') || lowerText.includes('kunlari'))
        ) {
          foundNotices.push(rawText);
        }
      }

      const latestNotice = foundNotices[0];
      if (latestNotice) {
        logMessage += `Found ${foundNotices.length} matching announcements! Latest: "${latestNotice.slice(0, 100)}..."\n`;

        // Date extraction pattern: e.g. "15-iyul", "10-avgust", "1-noyabr"
        const dateMatch = latestNotice.match(/(\d{1,2})\s*[-–]?\s*(iyul|avgust|noyabr|aprel|may|iyun|mart)\b/i);

        if (dateMatch && dateMatch[1] && dateMatch[2]) {
          const day = parseInt(dateMatch[1], 10);
          const monthName = dateMatch[2].toLowerCase();

          const monthMap: Record<string, number> = {
            mart: 2,
            aprel: 3,
            may: 4,
            iyun: 5,
            iyul: 6,
            avgust: 7,
            noyabr: 10
          };

          const monthIndex = monthMap[monthName] ?? 6; // Default to July if not mapped
          const targetYear = new Date().getFullYear();
          const target = new Date(Date.UTC(targetYear, monthIndex, day, 3, 0, 0)); // 08:00 AM Tashkent (UTC+5)

          if (!isNaN(target.getTime())) {
            this.config.targetDate = target.toISOString();
            this.config.scrapedNotice = latestNotice.slice(0, 150) + '...';
            this.config.lastChecked = new Date().toISOString();
            this.config.source = '@uzbmb_rasmiy (Avtomatik tasdiqlangan)';

            logMessage += `✅ Scraped official exam date successfully: ${target.toISOString()}\n`;
            console.log(`✅ [ExamScraper] Imtihon sanasi avtomatik yangilandi: ${target.toISOString()}`);
          }
        }
      } else {
        logMessage += 'No new specific exam date change detected in recent channel posts. Keeping current schedule.\n';
      }

      this.config.lastChecked = new Date().toISOString();
      return { success: true, config: this.config, log: logMessage };
    } catch (err: any) {
      logMessage += `Scraper error: ${err.message || err}\n`;
      console.error('❌ [ExamScraper] Error:', err);
      return { success: false, config: this.config, log: logMessage };
    }
  }
}
