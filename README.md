# EventFlow - Event Management Platform

A modern microservices-based event management platform built with Spring Boot and React. Users can discover events, organizers can create and manage events, and everyone receives real-time notifications about event activities.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- 8GB+ RAM recommended

### Start the Application

**1. Clone the repository**
```bash
git clone <repository-url>
cd sieciowe
```

**2. Create environment file**
Create `docker/.env` file (see configuration section below)

**3. Start all services**
```bash
cd docker
docker compose -f docker-compose-microservices.yml up -d --build
```

**4. Wait for services to be ready (1-2 minutes)**
```bash
# Check container status
docker compose -f docker-compose-microservices.yml ps

# Verify all services are healthy
cd ..
.\verify-microservices.ps1
```

**5. Open the application**
- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:18080

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Organizer | organizer@example.com | password123 |
| User | user@example.com | password123 |

### Stop the Application
```bash
cd docker
docker compose -f docker-compose-microservices.yml down
```

---

## 🏗️ Architecture

EventFlow uses a microservices architecture with an API Gateway pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│                         Port 5173 (nginx)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   Port 18080    │
                    └────────┬────────┘
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │   User     │  │   Event    │  │Notification│
   │  Service   │  │  Service   │  │  Service   │
   │ Port 8081  │  │ Port 8082  │  │ Port 8083  │
   └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
         │               │               │
         ▼               ▼               ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │PostgreSQL│    │PostgreSQL│    │PostgreSQL│
   │  User DB │    │ Event DB │    │Notif. DB │
   │Port 15432│    │Port 5433 │    │Port 5434 │
   └──────────┘    └────┬─────┘    └────┬──────┘
                        │               │
                        └───────┬───────┘
                                ▼
                        ┌──────────────┐
                        │   RabbitMQ   │
                        │   Port 5672  │
                        │ Mgmt: 15672  │
                        └──────────────┘
```

### Microservices

#### 🔐 User Service (Port 8081)
- User registration and authentication
- JWT token generation and validation
- User profile management
- Role-based access control (USER, ORGANIZER, ADMIN)

#### 📅 Event Service (Port 8082)
- Event creation, update, and deletion (Organizers only)
- Event listing with search and filters
- Event registrations management
- Capacity tracking
- **Event invitations** - Invite users by email with secure token-based links
- Weather information integration (Open-Meteo API)
- Geocoding for event locations (Nominatim API)
- Publishes events to RabbitMQ for notifications

#### 🔔 Notification Service (Port 8083)
- Consumes RabbitMQ messages
- Creates in-app notifications
- **Email notifications** - Sends invitation emails via SMTP (Mailtrap)
- Notification status tracking (read/unread)
- Asynchronous email processing

#### 🌐 API Gateway (Port 18080)
- Single entry point for all client requests
- Routes requests to appropriate microservices
- JWT authentication filter
- CORS configuration
- Load balancing and service discovery

---

## 🔗 Service Endpoints

### Health Checks
Verify all services are running:

- **API Gateway:** http://localhost:18080/actuator/health
- **User Service:** http://localhost:8081/actuator/health
- **Event Service:** http://localhost:8082/actuator/health
- **Notification Service:** http://localhost:8083/actuator/health

### API Documentation (Swagger)
Interactive API documentation:

- **User Service API:** http://localhost:8081/swagger-ui/index.html
- **Event Service API:** http://localhost:8082/swagger-ui/index.html
- **Notification Service API:** http://localhost:8083/swagger-ui/index.html

### Application URLs
- **Frontend Application:** http://localhost:5173
- **RabbitMQ Management UI:** http://localhost:15672
  - Username: `eventflow`
  - Password: `eventflow123`

### Database Connections
- **User DB:** `localhost:15432/eventflow_users` (user: eventflow, password: eventflow123)
- **Event DB:** `localhost:5433/eventflow_events` (user: eventflow, password: eventflow123)
- **Notification DB:** `localhost:5434/eventflow_notifications` (user: eventflow, password: eventflow123)

---

## ⚙️ Configuration

### Environment Variables

Create `docker/.env` file with the following configuration:

```env
# SMTP Settings (required for email invitations)
# Use Mailtrap.io for development/testing
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM=noreply@eventflow.local

