import { stripHTML } from '../utils/helpers';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export class TtsService {
  /**
   * Generates a crystal-clear Uzbek neural speech audio Buffer using Microsoft Edge TTS (uz-UZ-MadinaNeural).
   * @param text Raw HTML or text response from AI
   * @returns Buffer containing MP3 audio speech data
   */
  public static async generateUzbekSpeechBuffer(text: string): Promise<Buffer | null> {
    try {
      // 1. Clean HTML, markdown, emojis, curly quotes, and special characters
      let cleanText = stripHTML(text || '')
        .replace(/[*_~`#|]/g, '')
        .replace(/[‘'ʻ’`]/g, "'")
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return null;

      // Limit text length to ~300 chars for concise, fast voice responses (~20-25 seconds)
      if (cleanText.length > 300) {
        const periodIdx = cleanText.indexOf('.', 200);
        if (periodIdx !== -1 && periodIdx < 300) {
          cleanText = cleanText.substring(0, periodIdx + 1);
        } else {
          cleanText = cleanText.substring(0, 300) + '.';
        }
      }

      // 2. Synthesize Uzbek speech audio using Microsoft Edge Neural Voice
      const tts = new MsEdgeTTS();
      await tts.setMetadata('uz-UZ-MadinaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(cleanText);

      return new Promise<Buffer | null>((resolve) => {
        const chunks: Buffer[] = [];
        let isResolved = false;

        const safeClose = () => {
          try {
            tts.close();
          } catch (e) {}
        };

        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            safeClose();
            resolve(chunks.length > 0 ? Buffer.concat(chunks) : null);
          }
        }, 8000);

        audioStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        audioStream.on('end', () => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            safeClose();
            const buffer = Buffer.concat(chunks);
            resolve(buffer.length > 500 ? buffer : null);
          }
        });

        audioStream.on('error', (err: any) => {
          console.error('TTS audioStream error:', err);
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            safeClose();
            resolve(chunks.length > 0 ? Buffer.concat(chunks) : null);
          }
        });
      });
    } catch (error) {
      console.error('Error in TtsService.generateUzbekSpeechBuffer:', error);
      return null;
    }
  }
}

export default TtsService;
