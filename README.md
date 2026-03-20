# NikShop 2026 — Full-Stack Multi-Seller Marketplace

A production-ready, senior-level e-commerce marketplace built with the latest stack. Dark luxury design, real product uploads via Vercel Blob, three user roles, and full Stripe payment flow.

---

## ✨ Features

| Feature | Details |
|---|---|
| **3 User Roles** | USER (buyer), SELLER (lister), ADMIN (platform manager) |
| **Real Image Uploads** | Drag-and-drop → Vercel Blob storage |
| **Real Product CRUD** | Sellers create/edit/delete their own products |
| **Seller Dashboard** | Revenue stats, product management, order tracking |
| **Admin Dashboard** | Platform stats, seller approval, all orders/products |
| **Stripe Checkout** | Full Stripe-hosted checkout + webhook order creation |
| **Auth** | NextAuth v5 — Google OAuth + Email/Password |
| **MongoDB** | Mongoose models with full indexing |
| **2026 Design** | Dark glassmorphism, gradient text, glow shadows, animations |

---

## 🗂 Project Structure

```
src/
├── app/
│   ├── (storefront)/          # Public buyer-facing pages
│   │   ├── page.tsx           # Homepage
│   │   ├── products/          # Product listing + detail
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Checkout + success
│   │   ├── orders/            # Order history
│   │   ├── account/           # User account
│   │   └── search/            # Live search
│   ├── (auth)/                # Login + Register pages
│   ├── (dashboard)/           # Role-protected dashboards
│   │   ├── seller/            # Seller: products, orders, stats
│   │   └── admin/             # Admin: all products, orders, sellers, categories
│   └── api/
│       ├── auth/              # NextAuth + Register
│       ├── products/          # Public product API
│       ├── upload/            # Vercel Blob image upload
│       ├── seller/            # Seller-only product + order API
│       ├── admin/             # Admin-only APIs
│       ├── orders/            # User order history + by-session
│       ├── payments/          # Stripe session creation
│       ├── webhooks/stripe/   # Stripe webhook → order + stock
│       └── categories/        # Category CRUD
├── components/
│   ├── layout/                # Navbar, Footer
│   ├── dashboard/             # DashboardSidebar
│   ├── product/               # ProductCard, ProductsFilter
│   └── upload/                # ImageUploader (drag-drop → Blob)
├── lib/
│   ├── auth.ts                # NextAuth v5 config
│   ├── mongodb.ts             # Mongoose connection pool
│   ├── stripe.ts              # Stripe client
│   ├── utils.ts               # Helpers
│   └── models/                # User, Product, Order, Category
├── store/
│   └── cart.ts                # Zustand cart (persisted)
└── middleware.ts              # Route protection by role
```

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Connect → Drivers |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID/SECRET` | [Google Cloud Console](https://console.cloud.google.com) → OAuth 2.0 |
| `BLOB_READ_WRITE_TOKEN` | [Vercel Dashboard](https://vercel.com) → Storage → Blob → Token |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com) → API Keys |
| `STRIPE_PUBLISHABLE_KEY` | Same (starts with `pk_`) |
| `STRIPE_WEBHOOK_SECRET` | See webhook setup below |

### 3. Run dev server
```bash
npm run dev
```

---

## 🖼 Vercel Blob Setup

1. Go to [vercel.com](https://vercel.com) → your project → **Storage** tab
2. Create a **Blob** store
3. Copy the `BLOB_READ_WRITE_TOKEN` to your `.env`

Images uploaded by sellers are stored at `products/{userId}-{timestamp}.ext` and served via Vercel's CDN.

---

## 💳 Stripe Webhook (Local Dev)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the **webhook signing secret** to `STRIPE_WEBHOOK_SECRET` in `.env`.

**Production:** Create a webhook in Stripe Dashboard → `https://yourdomain.com/api/webhooks/stripe` → Event: `checkout.session.completed`

---

## 🔐 Google OAuth Setup

1. [Google Cloud Console](https://console.cloud.google.com) → New project
2. APIs & Services → OAuth 2.0 Credentials → Web application
3. Authorized redirect URIs:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://yourdomain.com/api/auth/callback/google`

---

## 👑 Creating an Admin User

1. Register a normal account at `/register`
2. Go to MongoDB Atlas → Browse Collections → `users`
3. Find your user → change `role` from `"USER"` to `"ADMIN"` → Save
4. Visit `/admin`

---

## 🏪 Seller Flow

1. Register at `/register?role=seller` with store name
2. Admin approves at `/admin/sellers`
3. Seller logs in → `/seller/products/new`
4. Upload images (drag-drop → Vercel Blob)
5. Fill product details → Publish
6. Product appears on storefront immediately

---

## 🏗 Architecture

```
Browser
├── Storefront (App Router SSR/Client)
├── Auth Pages (Client)
└── Dashboard (Client + Server)

API Layer (/api/*)
├── Public:    /api/products, /api/categories
├── Auth:      /api/auth/[...nextauth], /api/auth/register
├── Upload:    /api/upload → Vercel Blob
├── Seller:    /api/seller/products, /api/seller/orders
├── Admin:     /api/admin/*
├── Payments:  /api/payments/create-session → Stripe
└── Webhook:   /api/webhooks/stripe → Order + Stock

Data (MongoDB via Mongoose)
├── User       (roles: USER | SELLER | ADMIN, sellerProfile)
├── Product    (images[], sellerId, status, slug, stock)
├── Order      (items[{sellerId}], stripeSessionId, status)
└── Category   (slug, active, productCount)

External
├── Vercel Blob   → Image storage (CDN)
├── Stripe        → Payments + webhooks
└── Google        → OAuth login
```

---

## 🚀 Deploy to Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add all environment variables
4. Set `NEXT_PUBLIC_APP_URL` to your production domain
5. Create production Stripe webhook
6. Deploy!

---

## 📦 Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Next.js | 15.1 | Framework (App Router) |
| React | 19 | UI |
| TypeScript | 5.7 | Type safety |
| MongoDB + Mongoose | 8.9 | Database + ORM |
| NextAuth | v5 beta | Authentication |
| Vercel Blob | 0.27 | Image storage |
| Stripe | 17.4 | Payments |
| Zustand | 5 | Cart state |
| Tailwind CSS | 3.4 | Styling |
| Framer Motion | 11 | Animations |
| react-dropzone | 14 | Image upload UI |
| Zod | 3.24 | Validation |
| Sonner | 1.7 | Toast notifications |
| Lucide React | 0.468 | Icons |
