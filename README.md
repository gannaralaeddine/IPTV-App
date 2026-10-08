# IPTV Application (Dashboard & API)

A full-stack IPTV (Internet Protocol Television) management platform and Xtream Codes compatible streaming backend. This solution includes a modern **React 19 Admin Dashboard**, a robust **Node.js/Express API** with video processing capabilities, and a **MongoDB** database, fully containerized with **Docker** and **Docker Compose**.

---

## 📑 Table of Contents

- [Architecture & System Overview](#-architecture--system-overview)
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
                      │  - Reverse proxy for /admin, /live, etc.│
                      └────────────────────┬────────────────────┘
                                           │ proxy_pass (Port 8080)
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │           iptv_api (Node.js)            │
                      │  - Express 5 REST API & Xtream Engine   │
                      │  - FFmpeg metadata & video processing   │
                      │  - Multer video upload handler          │
                      └──────────────┬──────────────────┬───────┘
                                     │                  │
               MongoDB URI (Port 27017)│                  │ Local Volume / Bind Mount
                                     ▼                  ▼
┌──────────────────────────────────────────┐      ┌───────────────────────────────────┐
│           iptv_mongodb (7.0)             │      │        Media Storage Directory    │
│  - Persistent volume: mongo_data         │      │  - LIVE / VOD / SERIES streams    │
│  - Automatic healthchecks                │      │  - Volume: iptv_media_data        │
└──────────────────────────────────────────┘      └───────────────────────────────────┘
```

- **Frontend (`dashboard`)**: React 19 single-page application built with modern hooks, Bootstrap 5, and AdminLTE styling. Packaged inside a lightweight multi-stage Alpine Nginx container. Nginx serves static assets and reverse-proxies API calls to avoid CORS issues and support large video uploads.
- **Backend (`api`)**: Node.js & Express server running on Node 20 slim with `ffmpeg` installed for automatic video duration extraction and stream handling. Provides Xtream Codes compatible endpoints (`player_api.php`, `get.php`, `xmltv.php`) alongside full administrative CRUD endpoints.
- **Database (`mongodb`)**: MongoDB 7.0 database configured with healthchecks (`mongosh` ping) ensuring the API only boots after database initialization.
- **Media Volumes**: Dedicated volume storage for live streams, movies (VOD), and episodic TV series files.

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
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   └── src/                      # Source code
│       ├── App.js                # Main router and view declarations
│       ├── index.js              # Application root entrypoint
│       ├── components/           # Dashboard management interfaces
│       │   ├── Dashboard.js      # Main overview and statistics
│       │   ├── LiveCategories.js # Live TV category administration
│       │   ├── LiveStreams.js    # Live TV stream management and file uploads
│       │   ├── VodCategories.js  # VOD (Movies) category administration
│       │   ├── VodStreams.js     # VOD stream management and file uploads
│       │   ├── SeriesCategories.js # Series category administration
│       │   ├── SeriesStreams.js  # Series show administration (with Seasons popup)
│       │   ├── Seasons.js        # Season administration (with Episodes popup)
│       │   ├── Episodes.js       # Episode stream management and file uploads
│       │   ├── SeasonsModal.js   # Seasons management popup modal for a specific series
│       │   ├── EpisodesModal.js  # Episodes management & upload popup modal for a specific season
│       │   ├── UploadProgressBar.js # Real-time file upload progress bar & stats
│       │   └── layout/           # Shared UI Layout
│       │       ├── AdminLayout.js
│       │       ├── Navbar.js
│       │       └── Sidebar.js
│       ├── services/
│       │   └── api.js            # Axios HTTP client with dynamic baseURL fallback
│       └── styles/               # Stylesheets & AdminLTE themes
│
└── IPTV_API/                     # Backend Web API (Node.js/Express)
    ├── Dockerfile                # Node 20 slim image with FFmpeg installed
    ├── package.json              # Backend dependencies (Express 5, Mongoose, Multer)
    ├── server.js                 # Server entrypoint, Xtream endpoints, CORS & routing
    ├── config/
    │   └── config.js             # Environment parsing, DB URIs, and media directories
    ├── controllers/              # Route controllers & upload processors
    │   ├── adminController.js    # Live categories & streams controller
    │   ├── adminVodController.js # VOD categories & streams controller
    │   ├── adminSeriesController.js # Series categories & shows controller
    │   ├── adminSeasonController.js # Seasons controller
    │   └── adminEpisodeController.js# Episode controller
    ├── models/                   # Mongoose schemas
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
        ├── adminRoutes.js        # /admin routes (Live)
        ├── VodRoutes.js          # /admin-vod routes (VOD)
        ├── SeriesRoutes.js       # /admin-series routes (Series)
        ├── SeasonRoutes.js       # /admin-seasons routes (Seasons)
        └── EpisodeRoutes.js      # /admin-episodes routes (Episodes)
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
3. Build the **React Frontend production bundle** and package it into an Nginx Alpine container.
4. Establish the shared internal bridge network (`iptv_network`) for seamless inter-container communication.

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

- **Admin Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **MongoDB Database**: `localhost:27017` (connect using MongoDB Compass or mongosh)

---

## 💾 Persistent Storage & Media Management

### Default Docker Volumes
By default, Docker Compose persists all databases and uploaded video files in Docker named volumes:
- `mongo_data`: Stores MongoDB database collections and indices.
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

### Default Authentication Credentials
- **Username**: `test`
- **Password**: `test`

*(You can customize these credentials in `IPTV_API/server.js`)*

### Player Connection Details

- **Server URL**: `http://<YOUR_IP_OR_HOST>:8080` (or `http://<YOUR_IP_OR_HOST>:3000` through Nginx)
- **Username**: `test`
- **Password**: `test`

### Direct Playlist and EPG Links

- **M3U Playlist**:
  ```text
  http://localhost:8080/get.php?username=test&password=test&type=m3u
  ```
- **EPG XMLTV Guide**:
  ```text
  http://localhost:8080/xmltv.php?username=test&password=test
  ```
- **Xtream Player API**:
  ```text
  http://localhost:8080/player_api.php?username=test&password=test
  ```

---

## 🔌 API Endpoints Summary

### Xtream Streaming Endpoints
- `GET /live/:username/:password/:stream_id` (or with extension `.:ext`)
- `GET /movie/:username/:password/:vod_id` (or with extension `.:ext`)
- `GET /series/:username/:password/:series_id` (or with extension `.:ext`)
- `GET /episode/:username/:password/:episode_id` (or with extension `.:ext`)

### Administrative Endpoints
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

### 4. Cache Issues When Updating Source Code
If changes made to React components or Express routes do not appear after starting:
```bash
docker compose build --no-cache
docker compose up -d
```

---

## 📄 License

This project is licensed under the ISC License. Designed for personal and educational use.