# Frontend URL (for email invitation links)
FRONTEND_BASE_URL=http://localhost:5173
```

**Setting up Mailtrap:**
1. Go to https://mailtrap.io/ and sign up (free tier available)
2. Create an inbox
3. Copy SMTP credentials from inbox settings
4. Paste credentials into your `.env` file

**Note:** Never commit the `.env` file to version control.

### Port Mappings

The application uses custom host ports to avoid conflicts with existing services:

| Service | Host Port | Container Port |
|---------|-----------|----------------|
| Frontend | 5173 | 80 |
| API Gateway | 18080 | 8080 |
| User Service | 8081 | 8081 |
| Event Service | 8082 | 8082 |
| Notification Service | 8083 | 8083 |
| User Database | 15432 | 5432 |
| Event Database | 5433 | 5432 |
| Notification Database | 5434 | 5432 |
| RabbitMQ | 5672 | 5672 |
| RabbitMQ Management | 15672 | 15672 |

---

## ✨ Features

### For Users
- ✅ Register and login with email/password
- ✅ Browse and search events
- ✅ View event details with location map
- ✅ Check weather forecast for event date
- ✅ Register for events (with capacity limits)
- ✅ Cancel registrations
- ✅ Receive in-app notifications
- ✅ View notification history

### For Organizers
- ✅ All user features
- ✅ Create new events
- ✅ Edit and delete own events
- ✅ **Invite users to events by email** with accept/decline links
- ✅ View event registrations list
- ✅ Track event invitation statuses (PENDING/ACCEPTED/DECLINED)
- ✅ Track event capacity
- ✅ Automatic notifications to attendees

### Technical Features
- ✅ Microservices architecture
- ✅ JWT-based authentication
- ✅ Role-based authorization
- ✅ Event-driven architecture with RabbitMQ
- ✅ RESTful API design
- ✅ Database per service pattern
- ✅ Docker containerization
- ✅ Health checks and monitoring
- ✅ API documentation with Swagger
- ✅ Responsive design

---

## � Event Invitation System

### How It Works

Organizers can invite users to their events via email. The system uses:

1. **Event Service** - Creates invitation records and publishes events to RabbitMQ
2. **RabbitMQ** - Asynchronously delivers invitation messages
3. **Notification Service** - Consumes messages and sends SMTP emails via Mailtrap
4. **Secure Tokens** - 128-character hex tokens for accept/decline links (48-hour expiration)

### Invitation Flow

```
Organizer creates invitation
         ↓
Event Service saves to DB & publishes to RabbitMQ
         ↓
Notification Service consumes message
         ↓
Email sent via SMTP (Mailtrap)
         ↓
Invitee clicks Accept/Decline link
         ↓
