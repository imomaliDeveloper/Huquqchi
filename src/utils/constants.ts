export enum UserRole {
  ABITURIYENT = 'ABITURIYENT',
  FUQARO = 'FUQARO',
  TALABA = 'TALABA',
  TADBIRKOR = 'TADBIRKOR',
  YURIST = 'YURIST',
}

export const USER_ROLE_LABELS: Record<UserRole, { label: string; icon: string }> = {
  [UserRole.ABITURIYENT]: { label: 'Abituriyent', icon: '👨‍🎓' },
  [UserRole.FUQARO]: { label: 'Fuqaro', icon: '👤' },
  [UserRole.TALABA]: { label: 'Talaba', icon: '🎓' },
  [UserRole.TADBIRKOR]: { label: 'Tadbirkor', icon: '💼' },
  [UserRole.YURIST]: { label: 'Yurist', icon: '⚖️' },
};
