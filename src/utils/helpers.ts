/**
 * Escapes special HTML characters to safely include dynamic user inputs in Telegram HTML parse mode messages.
 */
export function escapeHTML(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escapes Telegram Markdown special characters for Markdown mode if needed
 */
export function escapeMarkdown(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

/**
 * Strips HTML tags from text
 */
export function stripHTML(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '');
}

/**
 * Safely converts Markdown formatting (like **bold**, *italic*, `code`, # Headers)
 * to Telegram-compatible HTML tags (<b>, <i>, <code>).
 */
export function formatTelegramHtml(text: string | null | undefined): string {
  if (!text) return '';

  let formatted = text;

  // Replace Markdown headers ### or ## or # with bold
  formatted = formatted.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');

  // Replace bold Markdown **text** or __text__ with <b>text</b>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  formatted = formatted.replace(/__(.*?)__/g, '<b>$1</b>');

  // Replace inline code `code` with <code>code</code>
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Replace italic *text* or _text_ with <i>text</i>
  formatted = formatted.replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '<i>$1</i>');

  // Clean unsupported HTML tags like <p>, </p>, <br>, <div>, </div>
  formatted = formatted
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|span|h[1-6]|ul|ol|li)[^>]*>/gi, '');

  return formatted.trim();
}
