import { API_URL } from '../services/api'

export function resolveMediaUrl(url?: string) {
  if (!url) return ''
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  if (url.startsWith(API_URL)) return url
  if (url.startsWith('//')) return url
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`
}
