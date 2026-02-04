'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tenant } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { ArrowRight, Github, Linkedin, Mail } from 'lucide-react'

interface PortfolioHomeProps {
  tenant: Tenant
}

export default function PortfolioHome({ tenant }: PortfolioHomeProps) {
  const featuredProjects = tenant.config.projects?.slice(0, 3) || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {tenant.config.logo ? (
            <Link href={getTenantLink(tenant, '/')}>
              <img
                src={tenant.config.logo}
                alt={tenant.config.siteName}
                className="h-9 w-auto max-w-[180px] object-contain object-left"
              />
            </Link>
          ) : (
            <h1 className="text-2xl font-bold text-foreground">{tenant.config.siteName}</h1>
          )}
          <nav className="flex items-center gap-6">
            <Link href={getTenantLink(tenant, '/')} className="text-foreground font-semibold">
              Home
            </Link>
            <Link href={getTenantLink(tenant, '/about')} className="text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link href={getTenantLink(tenant, '/projects')} className="text-muted-foreground hover:text-foreground">
              Projects
            </Link>
            <Link href={getTenantLink(tenant, '/contact')} className="text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6 text-foreground">{tenant.config.siteName}</h1>
        <p className="text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {tenant.config.siteDescription}
        </p>
        <div className="flex gap-4 justify-center">
          <Link href={getTenantLink(tenant, '/projects')}>
            <Button size="lg" className="text-lg">
              View My Work
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href={getTenantLink(tenant, '/contact')}>
            <Button size="lg" variant="outline" className="text-lg">
              Get In Touch
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-foreground">Featured Projects</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {featuredProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                    <p className="text-muted-foreground mb-4">{project.description}</p>
                    {project.technologies && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.technologies.map((tech, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.link && (
                      <Link href={project.link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          View Project
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href={getTenantLink(tenant, '/projects')}>
                <Button variant="outline" size="lg">
                  View All Projects
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-card border-t border-border text-card-foreground py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <p>&copy; 2024 {tenant.config.siteName}. All rights reserved.</p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm">
                <Github className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Linkedin className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Mail className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

