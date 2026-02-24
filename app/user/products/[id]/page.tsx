'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Edit } from 'lucide-react'

export default function UserEditProductPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('userToken')
    if (!token) {
      router.push('/user/login')
      return
    }
  }, [router])

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Edit className="w-8 h-8 text-indigo-600" />
          </div>
          <CardTitle className="text-xl mb-2">Edit product in your site admin</CardTitle>
          <CardDescription className="mb-6">
            Product editing is in each site’s admin. Open <strong>My sites</strong>, click <strong>Admin</strong> on the site, then open <strong>Products</strong> and edit the product there.
          </CardDescription>
          <Link href="/user/sites">
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600">
              Open My sites
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
