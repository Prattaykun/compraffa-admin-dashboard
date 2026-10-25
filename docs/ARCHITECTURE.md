# Architecture & code walkthrough

A guided tour of how Aurora Admin fits together, written so you can explain every part
of the implementation in your own words.

## Big picture

This is a **single Next.js application**: the React frontend and the JSON API live in the
same codebase and the same server process. The frontend calls the API with `fetch`, and
the API talks to a SQLite database through Prisma.

```
Browser (React pages, client components)
    |  fetch("/api/...") with session cookie
    v
Next.js route handlers (src/app/api/**)  -- zod validation, session check
    |  Prisma Client
    v
SQLite database (prisma/dev.db)
```

## The data model (prisma/schema.prisma)

Five models:

- **User** – dashboard accounts. Stores `passwordHash` (never the plain password).
- **Product** – catalog items with SKU, category, price, stock and a lifecycle status
  (`active` / `draft` / `archived`).
- **Customer** – people who placed orders.
- **Order** – has a human-friendly `orderNumber`, a workflow status
  (`pending → paid → shipped → delivered`, or `cancelled`), a cached `total`, and a
  required link to its Customer.
- **OrderItem** – join rows between Order and Product with `quantity` and the
  `unitPrice` at purchase time, so past orders don't change when a product price changes.

`prisma/seed.ts` wipes and recreates deterministic demo data (a seeded PRNG means the
same products/orders every time) plus a demo admin account.

## Authentication, end to end (src/lib/auth.ts)

1. **Signup** (`POST /api/auth/signup`): the body is parsed with
   `signupSchema` (zod). Duplicate emails are rejected with 409. The password is hashed
   with **bcrypt, cost 12** (`hashPassword`) and only the hash is stored.
2. **Session**: on signup or login, `setSessionCookie` signs a JWT containing the user
   id with **jose** (HS256, 7-day expiry) and stores it in an `httpOnly`,
   `sameSite=lax` cookie. `httpOnly` means JavaScript can't read it, which blocks XSS
   token theft; the browser sends it automatically on every request.
3. **Login** (`POST /api/auth/login`): looks the user up by email and calls
   `bcrypt.compare`. Wrong email and wrong password return the **same** generic 401
   message so the endpoint can't be used to enumerate accounts.
4. **Guards**: `getSessionUser()` reads + verifies the cookie and loads the user. It is
   called in two places, so protection doesn't depend on any single layer:
   - `src/app/dashboard/layout.tsx` (server component) redirects anonymous visitors to
     `/login` before any dashboard HTML is rendered;
   - every API route returns **401** when there is no valid session.
5. **Logout** clears the cookie.
6. **Password change** re-verifies the current password before storing the new hash.

Why JWT-in-cookie instead of a database session table? Stateless verification (no DB
lookup to validate the token), which is simple and fast for this scope; the trade-off
(no server-side revocation list) is acceptable for a demo and is a good talking point.

## Input validation (src/lib/validators.ts)

All request bodies go through zod schemas shared by client and server: signup, login,
product create/update (SKU format, positive price, non-negative integer stock, status
enum), order status, profile and password change. The API never trusts the client:
even though forms have `required`/`minLength` attributes, the same rules run again on
the server.

## The API layer (src/app/api/**)

Next.js **route handlers** (`route.ts` files) replace a separate Express app:

- `GET/POST /api/products`, `PATCH/DELETE /api/products/[id]` – list with debounced
  search + pagination (8 per page), create with duplicate-SKU guard (409), update with
  partial schema, delete blocked when the product appears in orders (the UI suggests
  archiving instead).
- `GET /api/orders`, `GET/PATCH /api/orders/[id]` – list with search + status filter +
  pagination; detail includes line items with product names; status updates are
  validated against the workflow enum.
- `GET /api/customers` – customers with computed `ordersCount` and `totalSpent`
  (cancelled orders excluded).
- `GET /api/stats` – everything the overview page needs in one round trip.
- `/api/auth/*` and `/api/settings/profile` as described above.

## Stats & charts (src/lib/stats.ts)

Aggregation logic is **pure functions** (no database, no framework) so it can be unit
tested: `totalRevenue` (excludes cancelled orders), `countByStatus`,
`dailyRevenueSeries` (builds a contiguous 14-day UTC series with zero-filled gaps),
`percentChange` (period-over-period deltas, `null` when the previous period was 0).
`/api/stats` only queries Prisma and delegates the math. The chart is Recharts wrapped
in the shadcn/ui `ChartContainer` for theming.

## Frontend composition

- `src/app/(auth)/` – login & signup share a layout with the animated gradient
  backdrop; `auth-form.tsx` is one client component parameterised by mode.
- `src/app/dashboard/layout.tsx` – server-side session guard + sidebar shell
  (`SidebarProvider`, `AppSidebar`, collapsible on mobile).
- Pages are client components that fetch their API, with skeleton placeholders while
  the displayed data doesn't match the current query (a keyed-result pattern instead
  of `setState` inside effects).
- UI primitives in `src/components/ui/` come from the **shadcn/ui** registry (Base UI
  style); application components (sidebar, stat cards, tables, dialogs, chart) are
  composed from them in `src/components/`.
- Dark/light theming uses `next-themes` with CSS variables, so every component
  inherits both themes automatically.

## Testing (tests/)

Vitest unit tests cover the pieces where a bug would hurt most: password hashing and
verification, JWT round-trip + tamper rejection, zod schema edge cases, and the stats
math (including timezone-safe date bucketing). Run with `npm test`.

## Scripts

`npm run dev` (develop) · `npm run build && npm start` (production) ·
`npm run db:setup` (migrate + seed) · `npm test` · `npm run lint`
