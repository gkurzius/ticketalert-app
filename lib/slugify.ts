export function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function cleanArtistName(name: string): string {
  return name
    .split(/:\s*|\s+[-–—]\s+|\s+with\s+|\s+presented\s+by\s+/i)[0]
    .trim()
}

export function toArtistPageSlug(artistName: string): string {
  return toSlug(cleanArtistName(artistName)) + '-tickets'
}

export function artistPageSlugToSearchSlug(pageSlug: string): string {
  return pageSlug.replace(/-tickets$/, '')
}

export function slugMatchesArtist(searchSlug: string, artistName: string): boolean {
  return toSlug(cleanArtistName(artistName)) === searchSlug
}

export function formatSlugAsTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
