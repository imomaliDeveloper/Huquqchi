import { Markup } from 'telegraf';
import { USER_ROLE_LABELS, UserRole } from '../utils/constants';

export function getPhoneRequestKeyboard() {
  return Markup.keyboard([
    [Markup.button.contactRequest('📱 Telefon raqamni yuborish')],
  ]).resize().oneTime();
}

export function getRoleSelectKeyboard() {
  const roles = Object.entries(USER_ROLE_LABELS).map(([key, val]) => `${val.icon} ${val.label}`);
  return Markup.keyboard([
    [roles[0]!, roles[1]!],
    [roles[2]!, roles[3]!],
    [roles[4]!],
  ]).resize().oneTime();
}

export function parseRoleFromInput(input: string): UserRole | null {
  const cleanInput = input.trim().toLowerCase();
  for (const [key, val] of Object.entries(USER_ROLE_LABELS)) {
    if (cleanInput.includes(val.label.toLowerCase()) || cleanInput === key.toLowerCase()) {
      return key as UserRole;
    }
  }
  return null;
}
