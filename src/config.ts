export const APP_CONFIG = {
  // Owner Admin Credentials
  adminEmail: (import.meta.env.VITE_ADMIN_EMAIL || 'admin@eduethiopia.et').trim().toLowerCase(),
  adminPassword: (import.meta.env.VITE_ADMIN_PASSWORD || 'admin123456').trim(),

  // Payment Configuration
  telebirrPhone: (import.meta.env.VITE_TELEBIRR_PHONE || '0912345678').trim(),
  telebirrReceiverName: (import.meta.env.VITE_TELEBIRR_NAME || 'EduEthiopia Store').trim(),
  proPriceETB: Number(import.meta.env.VITE_PRO_PRICE_ETB) || 500,

  // App Meta
  appName: 'EduEthiopia AI',
  supportEmail: (import.meta.env.VITE_SUPPORT_EMAIL || 'support@eduethiopia.et').trim(),
};
