#  Adapted from: ChatGPT response to the question "Create the README.txt file with the full content"
Project Description
This project implements a backend system for an Event Booking & Ticketing Platform. The system allows organizers to create, update, and delete events, while attendees can view events and book tickets. It includes secure authentication, role-based authorization, and prevents overbooking by validating event capacity.

Features
- RESTful API design
- JWT Authentication (Access Token + Refresh Token)
- Role-Based Access Control (Organizer / Attendee)
- Event management (CRUD)
- Booking system with capacity validation
- Input validation
- Error handling with proper HTTP status codes
- Prisma ORM with relational database
- Seed script for test data

Setup Instructions

1. Clone Repository
- git clone <repo-link>
- cd <project-folder>

2. Install Dependencies
- npm install

3. Environment Variables: Create a .env file in the root directory:

- DATABASE_URL="file:./dev.db"
- JWT_SECRET="your_secret_key"
-REFRESH_SECRET="..."

4. Database Setup (Prisma)
- npx prisma migrate dev
- npx prisma generate

5. Seed Database
- node prisma/seed.js

6. Run Application
- npm run dev

Server runs on:
http://localhost:3000

API Documentation

Authentication

Register
- POST /api/users/signup

Request Body:
{
  "username": "user1",
  "password": "123456",
  "email": "user@test.com",
  "role": "ATTENDEE"
}

Login
- POST /api/users/login

Response:
{
  "accessToken": "token",
  "refreshToken": "token"
}

Check auth
- GET /api/users

Get new access token
- POST /api/users

Events

Create Event (Organizer)
- POST /api/events

Get All Events
- GET /api/events

Get Event by ID
- GET /api/events/:id

Update Event (Organizer)
- PUSH /api/events/:id

Delete Event (Organizer)
- DELETE /api/events/:id

Bookings

Create Booking (Attendee)
- POST /api/events/:id/bookings

Get My Bookings
- GET /api/bookings

Get a Bookings
- GET /api/bookings/:id

Delete a Bookings
- DELETE /api/bookings/:id

Organizer dashboard
- GET /api/organizer/events/:id

Authentication & Authorization Flow
1. User logs in and receives access + refresh tokens
2. Access token is sent in header:
Authorization: Bearer <token>
3. Middleware verifies token
4. Role-based authorization is applied

Architecture
Client → API Routes → Controllers → Services → Prisma ORM → Database

Error Handling
400 → Bad Request
401 → Unauthorized
403 → Forbidden
404 → Not Found
500 → Internal Server Error

Technologies Used
- Node.js / Next.js
- Prisma ORM
- SQLite
- JWT
- bcrypt

Project Structure
/app/api
/prisma
/utils

Security
- Password hashing
- JWT authentication
- Role-based authorization
- Input validation
