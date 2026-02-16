# Customer Authentication Guide

## How to Access Customer Login/Signup Pages

Customer authentication pages are accessible through **tenant subdomain routes**. Here's how:

### Step 1: Ensure Database Migration is Run

First, make sure you've run the customer accounts migration in Supabase:

1. Go to your Supabase project SQL Editor
2. Run the migration file: `supabase/migrations/20250216000000_customer_accounts_and_addresses.sql`
3. This creates the `customer_accounts` and `customer_addresses` tables

### Step 2: Access Customer Pages

#### Option A: Through an E-Commerce Tenant Site

1. **Create or access an e-commerce tenant**:
   - Visit `/admin` to create a new tenant
   - Or use an existing e-commerce tenant (e.g., `/shop`)

2. **Access customer pages**:
   - **Login**: `http://localhost:3000/{tenant-subdomain}/customer/login`
     - Example: `http://localhost:3000/shop/customer/login`
   - **Register**: `http://localhost:3000/{tenant-subdomain}/customer/register`
     - Example: `http://localhost:3000/shop/customer/register`
   - **Dashboard**: `http://localhost:3000/{tenant-subdomain}/customer/dashboard`
     - Example: `http://localhost:3000/shop/customer/dashboard`

#### Option B: Through the Header Button

1. Visit any e-commerce tenant site (e.g., `http://localhost:3000/shop`)
2. Look for the **"Login"** button in the header (top right)
3. Click it to go to the customer login page

### Step 3: Test Customer Registration

1. Go to: `http://localhost:3000/shop/customer/register`
2. Fill in the form:
   - Full Name
   - Email
   - Password (at least 6 characters)
   - Phone (optional)
3. Click "Sign Up"
4. You'll be redirected to the login page

### Step 4: Test Customer Login

1. Go to: `http://localhost:3000/shop/customer/login`
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to the dashboard

### Step 5: Access Customer Dashboard

After logging in, you can:
- View all your orders
- Filter orders by status (pending, processing, shipped, delivered, cancelled)
- Manage your address book
- Add, edit, or delete addresses
- Set a default address

## Quick Test URLs

If you have a tenant with subdomain `shop`:

- **Home**: `http://localhost:3000/shop`
- **Login**: `http://localhost:3000/shop/customer/login`
- **Register**: `http://localhost:3000/shop/customer/register`
- **Dashboard**: `http://localhost:3000/shop/customer/dashboard`

## Troubleshooting

### "Page Not Found" Error

- Make sure you're accessing through a tenant subdomain (e.g., `/shop/customer/login`, not `/customer/login`)
- Verify the tenant exists and is an e-commerce template
- Check that the migration has been run

### "Login Failed" Error

- Verify the customer account exists
- Check that you're using the correct tenant subdomain
- Ensure the email matches exactly (case-insensitive)

### Can't See Login Button

- Make sure you're on an e-commerce tenant site (not portfolio)
- Check that the tenant subdomain is correct
- Try refreshing the page

## API Endpoints

Customer authentication uses these API endpoints:

- `POST /api/customer/auth/register` - Register new customer
- `POST /api/customer/auth/login` - Login customer
- `GET /api/customer/auth/me` - Get current customer info
- `GET /api/customer/orders` - Get customer orders (with status filter)
- `GET /api/customer/addresses` - Get customer addresses
- `POST /api/customer/addresses` - Create address
- `PUT /api/customer/addresses/[id]` - Update address
- `DELETE /api/customer/addresses/[id]` - Delete address
