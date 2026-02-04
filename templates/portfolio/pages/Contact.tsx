'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tenant } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { Mail, Phone, MapPin } from 'lucide-react'

interface PortfolioContactProps {
  tenant: Tenant
}

export default function PortfolioContact({ tenant }: PortfolioContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would call an API
    alert('Thank you for your message! I will get back to you soon.')
    setFormData({ name: '', email: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={getTenantLink(tenant, '/')}>
            <h1 className="text-2xl font-bold text-foreground">{tenant.config.siteName}</h1>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href={getTenantLink(tenant, '/')} className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link href={getTenantLink(tenant, '/about')} className="text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link href={getTenantLink(tenant, '/projects')} className="text-muted-foreground hover:text-foreground">
              Projects
            </Link>
            <Link href={getTenantLink(tenant, '/contact')} className="text-foreground font-semibold">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Contact Content */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-5xl font-bold mb-4 text-foreground">Get In Touch</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Have a project in mind? I'd love to hear from you. Send me a message and I'll respond as soon as possible.
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant.config.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <a
                      href={`mailto:${tenant.config.contactEmail}`}
                      className="text-foreground hover:text-primary"
                    >
                      {tenant.config.contactEmail}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">New York, NY</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Send a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border text-card-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

