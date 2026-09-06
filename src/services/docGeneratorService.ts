import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import config from '../config';

export interface DocTemplateParams {
  type:
    | 'IJARA_SHARTNOMASI'
    | 'QARZ_TILI_XATI'
    | 'MEHNAT_SHARTNOMASI'
    | 'DAVO_ARIZASI'
    | 'ISHONCHNOMA'
    | 'OLDI_SOTDI_SHARTNOMASI'
    | 'NIKOH_SHARTNOMASI'
    | 'XIZMAT_KORSATISH_SHARTNOMASI';
  docNumber?: string;
  partyA: {
    name: string;
    passport?: string;
    phone?: string;
    address?: string;
  };
  partyB: {
    name: string;
    passport?: string;
    phone?: string;
    address?: string;
  };
  details: {
    amountOrPrice?: string;
    durationOrDate?: string;
    subjectAddressOrTitle?: string;
    additionalInfo?: string;
  };
}

export class DocGeneratorService {
  /**
   * Generates a clean, professional legal PDF document buffer
   */
  public static async generateDocumentPdf(params: DocTemplateParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const dateStr = new Date().toLocaleDateString('uz-UZ', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const docNo = params.docNumber || `HQ-${Math.floor(100000 + Math.random() * 900000)}`;

        // Header section
        doc.fillColor('#0F172A').fontSize(16).text('O‘ZBEKISTON RESPUBLIKASI SHAXSIY HUQUQIY HUJJATI', { align: 'center' });
        doc.moveDown(0.3);
        doc.fillColor('#3B82F6').fontSize(11).text('Huquqchi AI Avtomatlashtirilgan Yuridik Generator', { align: 'center' });
        doc.moveDown(0.5);

        // Divider Line
        doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1);

        // Metadata block
        doc.fillColor('#475569').fontSize(10);
        doc.text(`Hujjat raqami: #${docNo}`, 40, doc.y);
        doc.text(`Sana: ${dateStr}`, 400, doc.y - 12, { align: 'right' });
        doc.moveDown(1.5);

        switch (params.type) {
          case 'IJARA_SHARTNOMASI':
            this.buildIjaraContent(doc, params);
            break;
          case 'QARZ_TILI_XATI':
            this.buildQarzContent(doc, params);
            break;
          case 'MEHNAT_SHARTNOMASI':
            this.buildMehnatContent(doc, params);
            break;
          case 'DAVO_ARIZASI':
            this.buildDavoContent(doc, params);
            break;
          case 'ISHONCHNOMA':
            this.buildIshonchnomaContent(doc, params);
            break;
          case 'OLDI_SOTDI_SHARTNOMASI':
            this.buildOldiSotdiContent(doc, params);
            break;
          case 'NIKOH_SHARTNOMASI':
            this.buildNikohContent(doc, params);
            break;
          case 'XIZMAT_KORSATISH_SHARTNOMASI':
            this.buildXizmatContent(doc, params);
            break;
        }

        // Footer / Legal disclaimer & signature block
        doc.moveDown(2);
        const yPos = doc.y > 650 ? 650 : doc.y;

        doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, yPos).lineTo(555, yPos).stroke();
        doc.moveDown(1);

        // Signatures Block
        doc.fillColor('#1E293B').fontSize(11).text('TOMONLARNING IMZOLARI VA REKVIZITLARI:', 40, yPos + 15);
        doc.moveDown(0.5);

        const col1Left = 40;
        const col2Left = 310;
        const sigY = doc.y;

        // Party A
        doc.fontSize(10).fillColor('#0F172A').text(`1-TOMON (${params.type === 'DAVO_ARIZASI' ? 'Da‘vogar' : params.type === 'ISHONCHNOMA' ? 'Ishonch bildiruvchi' : '1-Taraf'}):`, col1Left, sigY);
        doc.fillColor('#475569').text(`F.I.SH.: ${params.partyA.name}`);
        if (params.partyA.passport) doc.text(`Pasport: ${params.partyA.passport}`);
        if (params.partyA.phone) doc.text(`Tel: ${params.partyA.phone}`);
        doc.moveDown(1);
        doc.text('Imzo: ___________________');

        // Party B
        doc.fontSize(10).fillColor('#0F172A').text(`2-TOMON (${params.type === 'DAVO_ARIZASI' ? 'Javobgar' : params.type === 'ISHONCHNOMA' ? 'Ishonchli vakil' : '2-Taraf'}):`, col2Left, sigY);
        doc.fillColor('#475569').text(`F.I.SH.: ${params.partyB.name}`);
        if (params.partyB.passport) doc.text(`Pasport: ${params.partyB.passport}`);
        if (params.partyB.phone) doc.text(`Tel: ${params.partyB.phone}`);
        doc.moveDown(1);
        doc.text('Imzo: ___________________');

