# CivicPulse (MERN Implementation) — Technical Project Context
*Simplified & Beginner-Friendly Architecture (Preserving Full Core Functionality)*

This document is the **single technical source of truth** for the MERN reimplementation of the Smart Governance Platform (CivicPulse). It preserves 100% of the platform's core functional capabilities while implementing a beginner-friendly, clean, and real-world civic architecture.

---

## 1. Technology Stack

### Frontend (Beginner-Friendly, Green Civic Design)
- **Framework**: React 18+ (SPA)
- **Build Tool**: Vite
- **Language**: JavaScript (ES Modules, JSX)
- **Routing**: `react-router-dom` (v6+)
- **HTTP Client**: `axios`
- **UI & Layout**: Standard **Bootstrap 5** (classes and responsive grid system)
- **Styling**: Normal CSS (`src/styles/index.css`) for subtle green identity accents and readable custom styling
- **Maps**: `leaflet` + `react-leaflet` (OpenStreetMap standard & Esri satellite tiles) + HTML5 Geolocation API
- **Icons**: `lucide-react` (or standard Bootstrap SVG icons)

#### Strict Frontend Prohibitions:
- **NO** Tailwind CSS
- **NO** Material UI, Chakra UI, Ant Design, or Bootstrap React component wrappers
- **NO** Styled Components or CSS-in-JS
- **NO** Complex animation libraries or decorative UI blobs
- **NO** Purple/blue AI gradients, glowing cards, glassmorphism, or generic SaaS landing templates

### Backend
- **Runtime**: Node.js (v18+ LTS)
- **Framework**: Express.js (v4.x, ES Modules)
- **Database ODM**: Mongoose (v8.x)
- **Authentication**: `jsonwebtoken` (JWT) + `bcryptjs` (Password hashing)
- **CORS & Environment**: `cors`, `dotenv`
- **Body Parser Limit**: 10 MB (supports optional Base64 photo payloads)

### Database
- **Database Engine**: MongoDB (v6.0+)
- **Data Modeling**: Mongoose Schemas with strict validation, indexes, and embedded audit subdocuments

---

## 2. Design Identity: Real Civic Service Platform

### Visual Identity
- **Primary Color**: Green (`#198754` / Bootstrap `btn-success`, `text-success`, `bg-success`)
- **Dark Green**: `#0f5132` (Accents, brand seal, dark headers)
- **Light Green**: `#d1e7dd` / `#e8f5e9` (Badges, alert backgrounds, highlight panels)
- **Background**: Soft clean white/tinted off-white (`#f7faf7` / `#ffffff`)
- **Text**: Dark gray / black (`#212529`, `#495057`)
- **Neutral Grays**: `#e9ecef`, `#ced4da` for borders and table dividers

### Real Civic Aesthetics (Anti-AI Generated Rule)
CivicPulse must look like an authentic, functional public-sector service developed by a human software engineer:
- Clean Bootstrap cards (`card`, `card-header`, `card-body`)
- Responsive data tables (`table`, `table-hover`, `table-responsive`)
- Clear status badges (`badge bg-success`, `badge bg-warning text-dark`, `badge bg-info`, `badge bg-danger`)
- Straightforward Bootstrap forms with explicit `<label>` tags and clear validation
- Simple vertical complaint timelines
- Plain, readable section titles with green accent bars (`border-start border-4 border-success ps-2`)
- Zero gimmicky animations, neon borders, or artificial marketing text

---

## 3. Project Structure

