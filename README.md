# Q-Pass Bitung (Quality & Quantity Assurance Testimonial System)

A full-stack, production-ready Progressive Web Application (PWA) built for **PT Pertamina (Persero) Integrated Terminal Bitung** to monitor quality and quantity fuel deliveries to SPBUs via automated QR code feedback, real-time alerts, performance reporting, and analytics.

## Tech Stack

### Frontend
- **Framework**: React.js (Vite + TS/JS template)
- **Styling**: Tailwind CSS (Pertamina branding, responsive, flat, modern dark mode support)
- **State/Forms**: React Hook Form, Custom Contexts (Auth, Toast, Theme)
- **Components**: Lucide Icons, Leaflet Maps, Chart.js

### Backend & Database
- **Runtime**: Node.js & Express
- **Database**: PostgreSQL with Prisma ORM
- **Realtime**: Socket.io / WebSocket
- **Exports**: ExcelJS & PDFKit
- **Alerting**: Whatsapp API (Fonnte) & Email Notifications (Nodemailer)

---

## Directory Structure

```
qpass-bitung/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Database Models & Schema
│   │   └── seed.js          # Demo Seeder Data
│   ├── src/
│   │   ├── middleware/      # Auth Guard & File Upload
│   │   ├── routes/          # RESTful Endpoints
│   │   └── server.js        # Server Entry
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/      # Common components & layout
    │   ├── context/         # Auth, Theme, Toast Contexts
    │   ├── pages/           # Admin/Pengawas Dashboards, Public Feedback Form
    │   ├── services/        # Axios API config
    │   └── App.jsx          # Route Config & Guards
    └── package.json
```

---

## Installation & Setup

### Prerequisites
- Node.js (v16+)
- PostgreSQL Database

### 1. Database Setup
Create a PostgreSQL database (e.g. `qpass_bitung`) and update the backend environment variables.

### 2. Backend Configuration
Navigate to the `backend/` directory:
```bash
cd backend
cp .env.example .env
```
Fill out the variables in `.env`:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: Secret key for JWT hashing.
- `QR_BASE_URL`: The base frontend route (e.g. `http://localhost:5173/feedback`)
- SMTP Settings & Whatsapp (Fonnte Token) for notifications.

Install dependencies:
```bash
npm install
```

Generate Prisma client & run database migrations/seeding:
```bash
npx prisma db push
node prisma/seed.js
```

Start the backend development server:
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

### 3. Frontend Configuration
Navigate to the `frontend/` directory:
```bash
cd ../frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The application will open on `http://localhost:5173`.

---

## Default Accounts
- **Admin**: `admin@qpass.com` / `admin123`
- **Pengawas IT**: `pengawas@qpass.com` / `admin123`
