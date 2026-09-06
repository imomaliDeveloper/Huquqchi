import { escapeHTML } from './helpers';

export { escapeHTML };

export const UI = {
  DIVIDER: '━━━━━━━━━━━━━━━━━━━━',
  THIN_DIVIDER: '────────────────────',
  DOT_DIVIDER: '▫️ ▫️ ▫️ ▫️ ▫️ ▫️ ▫️ ▫️ ▫️ ▫️',

  // Progress Bar Generator
  progressBar(current: number, total: number, size = 8): string {
    const progress = Math.max(0, Math.min(size, Math.round((current / total) * size)));
    const filled = '🟩'.repeat(progress);
    const empty = '⬜'.repeat(size - progress);
    return `${filled}${empty}`;
  },

  // Header Banner Component
  header(title: string, icon = '⚖️'): string {
    return `${icon} <b>${title.toUpperCase()}</b>\n${this.DIVIDER}`;
  },

  // Quote / Card Block
  card(content: string): string {
    return `<blockquote>${content}</blockquote>`;
  },

  // Status Badge
  badge(text: string, type: 'success' | 'warning' | 'info' | 'pro' = 'info'): string {
    const icons = {
      success: '🟢',
      warning: '🟡',
      info: '🔵',
      pro: '⭐',
    };
    return `${icons[type]} <b>${text}</b>`;
  },
};

export function formatHeader(title: string, icon = '⚖️'): string {
  return UI.header(title, icon);
}

export function formatBadge(text: string, type: 'success' | 'warning' | 'info' | 'pro' = 'info'): string {
  return UI.badge(text, type);
}

export function formatSectionDivider(): string {
  return UI.DIVIDER;
}

export default UI;
