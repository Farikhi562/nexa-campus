import type { MetadataRoute } from 'next'
import { BRAND } from '@/lib/brand'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = ['', '/pricing', '/support', '/privacy', '/terms', '/release-notes', '/login']
  return routes.map((path) => ({
    url: `${BRAND.siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/pricing' ? 0.9 : 0.6,
  }))
}
