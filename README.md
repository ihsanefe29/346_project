# SNG346 — Event Booking & Ticketing System

**Option 2** from the SNG346 Web Application Development semester project.

A full-stack web application built with Next.js, Prisma ORM, and SQLite. Organisers can create and manage events; attendees can discover and book tickets. Tokens are stored in `HttpOnly` cookies (not `localStorage`) to prevent XSS-based token theft.

---

## Team

| Student ID | Name |
|------------|------|
| _(fill in)_ | _(fill in)_ |

---

## Setup Instructions

### Prerequisites

- Node.js v18+
- npm

### 1. Clone the repository

```bash
git clone <repo-url>
cd 346
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the provided `.env` file or create one in the project root:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace_with_a_strong_random_secret"
REFRESH_SECRET="replace_with_a_different_strong_random_secret"
NODE_ENV="development"
```

> ⚠️ **Never commit real secrets.** Generate safe values with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Apply database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Seed the database

```bash
node prisma/seed.js
```

This creates the following test accounts (all passwords: **Seed1234**):

| Role | Username |
|------|----------|
| ORGANIZER | organizer1 |
| ORGANIZER | organizer2 |
| ATTENDEE | attendee1 |
| ATTENDEE | attendee2 |
| ATTENDEE | attendee3 |
| ATTENDEE | attendee4 |

### 6. Run the development server

```bash
npm run dev
```

App is available at **http://localhost:3000**

---

## Deployment (Docker)

```bash
docker build -t sng346-app .
docker run -p 3000:3000 --env-file .env sng346-app
```

---

## Project Structure

```
346/
├── app/
│   ├── api/
│   │   ├── users/
│   │   │   ├── login/route.js      # POST — login, sets HttpOnly cookies
│   │   │   ├── logout/route.js     # POST — clears auth cookies
│   │   │   ├── signup/route.js     # POST — register new user
│   │   │   └── route.js            # GET — verify token | POST — refresh token
│   │   ├── events/
│   │   │   ├── route.js            # GET all events | POST create event
│   │   │   └── [id]/
│   │   │       ├── route.js        # GET | POST (update) | DELETE event
│   │   │       └── bookings/
│   │   │           └── route.js    # POST — book an event
│   │   ├── bookings/
│   │   │   ├── route.js            # GET — my bookings
│   │   │   └── [id]/route.js       # GET | DELETE a booking
│   │   └── organizer/
│   │       └── events/
│   │           ├── route.js        # GET — organizer's own events
│   │           └── [id]/route.js   # GET — event detail with attendee list
│   ├── components/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── EventsPage.tsx
│   │   ├── OrganiserDashboard.tsx
│   │   ├── MyBookings.tsx
│   │   └── EventForm.tsx
│   ├── App.tsx
│   └── page.js
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   ├── db.js
│   └── migrations/
├── utils/
│   ├── auth.js          # bcrypt, JWT helpers
│   ├── roles.js         # Role enum
│   └── Helper.js        # Shared error response helper
├── middleware.js         # Rate limiter (applied to /api/users/*)
└── .env
```

---

## Architecture

```
Browser (React/Next.js)
        │  fetch(..., { credentials: 'include' })
        ▼
Next.js API Routes (app/api/)
        │
        ├─ middleware.js  ← rate limiting on /api/users/*
        │
        ├─ auth check via verifyToken() (reads HttpOnly cookie)
        │
        ▼
Prisma ORM  →  SQLite (dev.db)
```

---

## Authentication & Token Flow

1. **Login** (`POST /api/users/login`): credentials verified with bcrypt; access token (1 h) and refresh token (15 d) are set as `HttpOnly`, `SameSite=Strict` cookies. No tokens are ever sent to JavaScript.
2. **Authenticated requests**: the browser automatically includes the `token` cookie. The API route reads it via `request.cookies`.
3. **Token refresh** (`POST /api/users`): reads the `refresh_token` cookie, validates it against the stored value in the database, and issues a new access token cookie.
4. **Logout** (`POST /api/users/logout`): server clears both cookies by setting `maxAge=0`.

> **Why cookies instead of `localStorage`?** `localStorage` is accessible by any JavaScript on the page, making tokens vulnerable to XSS attacks. `HttpOnly` cookies cannot be read by JavaScript at all — the browser sends them automatically and only over HTTPS in production.

---

