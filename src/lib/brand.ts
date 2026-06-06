const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://campus.nexatechlabs.my.id').replace(/\/$/, '')

export const BRAND = {
  companyName: 'NEXA Tech Labs',
  productName: 'NEXA Campus',
  version: '1.0.0',
  domain: SITE_URL.replace(/^https?:\/\//, ''),
  siteUrl: SITE_URL,
  disclaimer:
    'NEXA Campus bukan sistem resmi kampus. Selalu cek informasi final dari kanal resmi kampus.',
} as const
