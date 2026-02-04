import { v2 as cloudinary } from 'cloudinary'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
const API_SECRET = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET

export function getCloudinary(): typeof cloudinary | null {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) return null
  try {
    cloudinary.config({
      cloud_name: CLOUD_NAME,
      api_key: API_KEY,
      api_secret: API_SECRET,
    })
    return cloudinary
  } catch {
    return null
  }
}

export function isCloudinaryUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  return url.includes('res.cloudinary.com')
}

/**
 * Extract Cloudinary public_id from a secure URL.
 * e.g. https://res.cloudinary.com/cloud/image/upload/v123/multi-tenant/abc.jpg -> multi-tenant/abc
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/)
    if (!match) return null
    let path = match[1].replace(/^v\d+\//, '').trim()
    if (!path) return null
    path = path.replace(/\.[^.]+$/, '') // remove extension
    return path
  } catch {
    return null
  }
}

/**
 * Delete an image from Cloudinary by its URL (e.g. when replacing with a new image).
 * No-op if URL is not Cloudinary or config is missing. Logs and ignores delete errors.
 */
export async function deleteByUrl(url: string): Promise<void> {
  const cld = getCloudinary()
  if (!cld) return
  const publicId = getPublicIdFromUrl(url)
  if (!publicId) return
  try {
    await new Promise<void>((resolve, reject) => {
      cld.uploader.destroy(publicId, { resource_type: 'image' }, (err) =>
        err ? reject(err) : resolve()
      )
    })
  } catch (err) {
    console.warn('Cloudinary delete failed (image may already be removed):', publicId, err)
  }
}
