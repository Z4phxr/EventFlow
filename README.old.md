# EventFlow - Event Management System

A REST-based event management system built with Java Spring Boot microservices and React. EventFlow enables users to browse and register for events, allows organizers to create and manage events, and provides administrators with system oversight capabilities. The system integrates external APIs for geocoding and weather forecasting, implements JWT-based authentication, and uses PostgreSQL for persistent data storage.

## Architecture

**Grade 4.0 (Monolith):** Single Spring Boot application with all modules  
**Grade 5.0 (Microservices):** Distributed architecture with:
- **user-service** (Port 8081) - Authentication & user management
- **event-service** (Port 8082) - Events, registrations & external APIs
- **notification-service** (Port 8083) - Notifications (stub for Part 2)
- **api-gateway** (Port 8080) - Single entry point with routing
- **3 PostgreSQL databases** - One per service

## Technology Stack

- Java 17
- Spring Boot 3 & Spring Cloud Gateway
- Spring Security with JWT authentication
- PostgreSQL (3 databases for microservices)
- Flyway (database migrations)
- Spring Data JPA / Hibernate
- External APIs: OpenStreetMap Nominatim (geocoding), Open-Meteo (weather)
- React with Vite (frontend)
- Docker & Docker Compose

## Main Features

- User registration and authentication with JWT tokens
- Role-based access control (USER, ORGANIZER, ADMIN)
- Full CRUD operations for event management
- Event registration system with capacity enforcement
- External API integration for location geocoding and weather forecasts
- REST API with proper HTTP semantics and status codes
- API documentation with OpenAPI/Swagger UI per service
- Microservices architecture with API Gateway

## How to Run the Project

### Prerequisites

- Java 17 or higher
- Maven 3.8 or higher
- Node.js 18 or higher (for local frontend development)
- Docker Desktop (recommended for microservices)

### Option 1: Microservices Mode (Grade 5.0) - Recommended

This runs the full microservices architecture with API Gateway.

```bash
# Navigate to docker directory
cd docker

# Start all microservices (3 databases, 3 services, gateway, frontend)
docker compose -f docker-compose-microservices.yml up -d --build

# Check logs for a specific service
docker compose -f docker-compose-microservices.yml logs --follow user-service
docker compose -f docker-compose-microservices.yml logs --follow event-service
docker compose -f docker-compose-microservices.yml logs --follow api-gateway

# Stop all services
docker compose -f docker-compose-microservices.yml down
```

**Access Points:**
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8080
- **User Service Swagger**: http://localhost:8081/swagger-ui.html
- **Event Service Swagger**: http://localhost:8082/swagger-ui.html
- **Notification Service Swagger**: http://localhost:8083/swagger-ui.html

**Service Ports:**
- API Gateway: 8080 (main entry point)
- User Service: 8081
- Event Service: 8082
- Notification Service: 8083
- PostgreSQL User DB: 5432
- PostgreSQL Event DB: 5433
- PostgreSQL Notification DB: 5434
- RabbitMQ AMQP: 5672
- RabbitMQ Management: 15672

### Option 2: Monolith Mode (Grade 4.0)

Run the original monolithic backend.

```bash
cd docker
docker compose up -d --build
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

### Option 3: Local Development (Individual Services)

Run services locally without Docker for development.

**Terminal 1 - User Service:**
```bash
cd services/user-service
mvn clean install -DskipTests
mvn spring-boot:run
```

**Terminal 2 - Event Service:**
```bash
cd services/event-service
mvn clean install -DskipTests
mvn spring-boot:run
```

**Terminal 3 - Notification Service:**
```bash
cd services/notification-service
mvn clean install -DskipTests
mvn spring-boot:run
```

**Terminal 4 - API Gateway:**
```bash
cd gateway
mvn clean install -DskipTests
mvn spring-boot:run
```

**Terminal 5 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Note**: You need to have 3 PostgreSQL databases running locally or update `application.yml` in each service to use H2.

### Environment Variables

For production deployment, configure the following environment variables:

- `DB_URL` - PostgreSQL connection URL (per service)
- `DB_USER` - Database username
- `DB_PASS` - Database password
- `JWT_SECRET` - Secret key for JWT signing (must be same across all services)
- `ENCRYPTION_KEY` - 16-character key for AES encryption (user-service only)

Default values in `application.yml` are for development only.

## Testing the Microservices Architecture

### 1. Verify All Services Are Running

```bash
# Check service health
curl http://localhost:8080/actuator/health  # API Gateway
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Event Service
curl http://localhost:8083/actuator/health  # Notification Service
```

### 2. Test Authentication Flow Through Gateway

**Register a new user:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "ORGANIZER"
  }'
```

**Login to get JWT token:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response.

