const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://campus.nexatechlabs.my.id').replace(/\/$/, '')

export const BRAND = {
  companyName: 'NEXA Tech Labs',
  productName: 'NEXA Campus',
  version: '1.5.23',
  domain: SITE_URL.replace(/^https?:\/\//, ''),
  siteUrl: SITE_URL,
  disclaimer:
    'NEXA Campus bukan sistem resmi kampus. Informasi final tetap perlu dicek lewat kanal resmi kampus.',
} as const