## API Documentation

All endpoints that require authentication read the `token` cookie automatically. For direct API testing (e.g., Postman/cURL), you can also pass `Authorization: Bearer <token>` as a header.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/signup` | — | Register a new user |
| POST | `/api/users/login` | — | Login, sets auth cookies |
| GET | `/api/users` | ✓ | Verify token, return user info |
| POST | `/api/users` | ✓ (refresh cookie) | Refresh access token |
| POST | `/api/users/logout` | — | Clear auth cookies |

#### POST `/api/users/signup`
```json
// Request body
{ "username": "alice", "name": "Alice Smith", "email": "alice@example.com", "password": "MyPass123", "role": "ATTENDEE" }

// 201 Response
{ "username": "alice", "name": "Alice Smith", "email": "alice@example.com", "role": "ATTENDEE" }
```

#### POST `/api/users/login`
```json
// Request body
{ "username": "alice", "password": "MyPass123" }

// 200 Response (tokens delivered as HttpOnly cookies, not in body)
{ "user": { "id": "1", "username": "alice", "role": "attendee" } }
```

---

### Events

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/events` | — | Any | List all events with booking counts |
| POST | `/api/events` | ✓ | ORGANIZER | Create a new event |
| GET | `/api/events/:id` | — | Any | Get a single event |
| POST | `/api/events/:id` | ✓ | ORGANIZER (owner) | Update an event |
| DELETE | `/api/events/:id` | ✓ | ORGANIZER (owner) | Delete an event and its bookings |

#### POST `/api/events` — Create Event
```json
// Request body
{ "title": "Tech Talk 2026", "description": "Panel discussion on AI.", "dateTime": "2026-09-15T18:00:00Z", "capacity": 100 }
```

---

### Bookings

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/events/:id/bookings` | ✓ | ATTENDEE | Book a ticket (capacity-checked, transactional) |
| GET | `/api/bookings` | ✓ | Any | List my bookings |
| GET | `/api/bookings/:id` | ✓ | Owner | Get a specific booking |
| DELETE | `/api/bookings/:id` | ✓ | Owner | Cancel a booking |

---

### Organiser Dashboard

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/organizer/events` | ✓ | ORGANIZER | All own events with booking lists |
| GET | `/api/organizer/events/:id` | ✓ | ORGANIZER (owner) | Event detail: sold tickets + attendee list |

---

## Data Model

```
User
  id, username (unique), name, email, password (hashed), role, refresh_token
  ├── events[]     (as organizer)
  └── bookings[]

Event
  id, title, description, dateTime, capacity, organizerId
  └── bookings[]

Booking
  id, userId, eventId, createdAt
  @@unique([userId, eventId])   ← prevents duplicate bookings
```

---

## Security Measures

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt with 10 salt rounds (`bcryptjs`) |
| Token storage | `HttpOnly` + `SameSite=Strict` cookies (not `localStorage`) |
| JWT secrets | Loaded from environment variables; validated at startup |
| Token payload | Only `userId`, `username`, `role` — no sensitive data |
| Role-based access | Checked on every protected route |
| Overbooking prevention | Prisma interactive transaction (atomic check + insert) |
| Rate limiting | `middleware.js` on `/api/users/*` — 10 req / 5 min per IP |
| Input validation | All required fields checked; email format validated; capacity > 0 |
| Cascade deletes | Bookings deleted when event or user is deleted (Prisma `onDelete: Cascade`) |

---

## Bonus Features Implemented

- **Advanced search & filtering** — events searchable by title/description; filterable by upcoming/past
- **Pagination** — both EventsPage and OrganiserDashboard paginate results
- **Rate limiting** — IP-based rate limiter in `middleware.js`

---

## HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (wrong role or not the owner) |
| 404 | Not Found |
| 409 | Conflict (duplicate username/email) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Citations

All external sources are cited inline in the relevant files as comments. Summary:

- `utils/auth.js` — adapted from course material (METU ODTUClass)
- `prisma/seed.js` — generated via ChatGPT
- `app/api/events/[id]/bookings/route.js` — overbooking check pattern suggested by ChatGPT
- `app/api/organizer/events/[id]/route.js` — Prisma nested include generated by ChatGPT
- `utils/roles.js` — `Object.freeze` pattern from Reddit discussion
- Date validation — FreeCodeCamp article on JS date validation