### 3. Test Event Creation Through Gateway

```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Spring Conference 2024",
    "description": "Annual Spring Framework conference",
    "startDate": "2024-06-15T09:00:00",
    "endDate": "2024-06-15T17:00:00",
    "location": "Warsaw, Poland",
    "maxAttendees": 100
  }'
```

### 4. Verify Cross-Service Routing

- Authentication requests → routed to user-service (8081)
- Event requests → routed to event-servi

## Testing RabbitMQ Integration

### Run Automated Demo

```powershell
.\demo-rabbitmq.ps1
```

This script demonstrates the complete event-driven flow:
1. Register organizer and create event
2. Verify EVENT_CREATED notification is generated automatically
3. Register attendee to event
4. Verify REGISTRATION_CONFIRMED notification is generated

### Manual RabbitMQ Verification

1. **Access RabbitMQ Management UI:**
   - URL: http://localhost:15672
   - Username: `eventflow`
   - Password: `eventflow123`

2. **Verify Exchange and Queue:**
   - Navigate to "Exchanges" → see `eventflow.exchange`
   - Navigate to "Queues" → see `notification.queue` with 5 bindings

3. **Check Service Logs:**
   ```powershell
   # Event service (publisher)
   docker compose -f docker/docker-compose-microservices.yml logs --follow event-service
   
   # Notification service (consumer)
   docker compose -f docker/docker-compose-microservices.yml logs --follow notification-service
   ```

4. **Expected Log Output:**
   - event-service: "Published event EVENT_CREATED with routing key event.created"
   - notification-service: "Received message from RabbitMQ" → "Saved notification"

For detailed verification steps, see [RABBITMQ_VERIFICATION.md](RABBITMQ_VERIFICATION.md)ce (8082)
- Notification requests → routed to notification-service (8083)
- All requests go through gateway (8080)

## API Documentation

**Microservices Mode:**
- API Gateway: http://localhost:8080 (routes to all services)
- User Service: http://localhost:8081/swagger-ui.html
- Event Service: http://localhost:8082/swagger-ui.html
- Notification Service: http://localhost:8083/swagger-ui.html

**Monolith Mode:**
- Backend API: http://localhost:8080/swagger-ui.html

All requests from the frontend go through the API Gateway which routes them to the appropriate service.

## Microservices Architecture Details

### Service Responsibilities

**user-service:**
- User registration and authentication
- JWT token generation
- User management and roles
- Database: `users` table

**event-service:**
- Events CRUD operations
- Event registrations with capacity rules
- External API integration (geocoding, weather)
- Database: `events`, `registrations` tables

**notification-service:**
- Notification storage and retrieval
- Consumes domain events from RabbitMQ
- Creates notifications asynchronously
- Database: `notifications` table

**rabbitmq:**
- Message broker for async communication
- Exchange: `eventflow.exchange` (topic)
- Queue: `notification.queue`
- Handles event routing between services

**api-gateway:**
- Single entry point for all API requests
- Routes requests to appropriate services:
  - `/api/auth/**` → user-service
  - `/api/users/**` →           # Publishes to RabbitMQ
│   └── notification-service/   # Consumes from RabbitMQ
├── gateway/                    # API Gateway
├── frontend/                   # React application
├── docker/
│   ├── docker-compose.yml                    # Grade 4.0
│   └── docker-compose-microservices.yml      # Grade 5.0 + RabbitMQ
├── demo-rabbitmq.ps1           # Automated RabbitMQ demo
└── RABBITMQ_VERIFICATION.md    # Detailed verification guide

- **Frontend → API Gateway** - All requests go through gateway (HTTP/REST)
- **API Gateway → Services** - HTTP routing based on path
- **Services validate JWT independently** - Shared JWT secret
- **event-service → RabbitMQ** - Publishes domain events asynchronously
- **RabbitMQ → notification-service** - Delivers events for notification creation
- **No synchronous inter-service calls** - Services are loosely coupled via message broker
5672, 15672, and 5173 are available
3. Try rebuilding: `docker compose -f docker/docker-compose-microservices.yml up -d --build --force-recreate`

### RabbitMQ Connection Issues

