'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tenant } from '@/lib/types'

interface PortfolioProjectsProps {
  tenant: Tenant
}

export default function PortfolioProjects({ tenant }: PortfolioProjectsProps) {
  const projects = tenant.config.projects || []

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
            <Link href={`/${tenant.subdomain}/about`} className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href={`/${tenant.subdomain}/projects`} className="text-gray-900 font-semibold">
              Projects
            </Link>
            <Link href={`/${tenant.subdomain}/contact`} className="text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Projects Grid */}
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold mb-12">My Projects</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 relative">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-3">{project.title}</h3>
                <p className="text-gray-600 mb-4">{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {project.link && (
                  <Link href={project.link} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      View Project
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No projects available yet.</p>
          </div>
        )}
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