```text
CIIVIC_MERN/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js      # Register, login, me, profile
│   │   │   ├── complaintController.js # CRUD, status update, verify, impact, related
│   │   │   ├── departmentController.js# Department list, create, edit, deactivate
│   │   │   ├── dashboardController.js # Role summaries & metrics
│   │   │   ├── notificationController.js # Notifications list & mark-read
│   │   │   └── contactController.js   # Public contact form submission
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT verification & RBAC guard (authorize)
│   │   │   └── errorHandler.js        # Centralized JSON error response handler
│   │   ├── models/
│   │   │   ├── User.js                # User accounts & roles
│   │   │   ├── Department.js          # Departments
│   │   │   ├── Complaint.js           # Complaints with embedded timeline history
│   │   │   ├── Notification.js        # In-app notifications
│   │   │   └── ContactMessage.js      # Public contact inquiries
│   │   ├── utils/
│   │   │   ├── complaintHelpers.js    # Keyword routing, auto-assignment, India geofence, scoring
│   │   │   └── seedData.js            # Default demo accounts, departments & complaints
│   │   ├── app.js                     # Express app configuration
│   │   └── server.js                  # Entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Clean Bootstrap navbar with role-aware links
│   │   │   ├── Footer.jsx             # Simple clean civic footer
│   │   │   ├── Sidebar.jsx            # Portal sidebar for portal layouts
│   │   │   ├── PortalLayout.jsx       # Wrapper with Sidebar + Topbar + Container
│   │   │   ├── StatusBadge.jsx        # Standard Bootstrap badge by status
│   │   │   ├── Timeline.jsx           # Clean vertical progress timeline
│   │   │   ├── MapPicker.jsx          # Leaflet map picker + GPS button + Satellite toggle
│   │   │   └── MapViewer.jsx          # Read-only Leaflet coordinate viewer
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Simple React Context for login/logout/user state
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── Home.jsx           # Intro, "Report. Track. Resolve.", How it works
│   │   │   │   ├── About.jsx          # Simple civic mission and department overview
│   │   │   │   ├── Contact.jsx        # Service desk details + simple inquiry form
│   │   │   │   ├── RoleChoice.jsx     # Workspace selector (Citizen, Staff, Admin)
│   │   │   │   └── Auth.jsx           # Simple login & registration forms
│   │   │   ├── citizen/
│   │   │   │   ├── CitizenDashboard.jsx # Stat cards + Recent complaints table + Report button
│   │   │   │   ├── NewComplaint.jsx   # Form + MapPicker + optional photo upload (<5MB)
│   │   │   │   ├── MyComplaints.jsx   # Filterable list of citizen's complaints
│   │   │   │   └── CitizenComplaintDetail.jsx # Details, MapViewer, Timeline, Verification
│   │   │   ├── staff/
│   │   │   │   ├── StaffDashboard.jsx # Assigned, In Progress, Resolved, Overdue stats
│   │   │   │   ├── AssignedWorkload.jsx # Work queue table with search & filter
│   │   │   │   └── StaffComplaintDetail.jsx # Status update form, remarks, resolution, timeline
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx # Platform KPIs, status breakdown, recent list
│   │   │   │   ├── AllComplaints.jsx  # All complaints with department & status filter
│   │   │   │   ├── AdminComplaintDetail.jsx # Oversight view + Delete complaint button
│   │   │   │   ├── Departments.jsx    # Department table + Add/Edit Modal
│   │   │   │   ├── Users.jsx          # User directory & Staff directory
│   │   │   │   └── Reports.jsx        # Resolution rate %, Active workload, Department bars
│   │   │   └── shared/
│   │   │       ├── Notifications.jsx  # Inbox list with unread markers
│   │   │       ├── Profile.jsx        # Name and email edit form
│   │   │       └── NotFound.jsx       # 404 page
│   │   ├── services/
│   │   │   └── api.js                 # Axios instance with Authorization Bearer header
│   │   ├── utils/
│   │   │   ├── geoValidator.js        # India boundary polygon check
│   │   │   └── formatters.js          # Date, coordinate, and status formatting
│   │   ├── styles/
│   │   │   └── index.css              # Custom green accents, body bg, timeline CSS
│   │   ├── App.jsx                    # React Router routes & ProtectedRoute setup
│   │   └── main.jsx                   # React DOM render with Bootstrap CSS imported
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── PROJECT_CONTEXT.md
```

---

## 4. Frontend Implementation & Code Style Rules

### Beginner-Friendly Code Standards
- **Simple React Idioms**: Build components using clear, standard React hooks: `useState`, `useEffect`, and simple `props`.
- **Avoid Complex Abstractions**: No nested custom hook chains, no Redux, no MobX, no complex HOCs.
- **Explainability**: Code should be readable and easily explainable in a technical interview.
- **Normal Event Handlers**: Standard `onSubmit`, `onChange`, `onClick` functions.
- **Direct Axios Calls**: Clean `async`/`await` functions inside components or through a simple `api.js` helper.

### Bootstrap Layout & Components
- Use standard Bootstrap 5 containers and grid: `container`, `row`, `col`, `col-md-6`, `col-lg-4`.
- Use Bootstrap spacing and flex utilities: `mt-3`, `mb-4`, `p-3`, `d-flex`, `justify-content-between`, `gap-2`.
- Form inputs: `<label className="form-label">`, `<input className="form-control">`, `<select className="form-select">`.
- Tables: `<div className="table-responsive"><table className="table table-hover align-middle">`.
- Buttons: `btn btn-success`, `btn btn-outline-success`, `btn btn-secondary`, `btn btn-danger`.
- Alerts & Badges: `alert alert-danger`, `alert alert-success`, `badge bg-success`, `badge bg-secondary`.

