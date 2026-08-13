# CivicFix - Local Civic Issue Reporting & Resolution Platform

**CivicFix** is a modern, production-style civic technology web application designed to empower citizens in local areas across **Andhra Pradesh, India** to report civic infrastructure problems (such as potholes, open manholes, garbage dumping, broken streetlights, water leakage, and drainage issues) directly to responsible **Grama & Ward Sachivalayams**.

---

## 🌟 Core Application Flow

```
[ Citizen Snap Photo ] ➔ [ GPS Coordinates Captured ] ➔ [ Auto-Assigned to Responsible Sachivalayam ]
                                                                       │
[ Citizen Confirms Resolution ] ◄─ [ Official Fixes & Uploads After Photo ] ◄─ [ Official Reviews & Visits ]
```

---

## 🔐 Pre-configured Demo Credentials

Use these accounts to instantly test all user personas (Citizen, Official, Admin):

| Role | Email | Password | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@civicfix.in` | `password123` | Report problems, test GPS/Camera, view Before/After slider, confirm/reopen issues |
| **Sachivalayam Official** | `official.patamata@civicfix.in` | `password123` | Manage complaints assigned to Patamata Ward 14 Sachivalayam, upload resolution proof |
| **State Admin** | `admin@civicfix.in` | `password123` | View state analytics, hotspot heatmaps, reassign complaints, register Sachivalayams |

*Note: You can also use the **Demo Accounts Quick-Switcher** dropdown in the top navbar to log in with a single click.*

---

## ✨ Key Features & Architecture

### 1. 📸 WebRTC Camera & Gallery Capture
- Direct browser camera access with live HTML5 video stream and canvas snapshot capture.
- Automatic image compression for low-bandwidth rural mobile networks.
- Gallery file upload fallback.

### 2. 📍 GPS Pinpoint & Reverse Geocoding
- Automatic `navigator.geolocation` capture with accuracy metrics (latitude, longitude, accuracy).
- Reverse geocoding for human-readable street addresses in Andhra Pradesh.
- Interactive Leaflet map with fine-tuning pin adjustment.

### 3. 🏛️ Automatic Sachivalayam Jurisdiction Routing (`findResponsibleSachivalayam`)
- Bounding-box polygon matching against registered Grama & Ward Sachivalayams (e.g., *Patamata Ward 14*, *Suryaraopet Grama 08*, *Gajuwaka Ward 03*, *Tirupati Town*, *Brodipet Guntur*).
- Haversine distance fallback calculation for nearest available authority.

### 4. 🎛️ Interactive Before/After Visual Proof Slider
- Side-by-side draggable image slider comparing the **BEFORE** citizen photo with the official **AFTER** resolution photo proof.

### 5. 👍 Citizen Confirmation & Reopen Lifecycle (Requirement #13)
- When official marks an issue as `RESOLVED`, citizen inspects proof and answers: **"Was this problem actually solved?"**
  - **YES, SOLVED**: Issue officially closed.
  - **NO, STILL A PROBLEM**: Status updates to `REOPENED` with alert sent to official and admin.

### 6. ⚠️ Duplicate Detection & Upvoting
- Detects existing complaints within ~150 meters of the same category and prompts citizen to upvote existing report instead of creating duplicates.

### 7. 📊 State Admin Command Center
- Analytics dashboard featuring key performance indicators, category distribution, district breakdowns, problem hotspot heatmaps, and Sachivalayam registration CRUD.

---

## 🛠️ Technology Stack

- **Frontend**: React 19 (Vite) + Tailwind CSS + Lucide Icons + Leaflet Maps
- **Backend**: Node.js + Express.js API Server
- **Database**: SQLite with schema migrations and seed data
- **File Storage**: Local persistent file upload abstraction (`/uploads`)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ or v24+
- **npm**: v9+

### Running the Application

1. **Start Backend API Server**:
   ```bash
   cd server
   npm install
   npm run start
   ```
   *The backend will run on `http://localhost:5000` and automatically initialize the SQLite database (`civicfix.db`) with demo data.*

2. **Start Frontend Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *Open `http://localhost:3000` in your web browser.*

---

## 📁 Database Schema Highlights

- `users`: User identity, password hash, role (`CITIZEN`, `OFFICIAL`, `ADMIN`), phone, `sachivalayam_id`.
- `sachivalayams`: Name, jurisdiction boundaries (`min_lat`, `max_lat`, `min_lng`, `max_lng`), center lat/lng, official contact person.
- `complaints`: Tracking ID, category, original photo URL, resolution photo URL, GPS lat/lng, address, priority, status (`SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REOPENED`, `REJECTED`), resolution remarks.
- `complaint_status_history`: Immutable log of every status change, timestamp, and remark.
