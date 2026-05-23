# 🏥 Mediease – Online Medical Consultation Portal

> A full-stack MERN application for booking and managing online doctor consultations, featuring live video chat rooms, prescriptions, payments, and multi-role dashboards.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io |
| Auth | JWT (JSON Web Tokens) |
| File Upload | Multer |
| PDF Generation | PDFKit |

---

## ✨ Features

### 👤 Patient Portal
- Register with strict email & strong password validation
- Book appointments with available doctors by slot
- Simulated payment & appointment confirmation
- Live video consultation room (WebRTC-ready with Socket.io)
- Download PDF prescriptions post-consultation
- Rate and review doctors
- Medical profile (blood group, allergies, emergency contact)

### 🩺 Doctor Portal
- Register and await admin approval before login
- Manage weekly slot availability
- View and manage patient appointments
- Launch consultation rooms & send real-time chat messages
- Issue prescriptions with diagnosis, symptoms & medicines
- Upload profile photo (visible to patients)
- Edit clinical profile (specialization, fee, qualifications, etc.)

### 🛡️ Admin Portal
- Approve or reject pending doctor applications
- Create and manage hospital departments
- View system-wide appointments & statistics
- Manage all registered users

---

## 📁 Project Structure

```
Mediease/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, upload, logger, error
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── services/        # Email service
│   ├── sockets/         # Socket.io event handlers
│   ├── uploads/         # Runtime uploaded files (gitignored)
│   ├── seed_admin.js    # Script to create admin account
│   ├── server.js        # App entry point
│   └── .env.example     # Environment variable template
│
├── frontend/
│   ├── src/
│   │   ├── context/     # AuthContext
│   │   ├── hooks/       # useSocket hook
│   │   ├── pages/       # All page components
│   │   ├── routes/      # AppRoutes.jsx
│   │   └── services/    # Axios API instance
│   ├── .env.example     # Environment variable template
│   └── index.html
│
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on port `27017`
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mediease.git
cd mediease
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy and configure the environment file:

```bash
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mediease
JWT_SECRET=your_long_random_secret_here
FRONTEND_URL=http://localhost:5173

# Gmail SMTP (get App Password from https://myaccount.google.com/apppasswords)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
```

Start the backend:

```bash
npm run dev
```

> Backend runs at **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Copy and configure the environment file:

```bash
cp .env.example .env
```

The default `frontend/.env` values work out-of-the-box for local dev:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

> Frontend runs at **http://localhost:5173**

---

### 4. Seed the Admin Account

In a new terminal (while backend is running):

```bash
cd backend
node seed_admin.js
```

This creates the default admin account:

| Field | Value |
|---|---|
| Email | `admin@mediease.com` |
| Password | `AdminPassword123` |
| Role | `admin` |

---

## 🔐 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@mediease.com` | `AdminPassword123` |
| **Doctor** | Register via `/signup` → Doctor tab | Pending admin approval |
| **Patient** | Register via `/signup` → Patient tab | Instant access |

---

## 🔑 Password Policy

All accounts require a **strong password** that includes:
- Minimum **8 characters**
- At least **1 uppercase** letter (A–Z)
- At least **1 lowercase** letter (a–z)
- At least **1 number** (0–9)
- At least **1 special character** from: `@$!%*?&_-#`

Example valid password: `Mediease@2026`

---

## 🩺 Doctor Registration & Approval Flow

1. Doctor registers at `/signup` → **Doctor Application** tab
2. Application is saved with `approvalStatus: pending`
3. Admin logs in at `/admin` → **Doctor Approvals** section
4. Admin clicks **Approve** or **Reject**
5. Approved doctors can then log in at `/login`

---

## 📋 API Reference (Key Endpoints)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register patient | Public |
| POST | `/api/auth/register-doctor` | Register doctor | Public |
| POST | `/api/auth/login` | Login any user | Public |
| GET | `/api/doctors` | List approved doctors | Public |
| PUT | `/api/doctors/approve/:id` | Approve/reject doctor | Admin |
| POST | `/api/appointments/book` | Book appointment | Patient |
| GET | `/api/appointments` | Get my appointments | Auth |
| POST | `/api/prescriptions/issue` | Issue prescription | Doctor |
| POST | `/api/users/upload-avatar` | Upload profile photo | Auth |
| GET | `/api/departments` | List departments | Public |
| POST | `/api/departments` | Create department | Admin |

---

## 🌐 Application Routes

| Path | Page | Access |
|---|---|---|
| `/` | Home | Public |
| `/login` | Login | Public |
| `/signup` | Register | Public |
| `/doctors` | Browse Doctors | Public |
| `/doctors/:id` | Doctor Details & Booking | Public |
| `/patient` | Patient Dashboard | Patient |
| `/doctor` | Doctor Dashboard | Doctor |
| `/admin` | Admin Dashboard | Admin |

---

## 📸 Screenshots

> *(Add screenshots of your app here after deployment)*

---

## 🛠️ Development Notes

- The `backend/uploads/` folder is ignored by git — doctor photos are stored here at runtime
- Socket.io is used for real-time consultation chat between patient and doctor
- PDF prescriptions are generated server-side using PDFKit
- Payment flow is simulated (no real payment gateway integrated)

---

## 📄 License

This project is for educational purposes — SRM AP University Final Year Project.

---

## 👨‍💻 Author

**Venkata Kalyan Reddy Kota**  
SRM University AP  
`venkatakalyanreddy_kota@srmap.edu.in`
