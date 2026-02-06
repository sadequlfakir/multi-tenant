export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold mb-4 text-foreground">404</h1>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Site not found</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          This site or address doesn&apos;t exist. Check the URL and try again.
        </p>
      </div>
    </div>
  )
}
