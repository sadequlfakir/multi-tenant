'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tenant } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

interface PortfolioAboutProps {
  tenant: Tenant
}

export default function PortfolioAbout({ tenant }: PortfolioAboutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${tenant.subdomain}`}>
            <h1 className="text-2xl font-bold">{tenant.config.siteName}</h1>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href={`/${tenant.subdomain}`} className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href={`/${tenant.subdomain}/about`} className="text-gray-900 font-semibold">
              About
            </Link>
            <Link href={`/${tenant.subdomain}/projects`} className="text-gray-600 hover:text-gray-900">
              Projects
            </Link>
            <Link href={`/${tenant.subdomain}/contact`} className="text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* About Content */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-5xl font-bold mb-8">About Me</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-700 leading-relaxed mb-6">
            {tenant.config.about || 'This is where you can tell your story. Update your about section in the admin panel.'}
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            I'm passionate about creating beautiful, functional, and user-friendly web experiences.
            With years of experience in web development, I bring creativity and technical expertise
            to every project I work on.
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Skills & Expertise</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Frontend</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• React & Next.js</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• UI/UX Design</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Backend</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Node.js</li>
                <li>• API Development</li>
                <li>• Database Design</li>
                <li>• Cloud Services</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Link href={`/${tenant.subdomain}/contact`}>
            <Button size="lg">
              Get In Touch
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