### Normal Custom CSS (`index.css`)
Keep custom CSS minimal and focused solely on brand identity:
```css
/* CivicPulse Custom Brand Accents */
body {
  background-color: #f7faf7;
  color: #212529;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.brand-green {
  color: #198754;
}

.bg-brand-dark {
  background-color: #0f5132;
}

.section-title {
  border-left: 4px solid #198754;
  padding-left: 12px;
  margin-bottom: 1.25rem;
}

/* Simple Vertical Timeline */
.timeline-list {
  list-style: none;
  padding-left: 20px;
  position: relative;
  border-left: 2px solid #dee2e6;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
}

.timeline-dot {
  position: absolute;
  left: -27px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #198754;
}

/* Leaflet Map Height */
.map-container {
  height: 350px;
  width: 100%;
  border-radius: 6px;
  border: 1px solid #ced4da;
}
```

---

## 5. Database Architecture (MongoDB + Mongoose)

### 1. `User` Schema
```javascript
{
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['CITIZEN', 'STAFF', 'ADMIN'], default: 'CITIZEN' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  createdAt: { type: Date, default: Date.now }
}
```

### 2. `Department` Schema
```javascript
{
  name: { type: String, required: true, unique: true, trim: true, minlength: 2 },
  description: { type: String, required: true, trim: true, minlength: 5 },
  active: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, default: Date.now }
}
```

### 3. `Complaint` Schema (with Embedded History)
```javascript
{
  reference: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 3 },
  category: { type: String, required: true, trim: true, minlength: 2 },
  description: { type: String, required: true, trim: true, minlength: 10 },
  location: { type: String, required: true, trim: true },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  photoData: { type: String, default: null }, // Base64 data URL
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'CLOSED', 'REJECTED'],
    default: 'ASSIGNED'
  },
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  remarks: { type: String, default: null },
  resolution: { type: String, default: null },
  verificationStatus: {
    type: String,
    required: true,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },
  verifiedAt: { type: Date, default: null },
  reopenReason: { type: String, default: null },
  history: [
    {
      eventType: {
        type: String,
        required: true,
        enum: ['CREATED', 'ASSIGNED', 'STATUS_CHANGED', 'RESOLUTION_CREATED', 'RESOLVED', 'VERIFIED', 'REOPENED', 'CLOSED']
      },
      description: { type: String, required: true },
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      performedByName: { type: String, default: null },
      eventAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}
```

### 4. `Notification` Schema
```javascript
{
  message: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
  read: { type: Boolean, required: true, default: false },
  createdAt: { type: Date, default: Date.now, index: true }
}
```

