import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllTenants } from '@/lib/tenant-store'
import { warmupCache } from '@/lib/cache-warmup'

export default async function HomePage() {
  // Warm up cache on home page load
  await warmupCache()
  const tenants = await getAllTenants()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Multi-Tenant Website Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create your e-commerce or portfolio website in minutes
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/user/register">
              <Button size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/user/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>E-Commerce Template</CardTitle>
              <CardDescription>
                Build a complete online store with product pages, cart, and checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Product catalog</li>
                <li>Shopping cart</li>
                <li>Checkout process</li>
                <li>Product detail pages</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Template</CardTitle>
              <CardDescription>
                Showcase your work with a beautiful portfolio website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Home page</li>
                <li>About section</li>
                <li>Projects showcase</li>
                <li>Contact form</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold text-center mb-8">Demo Sites</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <Card key={tenant.id}>
                <CardHeader>
                  <CardTitle>{tenant.config.siteName}</CardTitle>
                  <CardDescription>{tenant.config.siteDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Template: {tenant.template}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/${tenant.subdomain}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Visit Site (Path)
                        </Button>
                      </Link>
                      <p className="text-xs text-gray-400 text-center">
                        Production: {tenant.subdomain}.yourdomain.com
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

