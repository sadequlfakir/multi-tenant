import { NextResponse } from 'next/server'
import { initializeDefaultAdmin } from '@/lib/storage'

// Initialize default admin on first run
export async function GET() {
  try {
    await initializeDefaultAdmin()
    return NextResponse.json({ message: 'Initialized successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initialize' },
      { status: 500 }
    )
  }
}