### 5. `ContactMessage` Schema
```javascript
{
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, lowercase: true, trim: true },
  subject: { type: String, required: true, trim: true, minlength: 3 },
  message: { type: String, required: true, trim: true, minlength: 10 },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 6. Authentication & Authorization Architecture

- **Password Security**: Standard `bcryptjs` with 10 salt rounds.
- **Stateless JWT**: `HS256` token with payload `{ id, role, email, name }` sent via `Authorization: Bearer <token>`.
- **Public Registration**: Accepts only `CITIZEN` or `STAFF` (`departmentId` required for staff). Rejects `ADMIN` creation.
- **Role-Based Guards**:
  - `protect`: Verifies JWT, injects `req.user`.
  - `authorize(...roles)`: Blocks unpermitted roles with `403 Forbidden`.
- **Resource Ownership Scoping**:
  - Citizens see only their own complaints.
  - Staff see only assigned complaints (or unassigned in their department).
  - Only the complaint author can submit resolution verification.
  - Profile editing is restricted to own name and email.

---

## 7. API Architecture

Base URL: `/api`

### Auth & Users
- `POST /auth/register` (Public) — Register citizen or staff
- `POST /auth/login` (Public) — Sign in, returns `{ token, user }`
- `GET /auth/me` (Protected) — Current session user
- `GET /users/profile` (Protected) — User profile
- `PUT /users/profile` (Protected) — Update own name & email
- `GET /users` (Admin) — Directory of users (query: `search`, `role`)

### Departments
- `GET /departments` (Public) — List active departments
- `POST /departments` (Admin) — Create department
- `PUT /departments/:id` (Admin) — Update department
- `DELETE /departments/:id` (Admin) — Deactivate department

### Complaints
- `POST /complaints` (Citizen) — Submit complaint (auto-routes & auto-assigns)
- `GET /complaints/my` (Citizen) — Citizen complaints list (query: `search`, `status`)
- `GET /complaints/assigned` (Staff) — Assigned complaints (query: `search`, `status`)
- `GET /complaints` (Admin) — Platform oversight (query: `search`, `status`, `departmentId`)
- `GET /complaints/:id` (Scoped) — Complaint detail with timeline
- `PUT /complaints/:id` (Staff/Admin) — Update status, remarks, resolution
- `POST /complaints/:id/verify` (Citizen Owner) — Verify resolution (`accepted: true` $\rightarrow$ `CLOSED`, `accepted: false` $\rightarrow$ `REOPENED` + reason)
- `DELETE /complaints/:id` (Admin) — Permanent deletion
- `GET /complaints/:id/impact-score` (Scoped) — Explainable civic impact score
- `GET /complaints/:id/related` (Staff/Admin) — Top similar complaints ($\ge 50\%$)

### Analytics & Dashboards
- `GET /dashboard/citizen` (Citizen) — Metrics & recent 4 complaints
- `GET /dashboard/staff` (Staff) — Workload stats, overdue count, recent 4 complaints
- `GET /dashboard/admin` (Admin) — Total users, complaints, resolved cases, department breakdown, status mix
- `GET /analytics/emerging-issues` (Staff/Admin) — Statistically detected issue clusters

### Notifications & Contact
- `GET /notifications` (Protected) — Notifications list
- `PUT /notifications/:id/read` (Protected) — Mark notification read
- `POST /contact` (Public) — Submit contact message
- `GET /healthz` (Public) — Health liveness check

---

## 8. Preserved Core Business Rules & Algorithms

1. **Keyword Auto-Routing Engine**:
   - `electric|power|street ?light` $\rightarrow$ "Electricity"
   - `water|leak|tap|supply` $\rightarrow$ "Water Supply"
   - `waste|garbage|sanit|clean` $\rightarrow$ "Sanitation"
   - `health|hospital|clinic|medical` $\rightarrow$ "Public Health"
   - `traffic|transport|signal|bus` $\rightarrow$ "Roads & Transport"
   - `road|pothole|drain|drainage|storm|flood` $\rightarrow$ "Public Works"
   - Fallback: citizen-selected department.
2. **Least-Loaded Staff Auto-Assignment**:
   - Assigns to the active staff member in the department with `min(active complaints)` (`status NOT IN ['RESOLVED', 'CLOSED', 'REJECTED']`).
3. **Territorial Boundary Geofencing (India Boundary Polygon)**:
   - 44-point polygon ($6.0^\circ \le \text{lat} \le 37.5^\circ$, $68.0^\circ \le \text{lon} \le 97.5^\circ$) with ray-casting point-in-polygon algorithm.
4. **Complaint Lifecycle State Transitions**:
   - `ASSIGNED` $\rightarrow$ `IN_PROGRESS`
   - `REOPENED` $\rightarrow$ `IN_PROGRESS`
   - `IN_PROGRESS` $\rightarrow$ `RESOLVED` (requires `resolution` note) or `REJECTED`
   - Verification: `RESOLVED` $\rightarrow$ `CLOSED` (accepted) or `REOPENED` (rejected + reason $\ge 5$ chars).
5. **Explainable Impact Scoring**:
   - Weights: Severity (30), Affected Citizens (25), Recurrence (20), Age (15), Location (10) totaling 100.
6. **Complaint Similarity Detection**:
   - Category match + token Jaccard overlap ($>3$ chars) $\times 50\%$ + Haversine distance ($\le 2\text{ km} \rightarrow +30\%$) + time window ($\le 30\text{ days} \rightarrow +20\%$). Threshold $\ge 50\%$.
7. **Emerging Issues Trend Detector**:
   - Rolling 14-day window comparing recent (last 7 days) vs previous (days 8–14). Flags `HIGH`, `MEDIUM`, or `LOW` risk. Threshold: recent $\ge 3$ and increase $\ge 25\%$.

---

## 9. Environment Variables

### Backend (`backend/.env`)
```bash
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/civicpulse
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=8h
CLIENT_ORIGIN=http://localhost:5173
SEED_DEMO=true
```

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:5000/api
```

---

## 10. Mandatory Development Rules

1. **Do not change architecture without approval.**
2. **Do not create duplicate models.**
3. **Do not create duplicate routes.**
4. **Do not create duplicate components.**
5. **Reuse existing code where appropriate.**
6. **Do not modify unrelated working functionality.**
7. **Do not install unnecessary packages** (strictly follow the approved beginner-friendly frontend stack).
8. **Do not invent business rules** (all algorithms must match the reference implementation).
9. **Do not implement future features automatically.**
10. **Do not restructure the project without approval.**
11. **Do not modify the reference project (`C:\Users\bhara\OneDrive\Desktop\original-project`).**
12. **Do not claim that something is tested unless it was actually tested.**
13. **Step-by-step implementation process**:
    - Step 1: Read `PROJECT_CONTEXT.md`.
    - Step 2: Check existing components before creating new ones.
    - Step 3: Reuse existing styles/components where possible.
    - Step 4: Implement only the requested page/feature.
    - Step 5: Test it.
    - Step 6: Stop. Do not implement the entire frontend at once.