        // Watermark stamp
        doc.fontSize(8).fillColor('#94A3B8').text(
          'Ushbu hujjat Huquqchi AI avtomatlashtirilgan bot platformasi orqali shakllantirilgan. Tomonlar imzolaganidan so‘ng yuridik kuchga ega bo‘ladi.',
          40,
          780,
          { align: 'center' }
        );

        // QR Code Verification
        const botUsername = (config.botUsername || 'Huquqchi_bot').replace(/^@/, '');
        const verifyUrl = `https://t.me/${botUsername}?start=verify_${docNo}`;

        QRCode.toBuffer(verifyUrl, { margin: 1, width: 90 })
          .then((qrBuffer) => {
            try {
              doc.image(qrBuffer, 460, yPos + 20, { width: 70 });
              doc.fontSize(7).fillColor('#2563EB').text('✅ AVTENTIFIKATSIYA', 450, yPos + 95, { width: 90, align: 'center' });
            } catch (qrErr) {
              console.warn('QR code render warning:', qrErr);
            }
            doc.end();
          })
          .catch(() => {
            doc.end();
          });
      } catch (err) {
        reject(err);
      }
    });
  }

  private static buildIjaraContent(doc: PDFKit.PDFDocument, params: DocTemplateParams) {
    doc.fillColor('#0F172A').fontSize(14).text('TURAR JOY IJARA SHARTNOMASI', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#1E293B');
    doc.text(
      `Bir tomondan ${params.partyA.name} (keyingi o‘rinlarda "Ijaraga beruvchi") va ikkinchi tomondan ${params.partyB.name} (keyingi o‘rinlarda "Ijaraga oluvchi"), ushbu shartnomani quyidagilar haqida tuzdilar:`
    );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('1. SHARTNOMA MAVZUSI');
    doc.fontSize(10).fillColor('#334155').text(
      `1.1. Ijaraga beruvchi o‘ziga tegishli bo‘lgan va ${params.details.subjectAddressOrTitle || 'ko‘rsatilgan manzildagi'} manzil bo‘yicha joylashgan turar joyni Ijaraga oluvchiga vaqtinchalik yashash uchun topshiradi.`
    );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('2. IJARA HAKKIDAGI HISOBLASHISHLAR');
    doc.fontSize(10).fillColor('#334155').text(
      `2.1. Oylik ijara to‘lovi miqdori: ${params.details.amountOrPrice || 'Kelishilgan summa'} so‘m etib belgilanadi.`
    );
    doc.text(`2.2. To‘lov har oyning birinchi 5 (besh) bank kuni davomida amalga oshiriladi.`);
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('3. SHARTNOMA MUDDATI');
    doc.fontSize(10).fillColor('#334155').text(
      `3.1. Ushbu shartnoma ${params.details.durationOrDate || '12 oy'} muddatga tuzildi va imzolangan kundan boshlab kuchga kiradi.`
    );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('4. MAXSUS SHARTLAR VA MAJBURIYATLAR');
    doc.fontSize(10).fillColor('#334155').text(
      `4.1. Ijaraga oluvchi joyni toza saqlash, kommunal to‘lovlarni o‘z vaqtida to‘lash va mulkka zarar yetkazmaslik majburiyatini oladi.\n` +
      `4.2. ${params.details.additionalInfo || 'Qo‘shimcha maxsus shartlar mavjud emas.'}`
    );
  }

  private static buildQarzContent(doc: PDFKit.PDFDocument, params: DocTemplateParams) {
    doc.fillColor('#0F172A').fontSize(14).text('QARZ TILI XATI (TILXAT)', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#1E293B');
    doc.text(
      `Men, ${params.partyB.name} (Pasport: ${params.partyB.passport || 'Kiritilmagan'}), ushbu tilxatni beraman shundaki, ` +
      `${params.partyA.name} (Pasport: ${params.partyA.passport || 'Kiritilmagan'})dan quyidagi summada naqd / o‘tkazma shaklida qarz oldim:`
    );
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#0F172A').text(`QARZ SUMMASI: ${params.details.amountOrPrice || '0'} SO‘M`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#334155');
    doc.text(
      `Ushbu olingan qarz summasini to‘liq va hech qanday e’tirozlarsiz ${params.details.durationOrDate || 'belgilangan muddatgacha'} qaytarishga o‘z zimmamga to‘liq majburiyat olaman.`
    );
    doc.moveDown(1);

    doc.text(
      `Agarda ko‘rsatilgan muddatda qarz summasi qaytarilmasa, ${params.partyA.name} Fuqarolik ishlari bo‘yicha sudga hamda huquqni muhofaza qiluvchi organlarga murojaat qilish huquqiga ega.`
    );
    if (params.details.additionalInfo) {
      doc.moveDown(0.5);
      doc.text(`Qo‘shimcha shart: ${params.details.additionalInfo}`);
    }
  }

  private static buildMehnatContent(doc: PDFKit.PDFDocument, params: DocTemplateParams) {
    doc.fillColor('#0F172A').fontSize(14).text('MEHNAT SHARTNOMASI', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#1E293B');
    doc.text(
      `Ish beruvchi: "${params.partyA.name}" hamda Xodim: ${params.partyB.name} (Pasport: ${params.partyB.passport || 'Noma‘lum'}) o‘rtasida O‘zR Mehnat Kodeksiga muvofiq tuzildi:`
    );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('1. SHARTNOMA MAVZUSI');
    doc.fontSize(10).fillColor('#334155').text(
      `1.1. Xodim "${params.details.subjectAddressOrTitle || 'Mutaxassis'}" lavozimiga ishga qabul qilinadi va belgilangan mehnat majburiyatlarini bajaradi.`
    );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('2. MEHNATGA HAQ TO‘LASH');
    doc.fontSize(10).fillColor('#334155').text(
      `2.1. Xodimga oylik lavozim maoshi ${params.details.amountOrPrice || 'Kelishilgan'} so‘m miqdorida belgilanadi.`
    );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('3. ISH REJIMI VA MUDDATI');
    doc.fontSize(10).fillColor('#334155').text(
      `3.1. Ish vaqti davomiyligi haftasiga 40 soat (5 kunlik ish haftasi).\n` +
      `3.2. Shartnoma barcha qonunchilik talablariga rioya qilingan holda ${params.details.durationOrDate || 'Nomuayyan muddatga'} tuzildi.`
    );
  }

  private static buildDavoContent(doc: PDFKit.PDFDocument, params: DocTemplateParams) {
    doc.fillColor('#0F172A').fontSize(14).text('SUDGA DA‘VO ARIZASI (NAMUNA)', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#1E293B');
    doc.text(`FUQAROLIK ISHLARI BO‘YICHA ${params.details.subjectAddressOrTitle?.toUpperCase() || 'TUMAN'} SUDIGA`, { align: 'right' });
    doc.moveDown(0.5);
    doc.text(`Da‘vogar: ${params.partyA.name} (Manzil: ${params.partyA.address || 'Kiritilmagan'})`, { align: 'right' });
    doc.text(`Javobgar: ${params.partyB.name} (Manzil: ${params.partyB.address || 'Kiritilmagan'})`, { align: 'right' });
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor('#0F172A').text('DA‘VO ARIZASI', { align: 'center' });
    doc.fontSize(10).fillColor('#0F172A').text('(Nizo va majburiyatlarni majburiy tartibda undirish to‘g‘risida)', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#334155');
    doc.text(
      `Javobgar ${params.partyB.name} o‘ziga yuklatilgan majburiyatlarni (shartnoma / qarzdorlik / aliment to‘lovlari) lozim darajada bajarmasdan kelmoqda.`
    );
    doc.moveDown(0.5);
    doc.text(`Nizo summasi / Talab miqdori: ${params.details.amountOrPrice || 'Belgilanmoqda'} so‘m.`);
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('YUQORIDAGILARDAN KELIB CHIQIB, SO‘RAYMAN:');
    doc.fontSize(10).fillColor('#334155').text(
      `1. Javobgar ${params.partyB.name}dan Da‘vogar ${params.partyA.name} foydasiga ${params.details.amountOrPrice || 'ko‘rsatilgan'} so‘m undirilsin.\n` +
      `2. Sud xarajatlari javobgar zimmasiga yuklatilsin.\n` +
      `3. ${params.details.additionalInfo || 'Barcha tegishli dalillar arizaga ilova qilinadi.'}`
    );
  }

  private static buildIshonchnomaContent(doc: PDFKit.PDFDocument, params: DocTemplateParams) {
    doc.fillColor('#0F172A').fontSize(14).text('ISHONCHNOMA (ISMAN VAKILLIK)', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#1E293B');
    doc.text(
      `Men, ${params.partyA.name} (Pasport: ${params.partyA.passport || 'Kiritilmagan'}, Manzil: ${params.partyA.address || 'Kiritilmagan'}), ` +
      `ushbu ishonchnoma orqali ${params.partyB.name} (Pasport: ${params.partyB.passport || 'Kiritilmagan'})ga quyidagi vakolatlarni beraman:`
    );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('1. VAKOLAT MAVZUSI');
    doc.fontSize(10).fillColor('#334155').text(
      `1.1. Ishonchli vakil ${params.details.subjectAddressOrTitle || 'mulk / avtomobil / davlat idoralari loyihasi'} bo‘yicha men uchun harakat qilish, hujjatlarni topshirish va olish vakolatiga ega.`
    );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('2. VAKOLAT MUDDATI');
    doc.fontSize(10).fillColor('#334155').text(
      `2.1. Ushbu ishonchnoma ${params.details.durationOrDate || '1 (bir) yil'} muddatga berildi va uchinchi shaxslarga vakolatlarni qayta topshirish huquqisiz tuzildi.`
    );
  }

  private static buildOldiSotdiContent(doc: PDFKit.PDFDocument, params: DocTemplateParams) {
    doc.fillColor('#0F172A').fontSize(14).text('MULK / AVTOMOBIL OLDI-SOTDI SHARTNOMASI', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#1E293B');
    doc.text(
      `Sotuvchi: ${params.partyA.name} va Sotib oluvchi: ${params.partyB.name} ushbu shartnomani quyidagilar haqida tuzdilar:`
    );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('1. SHARTNOMA MAVZUSI VA QIYMATI');
    doc.fontSize(10).fillColor('#334155').text(
      `1.1. Sotuvchi o‘ziga tegishli bo‘lgan ${params.details.subjectAddressOrTitle || 'mulk / avtomobil'}ni Sotib oluvchiga mulk huquqi bilan topshiradi.\n` +
      `1.2. Oldi-sotdi ob’ekti qiymati ${params.details.amountOrPrice || 'Kelishilgan'} so‘m miqdorida belgilanadi va to‘liq to‘lab beriladi.`
    );
  }

  private static buildNikohContent(doc: PDFKit.PDFDocument, params: DocTemplateParams) {
    doc.fillColor('#0F172A').fontSize(14).text('NIKOH SHARTNOMASI (LOYIHA)', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#1E293B');
    doc.text(
      `Er: ${params.partyA.name} hamda Xotin: ${params.partyB.name} O‘zbekiston Respublikasi Oila Kodeksiga muvofiq nikoh davomida va (yoki) u bekor qilinganda er-xotinning mulkiy huquq hamda majburiyatlarini belgilash maqsadida ushbu shartnomani tuzdilar:`
    );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('1. MULK REJIMI');
    doc.fontSize(10).fillColor('#334155').text(
      `1.1. Nikoh davomida orttirilgan mol-mulk ${params.details.additionalInfo || 'hamma mulk ro‘yxatga olingan shaxsning xususiy mulki hisoblanadi'}.\n` +
      `1.2. Turar joy / Avtomobil va jamg‘armalar ulushi: ${params.details.amountOrPrice || 'Teng ulushlarda (50/50)'}.`
    );
  }

  private static buildXizmatContent(doc: PDFKit.PDFDocument, params: DocTemplateParams) {
    doc.fillColor('#0F172A').fontSize(14).text('HAK EVAZIGA XIZMAT KO‘RSATISH SHARTNOMASI', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#1E293B');
    doc.text(
      `Buyurtmachi: "${params.partyA.name}" va Ijrochi: ${params.partyB.name} ushbu shartnomani quyidagilar haqida tuzdilar:`
    );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#0F172A').text('1. XIZMAT MAVZUSI VA HAQI');
    doc.fontSize(10).fillColor('#334155').text(
      `1.1. Ijrochi Buyurtmachining topshirig‘iga ko‘ra ${params.details.subjectAddressOrTitle || 'xizmatlar'}ni ko‘rsatish, Buyurtmachi esa ushbu xizmatlar haqini to‘lash majburiyatini oladi.\n` +
      `1.2. Xizmat haqi summasi: ${params.details.amountOrPrice || 'Kelishilgan'} so‘m etib belgilanadi.\n` +
      `1.3. Xizmat ko‘rsatish muddatlari: ${params.details.durationOrDate || 'Belgilangan muddatgacha'}.`
    );
  }
}
