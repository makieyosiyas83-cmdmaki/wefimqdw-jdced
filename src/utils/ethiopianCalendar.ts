export interface EthMonth {
  nameEn: string;
  nameAm: string;
  days: number;
}

export const ETHIOPIAN_MONTHS: EthMonth[] = [
  { nameEn: 'Meskerem', nameAm: 'መስከረም', days: 30 },
  { nameEn: 'Tikimt', nameAm: 'ጥቅምት', days: 30 },
  { nameEn: 'Hidar', nameAm: 'ህዳር', days: 30 },
  { nameEn: 'Tahsas', nameAm: 'ታህሳስ', days: 30 },
  { nameEn: 'Ter', nameAm: 'ጥር', days: 30 },
  { nameEn: 'Yakatit', nameAm: 'የካቲት', days: 30 },
  { nameEn: 'Megabit', nameAm: 'መጋቢት', days: 30 },
  { nameEn: 'Miazia', nameAm: 'ሚያዚያ', days: 30 },
  { nameEn: 'Genbot', nameAm: 'ግንቦት', days: 30 },
  { nameEn: 'Sene', nameAm: 'ሰኔ', days: 30 },
  { nameEn: 'Hamle', nameAm: 'ሐምሌ', days: 30 },
  { nameEn: 'Nehase', nameAm: 'ነሐሴ', days: 30 },
  { nameEn: 'Pagume', nameAm: 'ጳጉሜ', days: 6 }, // 5 or 6 depending on leap year
];

export const ETHIOPIAN_YEARS = Array.from({ length: 35 }, (_, i) => 1985 + i); // 1985 to 2019 E.C.

export function formatEthiopianDate(day: number, month: string, year: number, lang: 'en' | 'am' = 'en'): string {
  const monthObj = ETHIOPIAN_MONTHS.find(m => m.nameEn === month || m.nameAm === month);
  const monthDisplay = lang === 'am' ? (monthObj?.nameAm || month) : (monthObj?.nameEn || month);
  return `${monthDisplay} ${day}, ${year} E.C.`;
}