Status updated to ACCEPTED/DECLINED
```

### API Endpoints

**Create Invitation:**
```http
POST /api/events/{eventId}/invitations
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "friend@example.com"
}
```

**List Event Invitations:**
```http
GET /api/events/{eventId}/invitations
Authorization: Bearer {token}
```

**Accept Invitation (public):**
```http
POST /api/invitations/accept?token={secure_token}
```

**Decline Invitation (public):**
```http
POST /api/invitations/decline?token={secure_token}
```

### Email Template

Invitees receive emails containing:
- Event title, date, time, and location
- Inviter's username
- Secure accept link (expires in 48 hours)
- Secure decline link
- Event details

### Testing Invitations

1. **Start services** with SMTP configured (see Configuration section)
2. **Login as Organizer** and create an event
3. **Click "Invite by Email"** button on event card
4. **Enter email address** and send invitation
5. **Check Mailtrap inbox** at https://mailtrap.io/inboxes
6. **Click accept/decline link** in email
7. **Verify status** in Organizer Dashboard → "View Invitations"

### Database Schema

Invitations stored in `eventflow_events` database:
- `id` - UUID primary key
- `event_id` - Foreign key to events table
- `inviter_user_id` - UUID of organizer
- `invitee_email` - Email address (masked in UI for privacy)
- `token` - 128-char secure token
- `status` - PENDING, ACCEPTED, DECLINED, or EXPIRED
- `created_at` - Timestamp
- `expires_at` - Token expiration (48 hours)

---

## �🛠️ Tech Stack

### Backend
- **Java 17** - Programming language
- **Spring Boot 3.2.1** - Application framework
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Database access
- **Spring Cloud Gateway** - API Gateway
- **PostgreSQL 15** - Relational database
- **RabbitMQ** - Message broker
- **Flyway** - Database migrations
- **JWT** - Token-based authentication
- **Lombok** - Reduce boilerplate code
- **Swagger/OpenAPI** - API documentation

### Frontend
- **React 18.2** - UI framework
- **Vite 5.4** - Build tool and dev server
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Leaflet** - Interactive maps
- **React Context API** - State management

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Web server and reverse proxy

### External APIs
- **Open-Meteo** - Weather forecast data
- **Nominatim (OpenStreetMap)** - Geocoding and maps

---

## 📁 Project Structure

```
eventflow/
├── services/                              # Microservices
│   ├── user-service/                      # User & Auth microservice
│   │   ├── src/main/java/
│   │   │   └── com/eventflow/userservice/
│   │   │       ├── auth/                  # Login, registration, JWT
│   │   │       ├── user/                  # User entity and repository
│   │   │       ├── security/              # Security configuration
│   │   │       └── dto/                   # Request/response objects
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── event-service/                     # Event management
│   │   ├── src/main/java/
│   │   │   └── com/eventflow/eventservice/
│   │   │       ├── event/                 # Event CRUD operations
│   │   │       ├── registration/          # Event registrations
│   │   │       ├── invitation/            # Event invitations
│   │   │       ├── integration/           # RabbitMQ publishers
│   │   │       └── external/              # Weather & geocoding APIs
│   │   ├── Dockerfile
│   │   └── pom.xml
│   └── notification-service/              # Notification system
│       ├── src/main/java/
│       │   └── com/eventflow/notificationservice/
│       │       ├── notification/          # Notification management
│       │       ├── listener/              # RabbitMQ consumers
│       │       └── email/                 # Email sending
│       ├── Dockerfile
│       └── pom.xml
├── gateway/                               # API Gateway
│   ├── src/main/java/
│   │   └── com/eventflow/gateway/
│   │       ├── config/                    # Gateway routes
│   │       └── filter/                    # JWT authentication filter
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                              # React application
│   ├── src/
│   │   ├── components/                    # Reusable UI components
│   │   ├── pages/                         # Page components
│   │   ├── auth/                          # Auth context and routes
│   │   ├── api.js                         # API client
│   │   └── main.jsx                       # App entry point
│   ├── nginx.conf                         # Nginx configuration
│   ├── Dockerfile
│   └── package.json
├── docker/                                # Docker configuration
│   ├── docker-compose-microservices.yml   # Main compose file
│   └── .env                               # Environment variables (create this)
├── verify-microservices.ps1               # Health check script
└── README.md                              # This file
```

---

## 🧪 Testing

### Automated Verification

Run the verification script to test all services:

```bash
.\verify-microservices.ps1
```

This script tests:
- ✅ All service health endpoints
- ✅ User registration
- ✅ User login
- ✅ Event creation with JWT
- ✅ Database connectivity

### Manual Testing

**1. Test Registration:**
```bash
curl -X POST http://localhost:18080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "ORGANIZER"
  }'
