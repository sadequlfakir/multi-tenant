/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending a number if needed
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
  currentSlug?: string
): string {
  if (!baseSlug) return ''
  
  // If current slug matches, it's fine
  if (currentSlug && baseSlug === currentSlug) {
    return baseSlug
  }
  
  let slug = baseSlug
  let counter = 1
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}
