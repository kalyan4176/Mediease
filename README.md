# Mediease - Hospital Consultation Portal

Mediease is a modern, responsive, and secure MERN-stack Hospital Consultation Portal that allows Patients to book and conduct digital video consultations, Doctors to manage clinical schedules and issue digital prescriptions, and Administrators to oversee hospital operations and onboard medical practitioners.

The system features real-time Socket.io communication, WebRTC signaling wrappers, dynamic PDFKit prescription generation, and a fully simulated Stripe checkout flow.

---

## 🌟 Key Features

### 👤 Patient Portal
- **Onboarding & Verification**: OTP-based email verification using local SMTP/Mock transport logs.
- **Search Panel**: Advanced physician search by specialization, experience, consult fee caps, and ratings.
- **Scheduler**: Weekly time slot bookings with duplicate booking prevention.
- **Billing Checkout**: Simulated Stripe gateway popups updating booking records directly to "confirmed".
- **Live Consultation Room**: Private symptom messaging and simulated audio-video WebRTC panels.
- **Records Locker**: Clean listing of consult records with static PDF prescription downloads.
- **Feedback & Rating**: Multi-star reviews with dynamic doctor average re-calculations.

### 🩺 Doctor Portal
- **Activation Review**: Secure admin-locked pending state on initial onboarding.
- **Availability Planner**: Interactive weekday hour slot configuration desk.
- **Schedules Timeline**: Dashboard tracking pending, confirmed, and diagnosed consultations.
- **Prescription Compiler**: Medical dossier compiler (symptoms, diagnoses, and multi-row medicine dosage duration charts) converting records directly to PDF format.

### 🔑 Admin Portal
- **Applications Auditor**: Onboarding desk to review credentials, approve, or reject new doctor profiles.
- **Department Panel**: Analytics dashboard tracking active doctors and visit metrics across clinical units.
- **Financial Desk**: Operations ledger listing transaction IDs, patient emails, payment methods, and fees processed.

---

## ⚙️ Tech Stack

- **Frontend**: React 19 (Vite), React Router DOM v6, Tailwind CSS, Lucide Icons, Framer Motion, Socket.io Client, Axios.
- **Backend**: Node.js, Express.js (ES Modules), MongoDB & Mongoose.
- **Services**: Socket.io, PDFKit, Nodemailer.

---

## 📁 Workspace Directory Structure

```
mediease/
├── backend/
│   ├── config/             # DB configurations
│   ├── controllers/        # Express controllers (auth, appointments, prescriptions)
│   ├── middleware/         # Logger, auth guard, error interceptors, upload parser
│   ├── models/             # Mongoose schemas (User, Patient, Doctor, Payment, etc.)
│   ├── routes/             # REST route files (authRoutes, doctorRoutes, etc.)
│   ├── services/           # Nodemailer mock email & PDFKit script compiler
│   ├── sockets/            # Socket.io chat & WebRTC signals handler
│   ├── uploads/            # Local static directory hosting compiled PDFs
│   ├── .env                # Backend environment configuration
│   ├── server.js           # Server primary entry listener
│   └── test_api.js         # Endpoint integration testing suite
├── frontend/
│   ├── src/
│   │   ├── components/     # Common Navbar & Footer layouts
│   │   ├── context/        # AuthContext state provider
│   │   ├── hooks/          # useSocket custom real-time Hook
│   │   ├── pages/          # Home, Login, Signup, Details, and Dashboards
│   │   ├── routes/         # AppRoutes layout & role ProtectedRoute
│   │   ├── index.css       # Custom scrollbars, glass styles, animations
│   │   ├── main.jsx        # App mounting context
│   │   └── App.jsx         # Global routes wrapper
│   ├── .env                # Frontend environment configuration
│   ├── tailwind.config.js  # Custom Slate/Teal palettes mapping
│   └── postcss.config.js   # Tailwind compiler linkage
└── README.md               # Run guide and architecture overview
```

---

## 🚀 Setup & Execution Guide (From Scratch)

Ensure you have **Node.js** (v18+) and **MongoDB** installed and running on your local machine before proceeding.

### Step 1: Clone and Navigate to Directory
Open a terminal in the folder containing `backend` and `frontend`.

### Step 2: Configure Environment Variables

#### 1. Backend `.env` configuration:
Create `backend/.env` containing:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mediease
JWT_SECRET=mediease_super_secure_jwt_secret_2026
FRONTEND_URL=http://localhost:5173
EMAIL_USER=mock_email_user@gmail.com
EMAIL_PASS=mock_email_password
```

#### 2. Frontend `.env` configuration:
Create `frontend/.env` containing:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 3: Install Dependencies & Run Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start in development mode (hot reloading via nodemon):
   ```bash
   npm run dev
   ```

### Step 4: Install Dependencies & Run Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
4. Access the web app at [http://localhost:5173/](http://localhost:5173/).

### Step 5: Seeding & Signing In as Administrator

To onboard new doctors and inspect clinic transactions, you must be signed in as an administrator:
1. Open a terminal and navigate to the `backend/` directory.
2. Run the seeding script to populate the default administrator account inside your MongoDB instance:
   ```bash
   node seed_admin.js
   ```
3. Open your browser, navigate to the **Login Page** (`http://localhost:5173/login`) and enter the default admin credentials:
   - **Email**: `admin@mediease.com`
   - **Password**: `AdminPassword123`
4. The system will automatically detect the `admin` role, authorize the session, and redirect you to the **Admin Dashboard Console** (`http://localhost:5173/admin`).

---

## 🧪 Testing Backend Services (Automated Suite)

We have built a custom API verification script under `backend/test_api.js`. This script queries Mongoose directly to clean test users, registers accounts, verifies OTPs, logs in accounts, tests doctor approvals, schedules appointments, simulates payment completions, generates PDF prescriptions, and checks that files are served statically.

To run the automated endpoint validation suite:
1. Ensure the backend server is running in a terminal.
2. Open a separate terminal, navigate to the `backend/` directory, and run:
   ```bash
   node test_api.js
   ```

---

## 🛡️ Security Abstractions & Details

1. **Role-Based Guards**: Protected routes (`ProtectedRoute.jsx`) on the client and route level middleware checks (`protect, authorize('admin')`) on the backend prevent privilege escalation.
2. **Offline Data Storage**: OTP verification states are fully stored in MongoDB with 10-minute expiry timestamps.
3. **Data Integrity**: Patient and Doctor collections use a strict 1-to-1 ref mapping matching their base User schema IDs.
