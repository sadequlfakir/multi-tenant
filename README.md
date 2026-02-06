# Multi-Tenant Website Platform

A powerful multi-tenant website platform built with Next.js, Tailwind CSS, and shadcn/ui. Users can create their own e-commerce or portfolio websites with multiple pages and full API support.

## Features

- **Multi-Tenant Architecture**: Each user gets their own subdomain-based website
- **Two Template Types**:
  - **E-Commerce Template**: Complete online store with products, cart, and checkout
  - **Portfolio Template**: Beautiful portfolio with about, projects, and contact pages
- **Multiple Pages**: Each template includes multiple pages (home, products, cart, checkout for e-commerce; home, about, projects, contact for portfolio)
- **API Routes**: Full Next.js API support for tenant management and data handling
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **Type-Safe**: Full TypeScript support

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database (Supabase, required)

All data (tenants, users, admins, sessions, orders, customers) is stored in **Supabase**. You must configure it:

1. Create a project at [supabase.com](https://supabase.com) and get your project URL and **service role** key (Settings → API).
2. Add to `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Run the initial schema in the Supabase SQL Editor: copy the contents of `supabase/migrations/20250101000000_initial_schema.sql` and run it.
4. Restart the app.

## Project Structure

```
├── app/
│   ├── [tenant]/          # Dynamic tenant routes
│   │   ├── page.tsx       # Tenant home page (uses template registry)
│   │   ├── [...slug]/     # Catch-all route for all template routes
│   │   │   └── page.tsx   # Dynamic route handler
│   │   └── layout.tsx    # Tenant layout
│   ├── admin/            # Admin dashboard
│   ├── api/              # API routes
│   └── page.tsx          # Main landing page
├── templates/            # Template system (self-contained templates)
│   ├── ecommerce/        # E-commerce template
│   │   ├── index.tsx     # Home page component
│   │   ├── register.tsx  # Template registration
│   │   ├── routes.ts     # Route component exports
│   │   └── pages/       # Template-specific pages
│   ├── portfolio/        # Portfolio template
│   │   ├── index.tsx     # Home page component
│   │   ├── register.tsx  # Template registration
│   │   ├── routes.ts     # Route component exports
│   │   └── pages/       # Template-specific pages
│   └── index.ts         # Template registry initialization
├── components/
│   └── ui/               # shadcn/ui components
└── lib/
    ├── tenant-store.ts   # Tenant data management
    ├── template-registry.ts  # Template registration system
    └── types.ts          # TypeScript types
```

## Adding New Templates

To add a new template, simply create a new folder in `templates/`:

1. **Create template folder**: `templates/your-template/`
2. **Create home component**: `templates/your-template/index.tsx`
3. **Create pages**: `templates/your-template/pages/YourPage.tsx`
4. **Define routes**: `templates/your-template/routes.ts` - Define all your routes with patterns
5. **Register template**: `templates/your-template/register.tsx` - Register with route handlers
6. **Import in registry**: Add `import './your-template/register'` to `templates/index.ts`

**That's it!** No need to create route files in `app/[tenant]`. The dynamic routing system handles everything automatically!

### Example Route Definition

```typescript
// templates/your-template/routes.ts
export function getYourTemplateRoutes(): TemplateRouteHandler[] {
  return [
    {
      pattern: '/page1',
      component: (tenant: Tenant) => <Page1 tenant={tenant} />,
    },
    {
      pattern: '/page2/[id]',
      component: (tenant: Tenant, params?: Record<string, string>) => (
        <Page2 tenant={tenant} itemId={params?.id || ''} />
      ),
    },
  ]
}
```

The routing system automatically matches paths and renders the correct component!

## API Routes

### Tenants

- `GET /api/tenants` - Get all tenants or a specific tenant by subdomain
- `POST /api/tenants` - Create a new tenant
- `GET /api/tenants/[subdomain]` - Get tenant by subdomain
- `PATCH /api/tenants/[subdomain]` - Update tenant configuration

### Products (E-Commerce)

- `GET /api/products?subdomain=xxx` - Get products for a tenant

### Projects (Portfolio)

- `GET /api/projects?subdomain=xxx` - Get projects for a tenant

## Usage

1. **Create a Site**: Visit `/admin` to create a new tenant site
2. **Choose Template**: Select either e-commerce or portfolio template
3. **Customize**: Configure your site name, description, and content
4. **Access Your Site**:
   - **Production (Subdomain)**: `https://{subdomain}.yourdomain.com` (e.g., `shop.yourdomain.com`)
   - **Development (Path)**: `http://localhost:3000/{subdomain}` (e.g., `localhost:3000/shop`)

### Routing Modes

The platform supports two routing modes:

1. **Subdomain Routing** (Production): Each tenant gets their own subdomain
   - Example: `shop.yourdomain.com`, `john.yourdomain.com`
   - Configure your DNS to point `*.yourdomain.com` to your server

2. **Path Routing** (Development): For local development
   - Example: `localhost:3000/shop`, `localhost:3000/john`, `localhost:3000/myecom`
   - Always works and is the most reliable for local dev

3. **Subdomain on localhost** (e.g. `http://myecom.localhost:3000/`): Works if your system resolves `*.localhost` to `127.0.0.1`. If a subdomain URL does not load, use path-based instead: `http://localhost:3000/myecom`

## Demo Sites

The platform comes with two demo sites:
- `/shop` - E-commerce demo
- `/john` - Portfolio demo

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **Radix UI** - Accessible component primitives

## License

MIT

