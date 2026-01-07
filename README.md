# EventFlow - Event Management System

A full-stack event management system built with Spring Boot 3 and React, designed for university project requirements with a clear upgrade path to microservices architecture.

## 🎯 Project Overview

EventFlow is a production-quality event management platform that allows:
- **Users** to browse and register for events
- **Organizers** to create and manage events
- **Admins** to oversee the entire system

The system integrates external APIs (geocoding and weather), implements security best practices, and is designed with event-driven architecture principles for easy migration to microservices.

## 🏗️ Architecture

### Current (Monolith - Grade 4.0)
- **Backend**: Spring Boot 3 REST API
- **Frontend**: React + Vite SPA
- **Database**: PostgreSQL (or H2 in-memory for testing)
- **Security**: JWT-based authentication
- **External APIs**: OpenStreetMap Nominatim (geocoding), Open-Meteo (weather)

### Future Path (Grade 5.0)
The codebase is structured to support easy migration to:
- Event-driven architecture using RabbitMQ
- Microservices: Auth Service, Events Service, Registrations Service
- API Gateway pattern

Look for `TODO: For grade 5.0` comments in the code for upgrade points.

## 📁 Project Structure

```
eventflow/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/eventflow/
│   │   ├── auth/              # Authentication module
│   │   ├── users/             # User management
│   │   ├── events/            # Event management
│   │   ├── registrations/     # Event registrations
│   │   ├── integrations/      # External API integrations
│   │   └── common/            # Shared components
│   │       ├── security/      # JWT, filters, config
│   │       ├── events/        # Domain events (RabbitMQ ready)
│   │       ├── exception/     # Global error handling
│   │       ├── encryption/    # Email encryption
│   │       └── config/        # OpenAPI config
│   ├── src/main/resources/
│   │   ├── application.yml    # Configuration
│   │   └── db/migration/      # Flyway SQL scripts
│   └── pom.xml                # Maven dependencies
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── api.js             # API client
│   │   └── App.jsx            # Main app component
│   └── package.json
├── docker/
│   └── docker-compose.yml     # PostgreSQL (+ RabbitMQ ready)
└── README.md
```

## 🚀 Quick Start

### Prerequisites

