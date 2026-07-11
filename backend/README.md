# Celestials Backend — Spring Boot API

RESTful API for Celestials e-commerce platform built with Spring Boot 3.1, JPA/Hibernate, and PostgreSQL.

## Tech Stack

- **Framework**: Spring Boot 3.1.4
- **Language**: Java 17
- **Database**: PostgreSQL 15 with Flyway migrations
- **Security**: Spring Security + JWT
- **Payment**: NETOPIA hosted card flow
- **API Docs**: Springdoc OpenAPI (Swagger UI)
- **Build Tool**: Maven 3.9.4
- **ORM**: Hibernate/JPA

## Quick Start

### Docker (Recommended)
```bash
cd ..  # Go to project root
docker-compose up --build
```

### Local Development
```bash
./mvnw clean package -DskipTests
./mvnw spring-boot:run
```

Server runs at: `http://localhost:8080`
API Docs: `http://localhost:8080/swagger-ui.html`

## Key Features

✅ JWT-based authentication
✅ Role-based access control (ROLE_CUSTOMER, ROLE_ADMIN)
✅ Product CRUD with admin protection
✅ Shopping cart & order management
✅ NETOPIA payment integration
✅ Flyway database migrations
✅ OpenAPI/Swagger documentation
✅ PostgreSQL with JPA/Hibernate
✅ Error handling & validation

## API Endpoints

### Public
- `GET /api/products` - List products
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login

### Authenticated
- `POST /api/orders` - Create order
- `GET /api/orders` - View orders
- `POST /api/payments/netopia/start` - Prepare NETOPIA checkout
- `POST /api/payments/netopia/confirm` - NETOPIA confirm callback
- `POST /api/payments/netopia/notify` - NETOPIA notify callback

### Admin Only
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/{id}` - Update product
- `DELETE /api/admin/products/{id}` - Delete product

## Configuration

### Environment Variables
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/celestials_db
SPRING_DATASOURCE_USERNAME=celestials
SPRING_DATASOURCE_PASSWORD=celestials
NETOPIA_SIGNATURE=your_signature
NETOPIA_PUBLIC_CERT_PATH=/app/config/netopia/public.cer
JWT_SECRET=min-32-chars-secret
SPRING_PROFILES_ACTIVE=dev
```

### Profiles
- `dev` - Development with auto seed data
- `prod` - Production configuration

## Database

Flyway migrations in `src/main/resources/db/migration/`:
- `V1__init.sql` - Schema
- `V2__seed_products.sql` - Sample data

Default admin: `admin` / `admin`

## Testing

```bash
./mvnw test
```

## Build & Deploy

```bash
./mvnw clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

## Troubleshooting

**Port 8080 in use:**
```bash
lsof -i :8080
kill -9 <PID>
```

**DB connection failed:**
Check SPRING_DATASOURCE_* vars and PostgreSQL is running.

**Payments not starting:**
Verify NETOPIA_SIGNATURE and NETOPIA_PUBLIC_CERT_PATH are set correctly.

---

See main README.md for full documentation.
