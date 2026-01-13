# EventFlow - Event Management Platform

A full-stack web application for event management with user registration, event creation, and notifications.

## 🚀 Quick Start (One Command)

### Prerequisites
- **Docker Desktop** installed and running

### Start the Application

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Or manually:**
```powershell
cd docker
docker-compose up -d --build
```

Wait 1-2 minutes for all services to start, then open: **http://localhost:5173**

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Organizer | organizer@example.com | password123 |
| User | user@example.com | password123 |

### Stop the Application
```powershell
cd docker
docker-compose down
```

---

## 📋 Features

### User Management
- ✅ User registration with email validation
- ✅ JWT-based authentication
- ✅ Role-based access (USER, ORGANIZER, ADMIN)

### Event Management
- ✅ Create/Edit/Delete events (Organizers)
- ✅ Event listing with search and filters
- ✅ Event details with map (OpenStreetMap)
- ✅ Weather information for event location
- ✅ Geocoding for event locations

### Registration System
- ✅ Register/Cancel registration for events
- ✅ Capacity management
- ✅ Registration status tracking
- ✅ Organizer can view registrations

### Notifications
- ✅ In-app notifications
- ✅ Event-driven notifications

---

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│  PostgreSQL │
│  (React)    │     │(Spring Boot)│     │             │
│  Port 5173  │     │  Port 8080  │     │  Port 5432  │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- Java 17
- Spring Boot 3.2.1
- Spring Security with JWT
- Spring Data JPA
- PostgreSQL 15
- Flyway (database migrations)

### Frontend
- React 18.2
- Vite 5.4
- Tailwind CSS
- React Router 6

### Infrastructure
- Docker & Docker Compose
- Nginx (production frontend)

---

## 📁 Project Structure

```
eventflow/
├── backend/                 # Spring Boot application
│   ├── src/main/java/
│   │   └── com/eventflow/
│   │       ├── auth/        # Authentication
│   │       ├── events/      # Event management
│   │       ├── users/       # User management
│   │       ├── registrations/# Event registrations
│   │       └── notifications/# Notification system
│   └── src/main/resources/
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   └── api.js           # API client
│   └── package.json
├── docker/                  # Docker configuration
│   ├── docker-compose.yml   # Main setup
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
├── start.ps1               # One-command startup
└── README.md
```

---

## 🔧 Development Setup

### Run Frontend Locally (Hot Reload)
```powershell
# Start backend with Docker
cd docker
docker-compose up postgres backend -d

# Run frontend with Vite dev server
cd ../frontend
npm install
npm run dev
```

Frontend will be at http://localhost:5173 with hot reload.

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/events | List all events |
| GET | /api/events/{id} | Get event details |
| POST | /api/events | Create event (Organizer) |
| PUT | /api/events/{id} | Update event (Organizer) |
| DELETE | /api/events/{id} | Delete event (Organizer) |

### Registrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/events/{id}/register | Register for event |
| DELETE | /api/events/{id}/register | Cancel registration |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | Get notifications |
| PUT | /api/notifications/{id}/read | Mark as read |

---

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Find process using port
netstat -ano | findstr :5173
netstat -ano | findstr :8080

# Kill it
taskkill /PID <PID> /F
```

### Docker Issues
```powershell
# Full restart
cd docker
docker-compose down -v
docker-compose up -d --build
```

### Check Logs
```powershell
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 📄 License

MIT License