- Check RabbitMQ health: `docker compose -f docker/docker-compose-microservices.yml ps rabbitmq`
- Wait for RabbitMQ to be ready (~10 seconds after container starts)
- Restart services: `docker compose -f docker/docker-compose-microservices.yml restart event-service notification-service`
- Check RabbitMQ logs: `docker compose -f docker/docker-compose-microservices.yml logs rabbitmq

**Published Events (event-service):**
- `event.created` - When new event is created
- `event.updated` - When event details are updated
- `event.deleted` - When event is deleted
- `registration.created` - When user registers to event
- `registration.deleted` - When user unregisters from event

**Consumed Events (notification-service):**
- Listens to all event types on `notification.queue`
- Creates user notifications automatically
- Ensures idempotency using `externalMessageId`

**RabbitMQ Configuration:**
- Exchange: `eventflow.exchange` (Topic Exchange)
- Queue: `notification.queue` (durable)
- Routing: Topic patterns match routing keys
- Management UI: http://localhost:15672 (eventflow/eventflow123)

### Directory Structure

```
EventFlow/
├── backend/                    # Grade 4.0 monolith
├── services/                   # Grade 5.0 microservices
│   ├── user-service/
│   ├── event-service/
│   └── notification-service/
├── gateway/                    # API Gateway
├── frontend/                   # React application
└── docker/
    ├── docker-compose.yml                    # Grade 4.0
    └── docker-compose-microservices.yml      # Grade 5.0
```

## Troubleshooting

### Services Not Starting

1. Check Docker logs: `docker compose -f docker/docker-compose-microservices.yml logs`
2. Ensure ports 8080-8083, 5432-5434, and 5173 are available
3. Try rebuilding: `docker compose -f docker/docker-compose-microservices.yml up -d --build --force-recreate`

### Database Connection Issues

- Wait for database healthchecks to pass (check logs)
- Services have `depends_on` with healthcheck conditions
- PostgreSQL takes ~10 seconds to initialize

### JWT Authentication Fails

- # Notifications Not Being Created

- Verify RabbitMQ is running: http://localhost:15672
- Check event-service logs for "Published event" messages
- Check notification-service logs for "Received message" and "Saved notification" messages
- Verify queue bindings in RabbitMQ Management UI
- Run demo script: `.\demo-rabbitmq.ps1`

## Project Status

**Grade 4.0:** Monolithic Spring Boot application with REST API - COMPLETED ✅  
**Grade 5.0 Part 1:** Microservices architecture with API Gateway - COMPLETED ✅  
**Grade 5.0 Part 2:** RabbitMQ integration for async domain events - COMPLETED ✅

**All Grade 5.0 requirements satisfied:**
- ✅ Microservices architecture (user, event, notification services)
- ✅ API Gateway for routing
- ✅ RabbitMQ message broker for asynchronous communication
- ✅ Event-driven architecture with domain events
- ✅ Independent databases per service
- ✅ Docker Compose orchestration
- ✅ Full CRUD REST APIs with authentication
- ✅ React frontend with JWT auth and role-based access
- ✅ Notifications page displaying async message results
- ✅ Demo dashboard with microservices visualization and live testing

## Frontend Application

The React frontend provides a clean, demo-ready interface with:

**Part 1 - Core Features**:
- JWT-based authentication with automatic token handling
- Role-based navigation (USER, ORGANIZER, ADMIN)
- Events browsing with filters (city, status)
- Event details with weather integration
- User registration/unregistration for events
- Organizer dashboard for event management (create, edit, delete)

**Part 2 - Grade 5.0 Demonstration**:
- **Notifications Page** (`/notifications`): Real-time display of notifications generated by RabbitMQ consumers
- **Demo Dashboard** (`/demo`): Interactive visualization of microservices architecture, service health monitoring, and async flow demonstration
- **Microservices Visualization**: HTML/CSS diagram showing Frontend → Gateway → Services → RabbitMQ flow
- **Live Demo Actions**: Create events and register users to prove producer-consumer async flow

**For detailed frontend documentation**:
- Core features: [frontend/FRONTEND_README.md](frontend/FRONTEND_README.md)
- Part 2 features: [frontend/PART2_IMPLEMENTATION.md](frontend/PART2_IMPLEMENTATION.md)
- Quick verification: [frontend/PART2_VERIFICATION.md](frontend/PART2_VERIFICATION.md)

Quick start:
```bash
cd frontend
npm install
npm run dev
# Access at http://localhost:5173
```

All API requests route through the gateway at `http://localhost:8080/api` (configured via `VITE_API_BASE_URL` in `.env`).

## Troubleshooting

- Verify API Gateway is running: `curl http://localhost:8080/actuator/health`
- Check browser console for CORS errors
- Frontend should use `http://localhost:8080/api` as base URL (configured via `VITE_API_BASE_URL`)
- For 401 errors, logout and login again (token may be expired)

## Project Status

**Grade 5.0 Implementation Complete**:
- ✅ Microservices architecture with API Gateway
- ✅ RabbitMQ integration for async domain events
- ✅ Frontend Part 1: Authentication, events, organizer dashboard
- ✅ Frontend Part 2: Notifications page and microservices demo dashboard

**All Grade 5.0 requirements implemented and demonstrable through UI!**

## License

This project is for academic purposes as part of Network Applications course (Grade 5.0 requirements).
