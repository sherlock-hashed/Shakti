# Pulseboard — API Health Monitor & Alert Dashboard

A production-ready MERN stack application for monitoring API endpoint health, tracking uptime, and receiving email alerts on status changes.

## Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | React 19 · TypeScript · Vite · Tailwind CSS v4  |
| Backend   | Express 5 · JavaScript · Node.js                |
| Database  | MongoDB Atlas (Mongoose ODM)                    |
| Auth      | JWT (jsonwebtoken + bcryptjs)                   |
| Scheduler | node-cron                                       |
| Alerts    | Nodemailer (Gmail SMTP)                         |

## Project Structure

```
project-root/
├── client/          ← React SPA (TypeScript)
│   ├── src/
│   │   ├── pages/        Page components
│   │   ├── components/   UI components (shadcn/ui)
│   │   ├── context/      Auth context
│   │   ├── hooks/        Custom hooks
│   │   ├── api/          Axios instance
│   │   └── lib/          Utilities
│   └── package.json
│
├── server/          ← Express API (JavaScript)
│   ├── src/
│   │   ├── config/       DB connection
│   │   ├── models/       Mongoose schemas
│   │   ├── controllers/  Route handlers
│   │   ├── middleware/   Auth middleware
│   │   ├── routes/       API routes
│   │   ├── cron/         Health check scheduler
│   │   └── utils/        Helpers
│   ├── tests/
│   └── package.json
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas account (free M0 cluster)
- Gmail account for alerts (with app password)

### Setup

```bash
# Clone the repo
git clone https://github.com/sherlock-hashed/Shakti.git
cd Shakti

# Install dependencies
cd client && npm install
cd ../server && npm install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your credentials

# Start development
cd server && npm run dev    # Terminal 1: API on :5000
cd client && npm run dev    # Terminal 2: UI on :5173
```

## API Endpoints

| Method | Endpoint              | Description              | Auth |
| ------ | --------------------- | ------------------------ | ---- |
| GET    | `/api/health`         | Server health check      | No   |
| POST   | `/api/auth/register`  | Register a new user      | No   |
| POST   | `/api/auth/login`     | Login (returns JWT)      | No   |
| GET    | `/api/auth/me`        | Get current user         | Yes  |
| GET    | `/api/monitors`       | List all monitors        | Yes  |
| GET    | `/api/monitors/:id`   | Get monitor + checks     | Yes  |
| POST   | `/api/monitors`       | Create a monitor         | Yes  |
| PATCH  | `/api/monitors/:id`   | Update a monitor         | Yes  |
| DELETE | `/api/monitors/:id`   | Delete a monitor         | Yes  |

## License

MIT
