# Celestials — Jewelry E-Commerce Platform

A full-stack e-commerce application for selling jewelry with a React frontend and Spring Boot backend. Built with Docker for easy deployment.

## 🎯 Overview

Celestials is a production-ready e-commerce platform featuring:
- **Backend**: Spring Boot 3.1 REST API with JWT authentication
- **Frontend**: React 18 + Vite with TypeScript
- **Database**: PostgreSQL with Flyway migrations
- **Payments**: Stripe integration for secure transactions
- **Deployment**: Docker + docker-compose

## 📁 Project Structure

```
celestials/
├── backend/                 # Spring Boot REST API
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration & migrations
│   ├── pom.xml            # Maven dependencies
│   ├── Dockerfile         # Multi-stage build
│   └── README.md
├── frontend/              # React + Vite SPA
│   ├── src/              # React components & pages
│   ├── public/           # Static assets
│   ├── package.json      # NPM dependencies
│   ├── vite.config.ts    # Vite configuration
│   ├── Dockerfile        # Node production build
│   └── README.md
├── docker-compose.yml    # All services orchestration
├── .env.example          # Environment template
├── .github/workflows/    # CI/CD pipeline
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (v20+)
- Stripe test account (https://stripe.com)

### Step 1: Setup Environment

```bash
cd celestials
cp .env.example .env
```

Edit `.env` and add your Stripe test keys:
```env
STRIPE_SECRET_KEY=sk_test_your_test_key
VITE_STRIPE_PK=pk_test_your_publishable_key
```

### Step 2: Start Services

```bash
docker-compose up --build
```

The build may take 2-3 minutes on first run (Maven compiling, npm installing).

### Step 3: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger-ui.html
- **Database**: localhost:5432 (PostgreSQL)

### Step 4: Login

Use default credentials:
```
Username: admin
Password: admin
```

Or register a new customer account.

## ✨ Features

### Customer Features
- ✅ User registration & JWT authentication
- ✅ Browse products with descriptions & images
- ✅ Search and filter products
- ✅ Shopping cart with local storage
- ✅ Secure Stripe payment checkout
- ✅ Order history & status tracking
- ✅ Mobile-responsive design

### Admin Features
- ✅ Role-based access control (ROLE_ADMIN)
- ✅ Product CRUD (Create, Read, Update, Delete)
- ✅ Product category CRUD (dynamic storefront menu)
- ✅ Inventory management
- ✅ Order management & status updates
- ✅ User management

### Technical Features
- ✅ JWT token-based authentication
- ✅ Spring Security with method-level authorization
- ✅ PostgreSQL with Flyway versioned migrations
- ✅ Stripe Payments API integration
- ✅ REST API with OpenAPI/Swagger documentation
- ✅ Error handling & validation
- ✅ CORS configuration
- ✅ Environment-based configuration
- ✅ Dev data seeding (sample products & admin user)

## 🧪 Testing

### Backend Tests
```bash
cd backend
./mvnw test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing

**Create Order:**
1. Login or register
2. Browse products (Shop page)
3. Add items to cart
4. Proceed to checkout

**Test Payment:**
Use Stripe test card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/26)
- CVC: Any 3 digits (e.g., 123)

**Admin CRUD:**
1. Login as admin
2. Go to Admin Dashboard
3. Create, edit, or delete products

## 📚 API Documentation

Full API docs available at: `http://localhost:8080/swagger-ui.html`

### Key Endpoints

**Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT)

**Products (Public)**
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get product by ID
- `GET /api/products?type={slug}` - Filter by category type
- `GET /api/products?section=promotii|handmade|popular&limit=8` - Curated sections
- `GET /api/products/new-arrivals?perType=3` - New arrivals per category
- `GET /api/product-types` - List category types for storefront menu

**Products (Admin)**
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/{id}` - Update product
- `DELETE /api/admin/products/{id}` - Delete product
- `GET/POST/PUT/DELETE /api/admin/product-types` - Manage product categories

**Orders (Authenticated)**
- `GET /api/orders` - List user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/{id}` - Get order details
- `PUT /api/orders/{id}/status` - Update order status

**Payments**
- `POST /api/stripe/create-payment-intent` - Create payment intent
- `POST /api/stripe/webhook` - Stripe webhook handler

### Stripe flow (secured)
- Backend calculates payment amount from DB products (not from client input)
- Authenticated checkout creates `PENDING_PAYMENT` order linked to Stripe `payment_intent_id`
- Webhook signature is verified with `STRIPE_WEBHOOK_SECRET`
- Order transitions:
  - `payment_intent.succeeded` -> `PAID` (and stock is decremented)
  - `payment_intent.payment_failed` -> `PAYMENT_FAILED`
  - `payment_intent.canceled` -> `CANCELLED`

