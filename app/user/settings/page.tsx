'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Lock } from 'lucide-react'

export default function UserSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('userToken')
    if (!token) {
      router.push('/user/login')
      return
    }
    // Just verify token is valid
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          router.push('/user/login')
        } else {
          setLoading(false)
        }
      })
      .catch(() => router.push('/user/login'))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account settings...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Account settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your login and account security. Site configuration now lives in each site’s
            tenant admin.
          </p>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-3xl">
        <div className="space-y-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change password
              </CardTitle>
              <CardDescription>Update the password for your dashboard account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                  disabled={changingPassword}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="Enter new password"
                  disabled={changingPassword}
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters.</p>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                  disabled={changingPassword}
                  minLength={6}
                />
              </div>
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                  Password changed successfully!
                </div>
              )}
              <ButtonWithLoader
                onClick={async () => {
                  if (
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword
                  ) {
                    setPasswordError('All fields are required')
                    return
                  }
                  if (passwordData.newPassword !== passwordData.confirmPassword) {
                    setPasswordError('New passwords do not match')
                    return
                  }
                  if (passwordData.newPassword.length < 6) {
                    setPasswordError('New password must be at least 6 characters')
                    return
                  }
                  setChangingPassword(true)
                  setPasswordError('')
                  setPasswordSuccess(false)
                  try {
                    const token = localStorage.getItem('userToken')
                    if (!token) {
                      router.push('/user/login')
                      return
                    }
                    const res = await fetch('/api/auth/change-password', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        currentPassword: passwordData.currentPassword,
                        newPassword: passwordData.newPassword,
                      }),
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Failed to change password')
                    setPasswordSuccess(true)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                    setTimeout(() => setPasswordSuccess(false), 5000)
                  } catch (e) {
                    setPasswordError(
                      e instanceof Error ? e.message : 'Failed to change password'
                    )
                  } finally {
                    setChangingPassword(false)
                  }
                }}
                loading={changingPassword}
                loadingLabel="Changing..."
                disabled={changingPassword}
              >
                Change password
              </ButtonWithLoader>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Delete account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all related data. This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Type <strong>DELETE</strong> below to confirm.
              </p>
              <Input
                placeholder="Type DELETE to confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="max-w-xs font-mono"
                disabled={deleting}
              />
              <Button
                variant="destructive"
                disabled={deleteConfirm !== 'DELETE' || deleting}
                onClick={async () => {
                  if (deleteConfirm !== 'DELETE') return
                  setDeleting(true)
                  try {
                    const token = localStorage.getItem('userToken')
                    if (!token) {
                      router.push('/user/login')
                      return
                    }
                    const res = await fetch('/api/users/delete-account', {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                    })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) throw new Error(data.error || 'Failed to delete account')
                    localStorage.removeItem('userToken')
                    localStorage.removeItem('userType')
                    router.push('/user/login')
                  } catch (e) {
                    alert(e instanceof Error ? e.message : 'Failed to delete account')
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? 'Deleting...' : 'Permanently delete my account'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

