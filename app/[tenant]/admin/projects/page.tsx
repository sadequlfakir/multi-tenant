'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuthToken } from '@/lib/auth-client'
import { FolderKanban } from 'lucide-react'
import { useTenantAdmin } from '../use-tenant-admin'

type Project = { id: string; title: string; description?: string; image?: string }

export default function TenantAdminProjectsPage() {
  const { tenant, loading: tenantLoading, adminBase } = useTenantAdmin()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant || tenant.template !== 'portfolio') return
    const token = getAuthToken()
    if (!token) return
    fetch(`/api/projects?subdomain=${tenant.subdomain}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tenant])

  if (tenantLoading || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  if (tenant.template !== 'portfolio') {
    return <p className="text-gray-500">Projects are only for portfolio sites.</p>
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <p className="text-sm text-gray-500 mt-1">Portfolio projects</p>
      </div>
      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600">Add projects to your portfolio.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                {p.description && <p>{p.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
