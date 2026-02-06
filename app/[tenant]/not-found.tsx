import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TenantNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Tenant not found</h2>
        <p className="text-gray-600 mb-8">
          This site or subdomain doesn&apos;t exist. Check the URL or go back home.
        </p>
        <Link href="/">
          <Button size="lg">Go Back Home</Button>
        </Link>
      </div>
    </div>
  )
}
