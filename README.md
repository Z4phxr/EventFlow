# EventFlow

Event management system with microservices architecture, RabbitMQ event-driven communication, and React frontend. Organizers create events, attendees register, and services communicate asynchronously for notifications.

## Architecture

**Microservices:**
- User Service (8081) - Authentication, user management, JWT tokens
- Event Service (8082) - Event CRUD, RabbitMQ event publishing
- Notification Service (8083) - RabbitMQ consumer, notification persistence
- API Gateway (8080) - Request routing, JWT validation, unified API

**Infrastructure:**
- RabbitMQ (5672 AMQP, 15672 Management UI) - Asynchronous messaging
- PostgreSQL - 3 separate databases (ports 5432, 5433, 5434)
- React Frontend (5173) - Modern UI with Tailwind CSS

**Flow:**
```
Client → API Gateway → Service
Event Service → RabbitMQ → Notification Service
```

## Technology Stack

**Backend:** Java 17, Spring Boot 3, Spring Cloud Gateway, Spring Data JPA, Spring AMQP, Flyway, JWT, Jasypt

**Frontend:** React 18.2, Vite, React Router v6, Axios, Tailwind CSS

**Infrastructure:** PostgreSQL 15-alpine, RabbitMQ 3.13-management-alpine, Docker Compose

## Quick Start

### Docker Compose (Recommended)

```bash
docker compose -f docker/docker-compose-microservices.yml up -d --build
```

**Access:**
- Frontend: http://localhost:5173
- API Gateway: http://localhost:8080/api
- User Service Swagger: http://localhost:8081/swagger-ui.html
- Event Service Swagger: http://localhost:8082/swagger-ui.html
- Notification Service Swagger: http://localhost:8083/swagger-ui.html
- RabbitMQ Management: http://localhost:15672 (eventflow/eventflow123)

**Stop:**
```bash
docker compose -f docker/docker-compose-microservices.yml down
```

### Local Development

Run each service in a separate terminal:

```bash
# User Service
cd services/user-service
mvn spring-boot:run

# Event Service
cd services/event-service
mvn spring-boot:run

# Notification Service
cd services/notification-service
mvn spring-boot:run

# API Gateway
cd gateway
mvn spring-boot:run

# Frontend
cd frontend
npm install
npm run dev
```

**Note:** Local development requires 3 PostgreSQL databases and RabbitMQ running.

## API Endpoints

**Authentication (via Gateway):**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

**Events (via Gateway):**
- `GET /api/events` - List all events
- `POST /api/events` - Create event (ORGANIZER)
- `GET /api/events/{id}` - Get event details
- `PUT /api/events/{id}` - Update event (ORGANIZER)
- `DELETE /api/events/{id}` - Delete event (ORGANIZER)

**Registrations (via Gateway):**
- `POST /api/events/{id}/register` - Register for event
- `GET /api/events/my-events` - Get user's registered events
- `DELETE /api/events/{id}/registrations/{registrationId}` - Cancel registration

**Notifications (via Gateway):**
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/{id}/read` - Mark notification as read

**Direct Service Access:**
- User Service: http://localhost:8081/swagger-ui.html
- Event Service: http://localhost:8082/swagger-ui.html
- Notification Service: http://localhost:8083/swagger-ui.html

## Testing RabbitMQ Integration

### Quick Demo Script

```powershell
.\demo-rabbitmq.ps1
```

This script demonstrates:
1. Register organizer and create event
2. Verify EVENT_CREATED notification generated
3. Register attendee to event
4. Verify REGISTRATION_CONFIRMED notification generated

### Manual Verification

1. **RabbitMQ Management UI:**
   - URL: http://localhost:15672
   - Username: `eventflow`, Password: `eventflow123`
   - Check Exchanges: `eventflow.exchange`
   - Check Queues: `notification.queue`

2. **Service Logs:**
   ```bash
   # Event service (publisher)
   docker compose -f docker/docker-compose-microservices.yml logs --follow event-service
   
   # Notification service (consumer)
   docker compose -f docker/docker-compose-microservices.yml logs --follow notification-service
   ```

3. **Expected Output:**
   - event-service: "Published event EVENT_CREATED with routing key event.created"
   - notification-service: "Received message from RabbitMQ" → "Saved notification"

## Environment Variables

See `.env.example` for configuration template. Key variables:

- `DB_URL` - PostgreSQL connection URL (per service)
- `DB_USER` - Database username
- `DB_PASS` - Database password
- `JWT_SECRET` - JWT signing key (must be same across all services)
- `ENCRYPTION_KEY` - 16-character AES encryption key (user-service)
- `RABBITMQ_HOST` - RabbitMQ hostname
- `RABBITMQ_USER` - RabbitMQ username
- `RABBITMQ_PASS` - RabbitMQ password

## Project Structure

```
eventflow/
├── services/
│   ├── user-service/          # Authentication & user management
│   ├── event-service/         # Events, registrations, RabbitMQ publisher
│   └── notification-service/  # RabbitMQ consumer, notifications
├── gateway/                   # Spring Cloud Gateway
├── frontend/                  # React application
└── docker/
    ├── docker-compose-microservices.yml  # Full stack
    └── docker-compose.yml                # Legacy monolith
```

## Development

**Build All Services:**
```powershell
.\build-all-services.ps1
```

**Verify Microservices:**
```powershell
.\verify-microservices.ps1
```

**Database Migrations:**
- Managed by Flyway in each service
- Migrations run automatically on startup
- Located in `src/main/resources/db/migration/`

## Features

- JWT-based authentication with role-based access control (USER, ORGANIZER, ADMIN)
- Event CRUD operations with capacity management
- Asynchronous notification system via RabbitMQ
- Email encryption (AES-256) for GDPR compliance
- External API integration (OpenStreetMap, Open-Meteo)
- OpenAPI 3.0 documentation per service
- Modern React UI with Tailwind CSS

## Documentation

- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [RABBITMQ_IMPLEMENTATION_SUMMARY.md](RABBITMQ_IMPLEMENTATION_SUMMARY.md) - RabbitMQ architecture
- [RABBITMQ_VERIFICATION.md](RABBITMQ_VERIFICATION.md) - Testing guide
- [WEEK3_SUMMARY.md](WEEK3_SUMMARY.md) - Development log

## License

This project was developed for academic purposes.
