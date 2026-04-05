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
- REFRESH_SECRET="..."

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
  "name": "user",
  "email": "user@test.com",
  "password": "12345678",
  "role": "ATTENDEE"
}

Login
- POST /api/users/login
Request Body:
  {
  "username": "user1",
  "password": "12345678"
  }

Response:
{
  "token": "token",
  "refresh_token": "token"
}

Check auth
- GET /api/users

Request Header:
  {
  "Authorization": "Bearer token"
  }


Get new access token
- POST /api/users

Request Header:
{
"Authorization": "Bearer refresh_token"
}


Events

Create Event (Organizer)
- POST /api/events

Request Header:
{
"Authorization": "Bearer token"
}

Request Body:
{
"title": "Fall Concert",
"description": "Live music on campus",
"dateTime": "09/15/2019",
"capacity": 500
}


Get All Events
- GET /api/events

Get Event by ID
- GET /api/events/:id

Update Event (Organizer)
- POST /api/events/:id

Request Header:
{
"Authorization": "Bearer token"
}

Request Body:
{
"title": "Fall Concert",
"description": "Live music on campus",
"dateTime": "09/15/2019",
"capacity": 500
}


Delete Event (Organizer)
- DELETE /api/events/:id

Request Header:
{
"Authorization": "Bearer token"
}


Bookings

Create Booking 
- POST /api/events/:id/bookings

Request Header:
{
"Authorization": "Bearer token"
}


Get My Bookings
- GET /api/bookings

Request Header:
{
"Authorization": "Bearer token"
}


Get a Booking
- GET /api/bookings/:id

Request Header:
{
"Authorization": "Bearer token"
}


Delete a Booking
- DELETE /api/bookings/:id

Request Header:
{
"Authorization": "Bearer token"
}


Organizer dashboard
- - GET /api/organizer/events
- GET /api/organizer/events/:id

Request Header:
{
"Authorization": "Bearer token"
}


Authentication & Authorization Flow
1. User logs in and receives access + refresh tokens
2. Access token is sent in header:
Authorization: Bearer <token>
3. Middleware verifies token
4. Role-based authorization is applied

Architecture
Client → API Routes → Controllers → Services → Prisma ORM → Database

Error Handling
- 400 → Bad Request
- 401 → Unauthorized
- 403 → Forbidden
- 404 → Not Found
- 500 → Internal Server Error

Technologies Used
- Node.js / Next.js
- Prisma ORM
- SQLite
- JWT
- bcrypt

Project Structure
- /app/api
- /prisma
- /utils

Security
- Password hashing
- JWT authentication
- Role-based authorization
- Input validation