```

**2. Test Login:**
```bash
curl -X POST http://localhost:18080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**3. Test Event Creation (use token from login):**
```bash
curl -X POST http://localhost:18080/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Test Event",
    "description": "Test event description",
    "startAt": "2026-12-31T10:00:00Z",
    "endAt": "2026-12-31T18:00:00Z",
    "address": "Test Street 123",
    "city": "Warsaw",
    "capacity": 100
  }'
```

---

## 🐛 Troubleshooting

### Services not starting

**Check container status:**
```bash
docker compose -f docker-compose-microservices.yml ps
```

**View logs:**
```bash
# All services
docker compose -f docker-compose-microservices.yml logs -f

# Specific service
docker logs eventflow-user-service -f
docker logs eventflow-event-service -f
docker logs eventflow-gateway -f
```

### Port conflicts

If ports are already in use, you can either:

1. Stop the conflicting services on your host machine
2. Edit `docker/docker-compose-microservices.yml` to change host port mappings

**Find process using a port (Windows):**
```bash
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Database connection issues

**Reset databases:**
```bash
cd docker
docker compose -f docker-compose-microservices.yml down -v
docker compose -f docker-compose-microservices.yml up -d --build
```

This will delete all data and recreate fresh databases.

### RabbitMQ connection errors

**Check RabbitMQ status:**
```bash
docker logs eventflow-rabbitmq
```

**Access RabbitMQ Management UI:**
http://localhost:15672 (eventflow / eventflow123)

### Frontend cannot reach backend

The frontend uses nginx to proxy API requests. Check nginx logs:
```bash
docker logs eventflow-frontend
```

### Clean restart

**Complete reset (removes all data):**
```bash
cd docker
docker compose -f docker-compose-microservices.yml down -v
docker system prune -a --volumes -f
docker compose -f docker-compose-microservices.yml up -d --build
```

---

## 🚀 Development

### Local Development Setup

**Run backend services with Docker:**
```bash
cd docker
docker compose -f docker-compose-microservices.yml up -d
```

**Run frontend with hot reload:**
```bash
cd frontend
npm install
npm run dev
```

Frontend dev server: http://localhost:5173 with hot module replacement

### Building Individual Services

**Build specific service:**
```bash
cd services/user-service
mvn clean package
docker build -t eventflow-user-service .
```

**Build all backend services:**
```bash
# From each service directory
cd services/user-service && mvn clean package && cd ../..
cd services/event-service && mvn clean package && cd ../..
cd services/notification-service && mvn clean package && cd ../..
cd gateway && mvn clean package && cd ..
```

---

## 📊 Monitoring

### Health Checks

All Spring Boot services expose Actuator health endpoints:

```bash
# Check all services
curl http://localhost:18080/actuator/health
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8083/actuator/health
```

### RabbitMQ Monitoring

Access RabbitMQ Management UI at http://localhost:15672

Monitor:
- Message rates
- Queue depths
- Consumer connections
- Exchange bindings

### Container Metrics

```bash
# View resource usage
docker stats

# View specific container
docker stats eventflow-user-service
```

---

## 📝 API Documentation

Each microservice provides interactive API documentation via Swagger UI:

- **User Service API:** http://localhost:8081/swagger-ui/index.html
  - Authentication endpoints
  - User management

- **Event Service API:** http://localhost:8082/swagger-ui/index.html
  - Event CRUD operations
  - Registration management
  - Weather information

- **Notification Service API:** http://localhost:8083/swagger-ui/index.html
  - Notification retrieval
  - Mark as read

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Authors

EventFlow Team

---

## 🙏 Acknowledgments

- [Spring Boot](https://spring.io/projects/spring-boot)
- [React](https://reactjs.org/)
- [Open-Meteo](https://open-meteo.com/) - Weather API
- [OpenStreetMap](https://www.openstreetmap.org/) - Map tiles and geocoding
- [RabbitMQ](https://www.rabbitmq.com/) - Message broker