## 🔧 Development

### Backend Development
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Access
```bash
# Connect with psql
psql -h localhost -U celestials -d celestials_db
```

## 📦 Environment Variables

Create `.env` file (see `.env.example`):

```env
# Database
POSTGRES_DB=celestials_db
POSTGRES_USER=celestials
POSTGRES_PASSWORD=celestials

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# JWT
JWT_SECRET=your-secret-min-32-chars

# Frontend
VITE_API_URL=http://localhost:8080
VITE_STRIPE_PK=pk_test_xxx

# Active profile
SPRING_PROFILES_ACTIVE=dev
```

## 🔐 Security

- JWT tokens for stateless authentication
- BCrypt password hashing
- CORS enabled for frontend origin
- HTTPS-ready (configure in production)
- Input validation on all endpoints
- SQL injection prevention (JPA parameterized queries)
- XSS protection (React auto-escapes)

## 🚢 Production Deployment

### Hostinger VPS Recommendation

For this stack (Spring Boot + PostgreSQL + React + reverse proxy + SSL), choose at least:

- **Recommended**: Hostinger VPS with **4 vCPU / 8 GB RAM** (smooth production baseline)
- **Minimum for low traffic**: **2 vCPU / 4 GB RAM**
- **Disk**: at least **80 GB NVMe** (images + DB growth + backups)

This gives enough headroom for Docker, PostgreSQL, Java heap, and TLS termination.

### Production stack included in this repo

- `docker-compose.prod.yml` (db + backend + frontend + Caddy reverse proxy)
- `infra/caddy/Caddyfile` (automatic Let's Encrypt HTTPS + security headers)
- `.env.production.example` (required production environment variables)

### 1. Prepare server
```bash
# On your VPS
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
```

### 2. Configure production environment
```bash
cp .env.production.example .env.production
```

Edit `.env.production` and set:
- `DOMAIN`
- `LETSENCRYPT_EMAIL`
- strong `POSTGRES_PASSWORD`
- strong `JWT_SECRET` (32+ chars)
- live Stripe keys

### 3. Start production services (HTTPS enabled)
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

### 4. Database Backup
```bash
# Backup
docker exec celestials-db-1 pg_dump -U celestials celestials_db > backup.sql

# Restore
docker exec -i celestials-db-1 psql -U celestials celestials_db < backup.sql
```

### 5. Notes
- Open firewall ports: **80** and **443** only
- Do not expose PostgreSQL port publicly
- Caddy obtains and renews TLS certificates automatically

## 🐛 Troubleshooting

### Container Issues

**Containers won't start:**
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

**Permission denied:**
```bash
# On macOS/Linux
sudo chown -R $USER:$USER .
```

### Database Issues

**Can't connect to database:**
1. Check PostgreSQL container is running: `docker ps`
2. Verify credentials in `.env`
3. Wait 10 seconds for DB to initialize
4. Check: `docker-compose logs db`

**Reset database:**
```bash
docker-compose down -v
docker-compose up --build
```

### Frontend Issues

**Blank page / 404:**
1. Check Frontend is running: `docker-compose logs frontend`
2. Clear browser cache: Ctrl+Shift+Del
3. Check API URL in browser console

**CORS errors:**
1. Verify VITE_API_URL in `.env`
2. Check backend SecurityConfig permits frontend URL

### Stripe Issues

**Payment fails:**
1. Verify STRIPE_SECRET_KEY is correct (starts with `sk_test_` for testing)
2. Verify frontend publishable key `VITE_STRIPE_PK` (starts with `pk_test_` for testing)
3. Check webhook endpoint: `POST /api/stripe/webhook`
4. For local webhook testing, use Stripe CLI:
   ```bash
   stripe listen --forward-to http://localhost:8080/api/stripe/webhook
   ```
   Then set `STRIPE_WEBHOOK_SECRET` to the secret shown by Stripe CLI.
5. Use valid test card: `4242 4242 4242 4242`

## 📝 Sample Data

On startup in dev profile, the app seeds:
- **Admin user**: username: `admin`, password: `admin`
- **Sample products**: Luna Necklace, Stellar Ring, Aurora Earrings

## 🔄 CI/CD Pipeline

GitHub Actions workflow in `.github/workflows/ci.yml`:
- Runs on: push and pull_request
- Steps:
  1. Checkout code
  2. Setup JDK 17 (Java)
  3. Build backend JAR
  4. Setup Node.js 18
  5. Build frontend

## 📄 License

MIT License — feel free to use for any purpose.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📞 Support

- Backend issues: See `backend/README.md`
- Frontend issues: See `frontend/README.md`
- Database issues: Check PostgreSQL logs
- Deployment issues: Review docker-compose.yml

---

**Built with ❤️ for jewelry lovers everywhere.**
