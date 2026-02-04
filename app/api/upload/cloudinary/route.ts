import { NextRequest, NextResponse } from 'next/server'
import { getCloudinary } from '@/lib/cloudinary'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  if (!getCloudinary()) {
    return NextResponse.json(
      {
        error:
          'Cloudinary is not configured. Set CLOUDINARY CONFIG KEYS in your environment, or add the image URL manually.',
      },
      { status: 503 }
    )
  }

  const cloudinary = getCloudinary()
  if (!cloudinary) {
    return NextResponse.json(
      { error: 'Cloudinary is not configured. Set CLOUDINARY CONFIG KEYS or use a URL.' },
      { status: 503 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided. Use form field "file".' },
        { status: 400 }
      )
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataUri,
        {
          folder: 'multi-tenant',
          resource_type: 'image',
        },
        (err, res) => (err ? reject(err) : resolve(res as { secure_url: string }))
      )
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
