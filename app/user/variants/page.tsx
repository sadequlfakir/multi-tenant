'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Layers } from 'lucide-react'

export default function UserVariantsPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('userToken')
    if (!token) {
      router.push('/user/login')
      return
    }
  }, [router])

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Variant option sets</h1>
          <p className="text-sm text-gray-500 mt-1">Reusable variant definitions (e.g. Color, Size)</p>
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl mb-2">Manage variant sets in your site admin</CardTitle>
            <CardDescription className="mb-6">
              Variant option sets are managed per site. Open <strong>My sites</strong>, choose a site, then use <strong>Admin</strong> → add products and attach variant sets when creating a product.
            </CardDescription>
            <Link href="/user/sites">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600">
                Open My sites
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
