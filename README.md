# IPTV Application (Dashboard & API)

A full-stack IPTV (Internet Protocol Television) management platform and Xtream Codes compatible streaming backend. This solution includes a modern **React 19 Admin Dashboard**, a robust **Node.js/Express API** with video processing capabilities, **Role-Based Access Control (RBAC)**, subscriber credential generation, and a **MongoDB** database, fully containerized with **Docker** and **Docker Compose**.

---

## 📑 Table of Contents

- [Architecture & System Overview](#-architecture--system-overview)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
  - [Role Hierarchy & Permissions](#role-hierarchy--permissions)
  - [Default Initial Accounts](#default-initial-accounts)
  - [Client Subscription Generation & Category Permissions](#client-subscription-generation--category-permissions)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Running the Project with Docker](#-running-the-project-with-docker)
  - [Step 1: Clone and Navigate](#step-1-clone-and-navigate)
  - [Step 2: Environment Configuration](#step-2-environment-configuration)
  - [Step 3: Build and Launch Containers](#step-3-build-and-launch-containers)
  - [Step 4: Verify Services](#step-4-verify-services)
  - [Step 5: Access the Application](#step-5-access-the-application)
- [Persistent Storage & Media Management](#-persistent-storage--media-management)
- [Useful Docker Commands](#-useful-docker-commands)
- [Xtream Codes Player Integration](#-xtream-codes-player-integration)
- [API Endpoints Summary](#-api-endpoints-summary)
- [Troubleshooting](#-troubleshooting)

---

## 🏗 Architecture & System Overview

```
                      ┌─────────────────────────────────────────┐
                      │              Client Browser             │
                      └────────────────────┬────────────────────┘
                                           │ HTTP (Port 3000)
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │        iptv_dashboard (Nginx)           │
                      │  - Serves React 19 Static SPA           │
                      │  - JWT Authentication & Role Guards     │
                      │  - Reverse proxy for /admin, /auth, etc.│
                      └────────────────────┬────────────────────┘
                                           │ proxy_pass (Port 8080)
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │           iptv_api (Node.js)            │
                      │  - Express 5 REST API & Xtream Engine   │
                      │  - JWT Auth & RBAC Security Middleware  │
                      │  - Category-Filtered Streaming Access   │
                      │  - FFmpeg metadata & video processing   │
                      │  - Multer video upload handler          │
                      └──────────────┬──────────────────┬───────┘
                                     │                  │
               MongoDB URI (Port 27017)│                  │ Local Volume / Bind Mount
                                     ▼                  ▼
┌──────────────────────────────────────────┐      ┌───────────────────────────────────┐
│           iptv_mongodb (7.0)             │      │        Media Storage Directory    │
│  - Persistent volume: mongo_data         │      │  - LIVE / VOD / SERIES streams    │
│  - Automatic healthchecks & seed users   │      │  - Volume: iptv_media_data        │
└──────────────────────────────────────────┘      └───────────────────────────────────┘
```

- **Frontend (`dashboard`)**: React 19 single-page application styled with Bootstrap 5 and AdminLTE. Features dedicated user management, subscriber credential generation, duration presets, category access selectors, and role-based route guards. Packaged inside a lightweight multi-stage Alpine Nginx container.
- **Backend (`api`)**: Node.js & Express server running on Node 20 slim with `ffmpeg` installed. Features JWT authentication, role guards (`super_admin`, `admin`, `client_user`), automated client credential generators, and Xtream Codes compatible endpoints (`player_api.php`, `get.php`, `xmltv.php`, `/live/`, `/movie/`, `/series/`, `/episode/`).
- **Database (`mongodb`)**: MongoDB 7.0 database configured with healthchecks (`mongosh` ping) and an automated initialization seeder creating default roles and credentials on first boot.
- **Media Volumes**: Dedicated volume storage for live streams, movies (VOD), and episodic TV series files.

---

## 👥 Role-Based Access Control (RBAC)

The system enforces a 3-tier Role-Based Access Control system:

### Role Hierarchy & Permissions

| Feature / Action | `super_admin` | `admin` | `client_user` |
|---|:---:|:---:|:---:|
| **Full Dashboard Access** | ✅ Yes | ❌ Restricted | ❌ No |
| **All Users Management** (View, Create, Edit, Delete, Promote/Demote) | ✅ Yes | ❌ Forbidden | ❌ No |
| **Live TV Management** (Categories, Streams, Uploads) | ✅ Yes | ❌ Hidden | ❌ No |
| **VOD Movies Management** (Categories, Streams, Uploads) | ✅ Yes | ❌ Hidden | ❌ No |
| **TV Series Management** (Shows, Seasons, Episodes, Uploads) | ✅ Yes | ❌ Hidden | ❌ No |
| **Client Subscribers Management** (`/client-users`) | ✅ Yes | ✅ Yes | ❌ No |
| **Generate Subscriber Credentials & M3U Links** | ✅ Yes | ✅ Yes | ❌ No |
| **Assign / Restrict Category Access** (Live, VOD, Series) | ✅ Yes | ✅ Yes | ❌ No |
| **Stream Video / Xtream Codes API Access** | ✅ Yes | ✅ Yes | ✅ Yes (filtered) |

#### 1. `super_admin`
- Full, unrestricted access to the entire application.
- Can create, edit, delete, and change roles of any user account (`super_admin`, `admin`, `client_user`).
- Manages all Live TV channels, VOD movies, and TV series/seasons/episodes.
- Can view and manage all client subscriber accounts.

#### 2. `admin`
- Operational management role focused entirely on client subscriptions.
- Can create and manage `client_user` subscriber accounts.
- Automatically generates subscription credentials (username, password).
- Sets subscription expiration dates and connection limits.
- Configures granular category permissions: decides exactly which Live TV, Movie, and TV Series categories each client is allowed to watch.
- **Strictly restricted**: Cannot modify admin or super admin accounts, cannot elevate user roles, and cannot access or modify media content (Live, VOD, Series management menus are completely hidden and API routes return `403 Forbidden`).

#### 3. `client_user`
- End-user subscriber who pays for the service.
- Does not have dashboard administrative access.
- Authenticates in IPTV player apps (IPTV Smarters, TiviMate, VLC, etc.) via Xtream Codes protocol (`player_api.php`, `get.php`, `/live/`, `/movie/`, `/series/`, `/episode/`).
- **Content filtering**: Stream playlists and API responses only expose categories and streams explicitly granted to their account. If a category is restricted or their subscription is expired/disabled, access is automatically blocked.

---

### Default Initial Accounts

On first boot, the system automatically checks and seeds three initial accounts:

| Role | Username | Password | Purpose |
|---|---|---|---|
| `super_admin` | `superadmin` | `superadmin123` | System Administrator with full privileges |
| `admin` | `admin` | `admin123` | Operational Admin for client subscriber management |
| `client_user` | `test` | `test` | Legacy / Demo subscriber account |

> [!TIP]
> The login page at `http://localhost:3000/login` includes quick **1-Click Demo Fill** buttons for testing both `superadmin` and `admin` roles instantly.

---

### Client Subscription Generation & Category Permissions

When creating or editing a subscriber account under **Subscriber Accounts** (`/client-users`):

1. **Subscriber Profile**:
   - **Name**: Full name of the subscriber.
   - **Phone Number**: Contact phone number.
   - **Email**: Notification/billing email address.
   - **Username & Password**: Click the **⚡ Auto-Generate** button to produce a clean, secure username (`user_xxxxxx`) and an 8-character password.
2. **Subscription Duration Presets**:
   - Click one of the quick preset buttons to automatically calculate expiration dates:
     - **1 Month** (+30 days)
     - **3 Months** (+90 days)
     - **6 Months** (+180 days)
     - **1 Year** (+365 days)
     - Or choose a custom date with the date picker.
3. **Category Permissions (Live, VOD & Series)**:
   - For each section (Live TV, VOD Movies, TV Series), admins can toggle:
     - **All Categories Allowed**: Grants access to all current and future categories.
     - **Custom Selection**: Select specific checkboxes to restrict the subscriber to only those categories.
4. **Credential Copy Modal**:
   - Upon creating an account, an instant popup allows one-click copying of:
     - Username and raw password.
     - Xtream Codes Server URL (`http://<host>:8080`).
     - Ready-to-use M3U playlist URL (`http://<host>:8080/get.php?username=...&password=...&type=m3u`).

---

## 📁 Project Structure

```text
IPTV-App/
├── .dockerignore                 # Excludes node_modules, git, and build caches from Docker
├── .env.example                  # Template configuration for environment variables
├── .env                          # Local active environment variables (created from .env.example)
├── docker-compose.yml            # Multi-service container orchestration specification
├── README.md                     # Project documentation
│
├── IPTV_Admin_Dashboard/         # Frontend Web Application (React SPA)
│   ├── Dockerfile                # Multi-stage build (Node 20 builder -> Nginx Alpine)
│   ├── nginx.conf                # Nginx reverse proxy and client-side routing config
│   ├── package.json              # Frontend dependencies (React 19, Axios, Bootstrap 5)
│   ├── public/                   # Public HTML entry and web assets
│   └── src/                      # Source code
│       ├── App.js                # Main router with protected role routes
│       ├── index.js              # Application root entrypoint
│       ├── context/              # Authentication context
│       │   └── AuthContext.js    # Global auth state, login/logout, role checks
│       ├── services/             # API client services
│       │   └── api.js            # Axios HTTP client with JWT interceptor & auto 401 handling
│       ├── components/           # Dashboard management interfaces
│       │   ├── Login.js          # AdminLTE login page with 1-click demo fills
│       │   ├── ProtectedRoute.js # Route guard enforcing authentication and roles
│       │   ├── Dashboard.js      # Main overview and role-aware statistics
│       │   ├── Users.js          # Super Admin all-users management & role promotion
│       │   ├── ClientUsers.js    # Admin/Super Admin subscriber generator & category permissions
│       │   ├── LiveCategories.js # Live TV category administration (Super Admin)
│       │   ├── LiveStreams.js    # Live TV stream management and file uploads (Super Admin)
│       │   ├── VodCategories.js  # VOD (Movies) category administration (Super Admin)
│       │   ├── VodStreams.js     # VOD stream management and file uploads (Super Admin)
│       │   ├── SeriesCategories.js # Series category administration (Super Admin)
│       │   ├── SeriesStreams.js  # Series show administration (Super Admin)
│       │   ├── SeasonsModal.js   # Seasons management popup modal
│       │   ├── EpisodesModal.js  # Episodes management & upload popup modal
│       │   ├── UploadProgressBar.js # Real-time file upload progress bar & stats
│       │   └── layout/           # Shared UI Layout
│       │       ├── AdminLayout.js
│       │       ├── Navbar.js     # Profile dropdown, active user badge, and logout
│       │       └── Sidebar.js    # Role-aware navigation menu (hides content from Admins)
│       └── styles/               # Stylesheets & AdminLTE themes
│
└── IPTV_API/                     # Backend Web API (Node.js/Express)
    ├── Dockerfile                # Node 20 slim image with FFmpeg installed
    ├── package.json              # Backend dependencies (Express 5, Mongoose, Multer, bcryptjs, jsonwebtoken)
    ├── server.js                 # Server entrypoint, Xtream endpoints, CORS & routing
    ├── config/
    │   ├── config.js             # Environment parsing, DB URIs, and media directories
    │   └── initSuperAdmin.js     # Automated seeder for default superadmin, admin, and test users
    ├── middleware/
    │   └── authMiddleware.js     # JWT token verification, requireSuperAdmin, requireAdminOrSuperAdmin
    ├── controllers/              # Route controllers & upload processors
    │   ├── userController.js     # User CRUD, role promotion, credential generation, category fetch
    │   ├── adminController.js    # Live categories & streams controller
    │   ├── adminVodController.js # VOD categories & streams controller
    │   ├── adminSeriesController.js # Series categories & shows controller
    │   ├── adminSeasonController.js # Seasons controller
    │   └── adminEpisodeController.js# Episode controller
    ├── models/                   # Mongoose schemas
    │   ├── User.js               # User schema (roles, credentials, subscriber metadata, category rules)
    │   ├── Counter.js            # Auto-incrementing identifier counter
    │   ├── LiveCategory.js       # Live category schema
    │   ├── LiveStream.js         # Live stream schema
    │   ├── VodCategory.js        # VOD category schema
    │   ├── VodStream.js          # VOD stream schema
    │   ├── SeriesCategory.js     # Series category schema
    │   ├── SeriesStream.js       # Series show schema
    │   ├── Season.js             # Series season schema
    │   └── Episode.js            # Series episode schema
    └── routes/                   # API route definitions
        ├── userRoutes.js         # /auth and /admin/users routes
        ├── adminRoutes.js        # /admin routes (Live) [Protected: Super Admin]
        ├── VodRoutes.js          # /admin-vod routes (VOD) [Protected: Super Admin]
        ├── SeriesRoutes.js       # /admin-series routes (Series) [Protected: Super Admin]
        ├── SeasonRoutes.js       # /admin-seasons routes (Seasons) [Protected: Super Admin]
        └── EpisodeRoutes.js      # /admin-episodes routes (Episodes) [Protected: Super Admin]
```

---

## 📋 Prerequisites

Before running the application, make sure you have the following installed on your machine:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Windows, macOS, or Linux)
- **Docker Compose v2** (bundled by default with Docker Desktop; verify with `docker compose version`)

> [!NOTE]
> Ensure Docker Desktop is launched and running before executing compose commands.

---

## 🚀 Running the Project with Docker

Follow these step-by-step instructions to get the complete stack up and running in minutes.

### Step 1: Clone and Navigate

Open your terminal or PowerShell and change directory into the project root:

```bash
cd /path/to/IPTV-App
```

### Step 2: Environment Configuration

Create a `.env` file in the project root by copying the template file:

**On Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**On Linux / macOS:**
```bash
cp .env.example .env
```

#### Available Environment Settings

Open `.env` to review or modify defaults:

| Variable | Default Value | Description |
|---|---|---|
| `API_PORT` | `8080` | Host port exposed for the Node.js API backend |
| `FRONTEND_PORT` | `3000` | Host port exposed for the React Admin Dashboard |
| `MONGODB_PORT` | `27017` | Host port exposed for the MongoDB database |
| `REACT_APP_API_URL` | *(empty)* | Optional custom API URL. When left empty, the React frontend automatically leverages the Nginx reverse proxy or dynamic hostname detection. |

### Step 3: Build and Launch Containers

Build the images and run all containers in detached (background) mode:

```bash
docker compose up --build -d
```

Docker Compose will perform the following actions:
1. Spin up the **MongoDB 7.0** database container and initialize its healthcheck.
2. Build the **Backend image** with Node 20 and FFmpeg, waiting for MongoDB to become healthy before starting.
3. Automatically seed the initial **Super Admin**, **Admin**, and **Demo Client** accounts.
4. Build the **React Frontend production bundle** and package it into an Nginx Alpine container.
5. Establish the shared internal bridge network (`iptv_network`) for seamless inter-container communication.

### Step 4: Verify Services

Check that all three containers are running properly:

```bash
docker compose ps
```

You should see output similar to:

```text
NAME             IMAGE                  COMMAND                  SERVICE     CREATED         STATUS                   PORTS
iptv_mongodb     mongo:7.0              "docker-entrypoint.s…"   mongodb     1 minute ago    Up 1 minute (healthy)    0.0.0.0:27017->27017/tcp
iptv_api         iptv-app-api           "docker-entrypoint.s…"   api         1 minute ago    Up 1 minute              0.0.0.0:8080->8080/tcp
iptv_dashboard   iptv-app-dashboard     "/docker-entrypoint.…"   dashboard   1 minute ago    Up 1 minute              0.0.0.0:3000->80/tcp
```

### Step 5: Access the Application

Once the containers are up, open your web browser or IPTV client:

- **Admin Dashboard**: [http://localhost:3000](http://localhost:3000) (Log in with `superadmin` / `superadmin123` or `admin` / `admin123`)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **MongoDB Database**: `localhost:27017` (connect using MongoDB Compass or mongosh)

---

## 💾 Persistent Storage & Media Management

### Default Docker Volumes
By default, Docker Compose persists all databases and uploaded video files in Docker named volumes:
- `mongo_data`: Stores MongoDB database collections, users, and indices.
- `iptv_media_data`: Stores media files uploaded via the dashboard (`/app/data` containing `LIVE/`, `VOD/`, and `SERIES/` subdirectories).

### Using a Local Host Directory for Media
If you want to store uploaded media files directly in a folder on your host machine (for easy direct access or backing up large video files):

1. Open `docker-compose.yml`.
2. Locate the `api` service under `volumes:`.
3. Comment out `iptv_media_data:/app/data` and uncomment the bind mount:
   ```yaml
       volumes:
         # - iptv_media_data:/app/data
         - ./data:/app/data
   ```
4. Restart the containers:
   ```bash
   docker compose up -d
   ```

---

## 🛠 Useful Docker Commands

### View Logs

To view streaming logs for all running services:
```bash
docker compose logs -f
```

To view logs for a specific container:
```bash
# Backend API logs
docker compose logs -f api

# Admin Dashboard (Nginx) logs
docker compose logs -f dashboard

# MongoDB logs
docker compose logs -f mongodb
```

### Restart Services

```bash
# Restart entire stack
docker compose restart

# Restart only API service
docker compose restart api
```

### Rebuild After Code Changes

If you modify source code in `IPTV_API` or `IPTV_Admin_Dashboard`:
```bash
docker compose up --build -d
```

### Shell Access Inside Containers

To execute commands inside a container:

```bash
# Open shell inside backend API container
docker compose exec api sh

# Open shell inside Nginx dashboard container
docker compose exec dashboard sh

# Open interactive MongoDB shell (mongosh)
docker compose exec mongodb mongosh
```

### Stopping the Application

To safely stop all containers while preserving data:
```bash
docker compose down
```

To stop containers **and delete all volumes** (wipes database and media uploads):
```bash
docker compose down -v
```

---

## 📺 Xtream Codes Player Integration

The API backend is compatible with Xtream Codes IPTV players (such as IPTV Smarters, TiviMate, VLC, and hardware receivers like Starsat, Samsat, and EcoSat).

### Authentication & Subscriber Access
Any user with role `client_user` (or admin/superadmin) can authenticate in an IPTV player using their credentials.

- **Username**: Subscriber username (e.g. `test` or generated `user_xxxxxx`)
- **Password**: Subscriber password

### Player Connection Details

- **Server URL**: `http://<YOUR_IP_OR_HOST>:8080` (or `http://<YOUR_IP_OR_HOST>:3000` through Nginx)
- **Username**: Subscriber username
- **Password**: Subscriber password

### Direct Playlist and EPG Links

- **M3U Playlist**:
  ```text
  http://localhost:8080/get.php?username=<USER>&password=<PASS>&type=m3u
  ```
- **EPG XMLTV Guide**:
  ```text
  http://localhost:8080/xmltv.php?username=<USER>&password=<PASS>
  ```
- **Xtream Player API**:
  ```text
  http://localhost:8080/player_api.php?username=<USER>&password=<PASS>
  ```

### Dynamic Category Filtering
When a client connects to `player_api.php` or requests an M3U playlist:
- If their account has specific categories assigned (`allLiveCategories: false`, etc.), the API only returns categories and streams that they are authorized to view.
- Direct video streaming URLs (`/live/...`, `/movie/...`, `/series/...`, `/episode/...`) strictly verify category permissions before streaming video chunks.
- Expired or disabled accounts receive an immediate authorization failure.

---

## 🔌 API Endpoints Summary

### Authentication & User Management Endpoints

| Method | Endpoint | Protected Role | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticates user, returns JWT token & user profile |
| `GET` | `/auth/me` | Authenticated | Returns current authenticated user profile |
| `GET` | `/admin/users` | `admin`, `super_admin` | Lists users (Admins receive only `client_user` list) |
| `POST` | `/admin/users` | `admin`, `super_admin` | Creates a new user (Admins restricted to `client_user`) |
| `PUT` | `/admin/users/:id` | `admin`, `super_admin` | Updates a user (Admins can only edit `client_user`) |
| `DELETE` | `/admin/users/:id` | `admin`, `super_admin` | Deletes a user (Admins can only delete `client_user`) |
| `GET` | `/admin/users/categories` | `admin`, `super_admin` | Returns all Live, VOD, and Series categories for assignment |
| `GET` | `/admin/users/generate-credentials` | `admin`, `super_admin` | Generates random unique username & secure password |

### Xtream Streaming Endpoints
- `GET /player_api.php` (Xtream Codes API: actions `get_live_categories`, `get_live_streams`, `get_vod_categories`, `get_vod_streams`, `get_series_categories`, `get_series`, `get_series_info`)
- `GET /get.php` (M3U / M3U_PLUS playlist generation)
- `GET /xmltv.php` (EPG XMLTV Guide)
- `GET /live/:username/:password/:stream_id` (or with extension `.:ext`)
- `GET /movie/:username/:password/:vod_id` (or with extension `.:ext`)
- `GET /series/:username/:password/:series_id` (or with extension `.:ext`)
- `GET /episode/:username/:password/:episode_id` (or with extension `.:ext`)

### Administrative Media Endpoints (Super Admin Only)
- **Live Streams**:
  - `GET /admin/live-categories` | `POST /admin/create-live-category`
  - `GET /admin/live-streams` | `POST /admin/create-live-stream`
- **VOD (Movies)**:
  - `GET /admin-vod/vod-categories` | `POST /admin-vod/create-vod-category`
  - `GET /admin-vod/vod-streams` | `POST /admin-vod/create-vod-stream`
- **Series & Episodes**:
  - `GET /admin-series/series-categories` | `POST /admin-series/create-series-category`
  - `GET /admin-series/series-streams` | `POST /admin-series/create-series-stream`
  - `GET /admin-seasons/seasons` | `POST /admin-seasons/create-season`
  - `GET /admin-episodes/episodes` | `POST /admin-episodes/create-episode`

---

## ❓ Troubleshooting

### 1. Port Conflict (`Bind for 0.0.0.0:8080 failed: port is already allocated`)
If another application (like a local web server or another MongoDB instance) is using ports `3000`, `8080`, or `27017`:
- Change the host port mapping in `.env`:
  ```env
  API_PORT=8085
  FRONTEND_PORT=3005
  MONGODB_PORT=27018
  ```
- Re-run `docker compose up -d`.

### 2. MongoDB Container Health Check Failing
If the API container fails to start because MongoDB is not ready:
- Check MongoDB logs: `docker compose logs mongodb`
- Ensure Docker has sufficient memory and storage assigned in Docker Desktop Settings.

### 3. File Upload Limitations or Timeouts
Large video files (.mp4, .ts, .m3u8) are proxied through Nginx:
- Nginx is pre-configured with `client_max_body_size 0;` and extended read/send timeouts (`86400s`).
- If using an external reverse proxy (like Cloudflare or custom Nginx), ensure similar upload size limits are set.

### 4. Admin Role Escalation Prevention
If an `admin` attempts to create another admin, assign a role, or delete another administrative account:
- The backend middleware automatically enforces `403 Forbidden: Admins can only manage client users`.
- The dashboard frontend selectively exposes only permissible controls based on user role.

### 5. Cache Issues When Updating Source Code
If changes made to React components or Express routes do not appear after starting:
```bash
docker compose build --no-cache
docker compose up -d
```

---

## 📄 License

This project is licensed under the ISC License. Designed for personal and educational use.