**Required:**
- **Java 17+** - [Download JDK](https://adoptium.net/)
- **Maven 3.8+** - [Download Maven](https://maven.apache.org/download.cgi)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)

**Optional (for PostgreSQL):**
- **Docker Desktop** - [Download Docker](https://www.docker.com/products/docker-desktop/)
- **OR PostgreSQL 15** - [Download PostgreSQL](https://www.postgresql.org/download/)

### Installation Steps

#### 1. Install Java 17
1. Download from https://adoptium.net/
2. Install and add to PATH
3. Verify: `java -version`

#### 2. Install Maven
1. Download from https://maven.apache.org/download.cgi
2. Extract to `C:\Program Files\Maven`
3. Add to PATH: `C:\Program Files\Maven\bin`
4. Verify: `mvn -version`

#### 3. Install Node.js
1. Download from https://nodejs.org/
2. Install (includes npm)
3. Verify: `node -v` and `npm -v`

### Running the Application

#### Option A: Quick Start (H2 In-Memory Database)
**Easiest way - no database setup needed!**

**Terminal 1 - Backend:**
```powershell
cd backend
mvn clean install -DskipTests
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 Console: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:eventflow`
  - Username: `sa`
  - Password: (leave empty)

---

#### Option B: Production Setup (PostgreSQL)

**Step 1: Start PostgreSQL**

Using Docker:
```powershell
cd docker
docker-compose up -d
```

Or install PostgreSQL locally and create database:
```sql
CREATE DATABASE eventflow;
CREATE USER eventflow WITH PASSWORD 'eventflow123';
GRANT ALL PRIVILEGES ON DATABASE eventflow TO eventflow;
```

**Step 2: Configure Backend**

Copy and edit `.env` file:
```powershell
cd backend
copy .env.example .env
# Edit .env if using custom database credentials
```

**Step 3: Run Backend**
```powershell
cd backend
mvn clean install
mvn spring-boot:run
```

**Step 4: Run Frontend**
```powershell
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

---

### First Time Setup

1. **Register an Organizer Account:**
   - Go to http://localhost:5173
   - Click "Register"
   - Fill in details and select role "Organizer"
   - Login with your credentials

2. **Create Your First Event:**
   - Click "My Events" in the navigation
   - Click "Create New Event"
   - Fill in event details
   - Submit

3. **Register as User:**
   - Logout and register a new account with role "User"
   - Browse events and register for them

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "USER"
}

Response: 201 Created
{
  "token": "eyJhbGciOiJIUzI1...",
  "username": "john_doe",
  "role": "USER"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1...",
  "username": "john_doe",
  "role": "USER"
}
```

### Event Endpoints

#### Create Event (ORGANIZER/ADMIN)
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Tech Conference 2026",
  "description": "Annual technology conference",
  "startAt": "2026-06-15T09:00:00Z",
  "endAt": "2026-06-15T18:00:00Z",
  "address": "123 Tech Street, Warsaw, Poland",
  "city": "Warsaw",
  "capacity": 100
}

Response: 201 Created
```

#### Get All Events (Public)
```http
GET /api/events?city=Warsaw&status=PLANNED&dateFrom=2026-01-01T00:00:00Z

Response: 200 OK
[
  {
    "id": "uuid",
    "title": "Tech Conference 2026",
    "city": "Warsaw",
    "startAt": "2026-06-15T09:00:00Z",
    "capacity": 100,
    "availableSpots": 75,
    "status": "PLANNED",
    ...
  }
]
```

#### Get Event Weather
```http
GET /api/events/{id}/weather

Response: 200 OK
{
  "temperature": 22.5,
  "condition": "Clear",
  "forecast": "Temperature: 22.5°C, Max: 25.0°C, Min: 20.0°C, Precipitation: 0.0mm"
}
```

#### Update Event (Owner/ADMIN)
```http
PUT /api/events/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "capacity": 150
}

Response: 200 OK
```

#### Delete Event (Owner/ADMIN)
```http
DELETE /api/events/{id}
Authorization: Bearer <token>

Response: 204 No Content
```

### Registration Endpoints

#### Register to Event (USER)
```http
POST /api/events/{id}/registrations
Authorization: Bearer <token>

Response: 201 Created
{
  "id": "uuid",
  "eventId": "uuid",
  "userId": "uuid",
  "status": "REGISTERED",
  "createdAt": "2026-01-07T12:00:00"
}
```

#### Unregister from Event (USER)
```http
DELETE /api/events/{id}/registrations/me
Authorization: Bearer <token>

Response: 204 No Content
```

#### Get Event Registrations (ORGANIZER/ADMIN)
```http
GET /api/events/{id}/registrations
Authorization: Bearer <token>

Response: 200 OK
[...]
```

## 🔐 Security Features

### JWT Authentication
- Stateless authentication
- 24-hour token expiration
- Role-based access control (USER, ORGANIZER, ADMIN)

### Data Encryption
- Email addresses encrypted at rest using AES
- Encryption key configurable via environment variable

### Authorization Rules
- **Public**: View events, event details
- **USER**: Register/unregister for events
- **ORGANIZER**: Create/update/delete own events
- **ADMIN**: Full system access

## 🧪 Testing

### Run Tests
```bash
cd backend
mvn test
```

Tests use Testcontainers for PostgreSQL integration testing.

### Test Coverage
- Auth: Registration, login, duplicate username validation
- Events: CRUD operations, filters, authorization
- Integration: Full request/response cycles

## 🌐 External API Integrations

### Geocoding (OpenStreetMap Nominatim)
- Automatically converts event addresses to lat/lon coordinates
- Free, no API key required
- Rate-limited: respects usage policies

### Weather (Open-Meteo)
- Provides weather forecasts for event dates
- Free, no API key required
- Returns temperature, precipitation, and conditions

## 🔄 Event-Driven Architecture (Upgrade Path)

The system implements domain events that are currently logged locally but can be easily upgraded to RabbitMQ:

### Domain Events
- `EventCreated`
- `EventUpdated`
- `EventCancelled`
- `UserRegisteredToEvent`
- `UserUnregisteredFromEvent`

### Implementation
See `LocalDomainEventPublisher.java` - replace with RabbitMQ template to enable message-based communication.

```java
// Current (Grade 4.0)
eventPublisher.publish(new EventCreated(...));
// Logs event

// Future (Grade 5.0)
// Same code, different implementation
// Publishes to RabbitMQ exchange
```

## 📊 Database Schema

### Users Table
```sql
- id (UUID, PK)
- username (VARCHAR, UNIQUE)
- encrypted_email (TEXT)
- password (VARCHAR)
- role (VARCHAR)
- enabled (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

### Events Table
```sql
- id (UUID, PK)
- title, description (VARCHAR/TEXT)
- start_at, end_at (TIMESTAMP WITH TIMEZONE)
- address, city (VARCHAR)
- latitude, longitude (DOUBLE)
- capacity (INTEGER)
- status (VARCHAR: PLANNED/CANCELLED/FINISHED)
- organizer_id (UUID, FK → users)
- created_at, updated_at (TIMESTAMP)
```

### Registrations Table
```sql
- id (UUID, PK)
- event_id (UUID, FK → events)
- user_id (UUID, FK → users)
- status (VARCHAR: REGISTERED/CANCELLED)
- created_at (TIMESTAMP)
- UNIQUE(event_id, user_id)
```

## 🛠️ Configuration

### Environment Variables

#### Required
- `DB_URL` - Database connection URL
- `DB_USER` - Database username
- `DB_PASS` - Database password
- `JWT_SECRET` - Secret key for JWT signing (base64 encoded)
- `ENCRYPTION_KEY` - 16-character key for AES encryption

#### Optional
- `JWT_EXPIRATION` - Token expiration in milliseconds (default: 86400000)

### Application Profiles

#### Development (`dev`)
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
- Detailed SQL logging
- Debug-level logging

#### Test (`test`)
- Separate test database
- Used by Testcontainers

## 🚢 Deployment

### Build Backend JAR
```bash
cd backend
mvn clean package
java -jar target/eventflow-backend-1.0.0.jar
```

### Build Frontend Production
```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or similar
```

### Docker Deployment (Optional)
Create Dockerfiles for backend and frontend, then use Docker Compose for full stack deployment.

## 📈 Upgrade to Microservices (Grade 5.0)

### Step 1: Enable RabbitMQ
Uncomment RabbitMQ service in `docker/docker-compose.yml` and start it.

### Step 2: Replace Event Publisher
Replace `LocalDomainEventPublisher` with RabbitMQ implementation:
- Add Spring AMQP dependency
- Configure RabbitTemplate
- Implement message serialization
- Define exchanges and queues

### Step 3: Split into Services
The modular package structure supports easy extraction:
- **Auth Service**: `auth/` + `users/`
- **Events Service**: `events/`
- **Registrations Service**: `registrations/`

Each module has its own controllers, services, and repositories.

### Step 4: Add API Gateway
Use Spring Cloud Gateway or similar to route requests.

## 🐛 Troubleshooting

### "mvn is not recognized" or "java is not recognized"
**Solution:** Install Java and Maven and add them to your system PATH
1. Windows: Search "Environment Variables" → Edit System Environment Variables → PATH
2. Add Java bin directory: `C:\Program Files\Eclipse Adoptium\jdk-17\bin`
3. Add Maven bin directory: `C:\Program Files\Maven\bin`
4. Restart terminal/IDE

### "npm is not recognized"
**Solution:** Install Node.js from https://nodejs.org/

### Database Connection Issues (PostgreSQL)
- **H2 Alternative:** Use `mvn spring-boot:run -Dspring-boot.run.profiles=h2` instead
- **Docker not running:** Start Docker Desktop, then run `docker-compose up -d`
- **Port 5432 in use:** Stop other PostgreSQL instances or change port in docker-compose.yml

### Backend Compilation Errors
```powershell
# Clean and rebuild
cd backend
mvn clean install -DskipTests
```

### Frontend Not Loading
```powershell
# Clear node_modules and reinstall
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

### JWT Token Errors
- Ensure `JWT_SECRET` in application.yml or .env is properly set
- Default secret works for development

### Port Already in Use
- Backend (8080): Change `server.port` in application.yml
- Frontend (5173): Change port in vite.config.js
- PostgreSQL (5432): Change port in docker-compose.yml

### External APIs Not Working
- Geocoding/Weather APIs are external and may be temporarily unavailable
- App will work without them, but coordinates/weather won't be available

---

## 📝 Quick Commands Reference

### Backend
```powershell
# Build project
mvn clean install

# Run with H2 (no database needed)
mvn spring-boot:run -Dspring-boot.run.profiles=h2

# Run with PostgreSQL
mvn spring-boot:run

# Run tests
mvn test

# Skip tests during build
mvn clean install -DskipTests
```

### Frontend
```powershell
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker
```powershell
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

---

## 🎓 For University Grading

### Grade 4.0 Features Implemented
✅ Full CRUD REST API  
✅ PostgreSQL integration with Flyway migrations  
✅ External API integration (geocoding + weather)  
✅ JWT authentication & authorization  
✅ Role-based access control  
✅ Email encryption at rest  
✅ Data validation  
✅ Global exception handling  
✅ OpenAPI/Swagger documentation  
✅ Integration tests with Testcontainers  
✅ React frontend with login/register/CRUD  

### Grade 5.0 Preparation
✅ Event-driven architecture abstraction ready  
✅ Domain events defined  
✅ Modular package structure for microservices split  
✅ RabbitMQ configuration prepared (commented)  
✅ Clear TODO markers for upgrade points  

## 👥 Authors

Created as a university project demonstrating production-quality software engineering practices.

## 📄 License

MIT License - Free to use for educational purposes.

---

**Swagger UI**: http://localhost:8080/swagger-ui.html  
**Frontend**: http://localhost:5173  
**RabbitMQ Management** (when enabled): http://localhost:15672
