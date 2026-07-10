# Celestials Frontend — React + Vite

Modern SPA for Celestials e-commerce built with React 18, TypeScript, Vite, and Stripe integration.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript 5
- **Build Tool**: Vite 5 (lightning fast)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Payments**: Stripe Elements
- **Testing**: Vitest + React Testing Library
- **Styling**: CSS3 (mobile-first responsive)

## Quick Start

### Docker (Recommended)
```bash
cd ..  # Go to project root
docker-compose up --build
```

### Local Development
```bash
npm install
npm run dev
```

Access at: `http://localhost:3000`

## Features

### Customer Features
✅ User authentication (login/register)
✅ Browse & search products
✅ Shopping cart (localStorage)
✅ Stripe payment checkout
✅ Order history
✅ Mobile responsive UI

### Admin Features
✅ Product management (CRUD)
✅ Admin dashboard
✅ Role-based access

## Project Structure

```
src/
├── components/
│   ├── Navbar.tsx           # Navigation bar
│   └── Navbar.css
├── pages/
│   ├── Home.tsx            # Landing page
│   ├── Products.tsx        # Product catalog
│   ├── Cart.tsx            # Shopping cart
│   ├── Checkout.tsx        # Payment page
│   ├── OrderHistory.tsx    # Orders
│   ├── AdminDashboard.tsx  # Admin panel
│   ├── Login.tsx           # Auth
│   └── [page].css          # Styles
├── services/
│   └── api.ts              # API client
├── App.tsx                 # Root component + routing
├── main.tsx                # React entry point
└── App.css                 # Global styles
```

## Pages

| Page | Route | Public? | Auth Required? |
|------|-------|---------|----------------|
| Home | `/` | ✅ | ❌ |
| Products | `/products` | ✅ | ❌ |
| Login/Register | `/login` | ✅ | ❌ |
| Cart | `/cart` | ✅ | ✅ |
| Checkout | `/checkout` | ✅ | ✅ |
| Orders | `/orders` | ✅ | ✅ |
| Admin | `/admin` | ❌ | ✅ (admin only) |

## API Integration

### API Client (`services/api.ts`)
```typescript
import { authAPI, productAPI, orderAPI, stripeAPI } from './services/api'

// Examples:
await authAPI.login('admin', 'admin')          // Returns { token }
await productAPI.getAll()                      // Returns products[]
await orderAPI.create([{productId, quantity}]) // Create order
await stripeAPI.createPaymentIntent(9999)      // Stripe intent
```

### Environment
```env
VITE_API_URL=http://localhost:8080
```

## Authentication Flow

1. User registers/logs in at `/login`
2. Backend returns JWT token
3. Token stored in localStorage
4. Axios interceptor adds `Authorization: Bearer <token>` to requests
5. Protected pages check for token

## Styling

- **Colors**: Purple gradient (#667eea → #764ba2)
- **Responsive**: Mobile-first with @media queries
- **Hover Effects**: Smooth transitions
- **Accessibility**: Semantic HTML, ARIA labels

## Development

### Dev Server
```bash
npm run dev
```

### Build Production
```bash
npm run build
# Output: dist/
```

### Tests
```bash
npm test
```

## Configuration

### Vite Config (`vite.config.ts`)
- React plugin enabled
- Port 3000 for dev
- Auto-refresh on file changes

### TypeScript (`tsconfig.json`)
- Target: ES2020
- JSX: react-jsx
- Strict mode enabled

## Components

### Navbar
- Sticky header with logo
- Navigation links
- Login/Logout
- Admin link (if admin)

### ProductCard
- Image, name, price
- Add to cart button
- Out of stock handling

### CartTable
- Product list
- Quantity input
- Remove button
- Subtotal

### CheckoutForm
- Stripe card element
- Order summary
- Test card info

### AdminForm
- Product CRUD
- Edit/delete buttons
- Form validation

## Payment Integration

### Stripe Setup
1. Get test keys from https://stripe.com
2. Add to `.env`: `STRIPE_SECRET_KEY=sk_test_xxx`
3. Frontend uses Stripe JS library (CDN loaded in Checkout.tsx)

### Test Payment
- Card: `4242 4242 4242 4242`
- Expiry: Any future (12/26)
- CVC: Any 3 digits (123)

## Storage

**localStorage keys:**
- `token` - JWT access token
- `username` - Current user
- `role` - User role (for admin check)
- `cart` - Shopping cart (array of items)

## Error Handling

- API errors → Alert to user
- Network errors → Logged to console
- Form validation → Inline error messages
- 403 Forbidden → Redirect to login

## Mobile Responsive

- **Breakpoint**: 768px
- **Mobile**: 1 column
- **Desktop**: Multiple columns (grid)
- **Tables**: Reduced font on mobile
- **Forms**: Full width on mobile

## Performance

- Vite for fast builds (< 1 second)
- React lazy loading for routes
- Image optimization (lazy load)
- Minimal dependencies (axios, react-router)
- Prod build size: ~150KB (gzipped)

## Troubleshooting

### Blank page
1. Check browser console for errors
2. Verify VITE_API_URL points to backend
3. Check backend is running (`curl http://localhost:8080/health`)
4. Clear cache: Ctrl+Shift+Del

### CORS errors
- Backend SecurityConfig must allow frontend origin
- Check `/api/auth/**` is public
- Verify CORS headers in Spring

### Payment fails
- Use correct test card
- Check Stripe keys in backend .env
- Verify payment intent creation endpoint works

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Deployment

### Build for Production
```bash
npm run build
```

### Docker Build
```bash
docker build -t celestials-frontend .
docker run -p 3000:3000 celestials-frontend
```

### Environment for Production
```env
VITE_API_URL=https://api.example.com
```

---

**Frontend ready to ship! 🚀**
