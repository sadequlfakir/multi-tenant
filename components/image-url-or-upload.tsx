'use client'

import { useRef, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'

interface ImageUrlOrUploadProps {
  id: string
  value: string
  onChange: (url: string) => void
  /** When user selects a file (not uploaded yet). Parent uploads on save. */
  onFileSelect?: (file: File | null) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  required?: boolean
  /** Show preview thumbnail (default true) */
  showPreview?: boolean
  /** Preview size: sm 24px, md 32px, lg 48px (default md) */
  previewSize?: 'sm' | 'md' | 'lg'
}

/**
 * Image field: paste any URL, or choose a file (uploaded when form is saved).
 * No upload until save — avoids orphan images if user cancels.
 * Shows preview for URL or selected file.
 */
export function ImageUrlOrUpload({
  id,
  value,
  onChange,
  onFileSelect,
  placeholder = 'https://example.com/image.jpg',
  label = 'Image URL',
  disabled = false,
  required = false,
  showPreview = true,
  previewSize = 'md',
}: ImageUrlOrUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null)

  // Preview: URL from value, or object URL from pending file
  const previewUrl = pendingFile ? previewObjectUrl : value || null

  // Create/revoke object URL when pending file changes
  const objectUrlRef = useRef<string | null>(null)
  useEffect(() => {
    if (!pendingFile) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
        setPreviewObjectUrl(null)
      }
      return
    }
    const url = URL.createObjectURL(pendingFile)
    objectUrlRef.current = url
    setPreviewObjectUrl(url)
    return () => {
      URL.revokeObjectURL(url)
      objectUrlRef.current = null
    }
  }, [pendingFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPendingFile(file)
    onChange('')
    onFileSelect?.(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUrlChange = (url: string) => {
    if (pendingFile) {
      setPendingFile(null)
      onFileSelect?.(null)
    }
    onChange(url)
  }

  const clearImage = () => {
    setPendingFile(null)
    onChange('')
    onFileSelect?.(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="url"
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required && !pendingFile}
          className="flex-1"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="shrink-0"
        >
          <Upload className="w-4 h-4 mr-1" />
          Choose file
        </Button>
      </div>
      {showPreview && (previewUrl || value || pendingFile) && (
        <div className="relative inline-block">
          <div
            className={`rounded-md border border-input overflow-hidden bg-muted flex items-center justify-center ${
              previewSize === 'sm' ? 'w-24 h-24' : previewSize === 'lg' ? 'w-32 h-32' : 'w-28 h-28'
            }`}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-muted-foreground">Preview</span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-muted hover:bg-muted/80"
            onClick={clearImage}
            disabled={disabled}
            aria-label="Clear image"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
      {pendingFile && (
        <p className="text-xs text-muted-foreground">
          {pendingFile.name} — will be uploaded when you save. Max 10MB, JPEG/PNG/GIF/WebP.
        </p>
      )}
      {!pendingFile && (
        <p className="text-xs text-muted-foreground">
          Paste any image URL, or choose a file (uploaded when you save). Max 10MB.
        </p>
      )}
    </div>
  )
}
