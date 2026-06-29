# 🌌 MediaVerse (Unified Video & Social Architecture)

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)

MediaVerse is a high-performance, dual-platform entertainment ecosystem that unifies a YouTube-grade video hosting and streaming service with a Twitter/X-style real-time microblogging feed. The architecture is engineered to support adaptive HLS video transcoding, low-latency search indices, real-time message routing, rate limiting, and robust error tracking.

---

## 🏛️ Comprehensive Architecture Diagram

Below is the system architecture of MediaVerse, representing the flow of client requests, background jobs, database synchronization, caching layers, and storage gateways.

```mermaid
flowchart TB
    %% Styling Definitions
    classDef client fill:#0d9488,stroke:#0f766e,stroke-width:2px,color:#fff;
    classDef ingress fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef security fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff;
    classDef app fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef broker fill:#f97316,stroke:#c2410c,stroke-width:2px,color:#fff;
    classDef worker fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef storage fill:#6b7280,stroke:#374151,stroke-width:2px,color:#fff;

    %% Nodes
    subgraph ClientLayer ["Client Layer (Frontend)"]
        UI["React Client (Vite)"]:::client
        WS_Client["Socket.io Client"]:::client
    end

    subgraph SecurityGate ["Security & Ingress Gateways"]
        Proxy["Reverse Proxy (Nginx/Express Trust Proxy)"]:::ingress
        RateLimiter["Redis-Based sliding window Rate Limiter"]:::security
        HelmetHPP["Helmet Headers & HPP Middleware"]:::security
        AuthCheck["JWT Cookies / Access Tokens Validation"]:::security
    end

    subgraph AppServers ["Application Processing Layer"]
        NodeCluster["Node.js Cluster (Express Server)"]:::app
        WS_Server["Socket.io WS Gateway Server"]:::app
    end

    subgraph BrokerLayer ["Event Broker & Queue Management"]
        RedisStore["Redis Cache / Adapters"]:::broker
        RedisPubSub["Redis WebSocket Adapter (Pub/Sub scaling)"]:::broker
        BullQueue["BullMQ Job Queue (Video Transcoding Tasks)"]:::broker
    end

    subgraph BackgroundWorkers ["Background Worker Layer"]
        VideoWorker["BullMQ Worker (fluent-ffmpeg Transcoder)"]:::worker
        SearchIndexer["Typesense Index Sync Job"]:::worker
    end

    subgraph StorageLayer ["Systems of Record & Databases"]
        MongoDB[("MongoDB (Primary DB of Record)")]:::storage
        Typesense[("Typesense (Low-Latency Search Engine)")]:::storage
        S3Bucket[("AWS S3 (Raw & Transcoded HLS Streams)")]:::storage
        Cloudinary[("Cloudinary Media Assets Delivery")]:::storage
    end

    %% Flows & Connections
    UI -->|HTTP Requests| Proxy
    WS_Client -->|WebSockets Connection| Proxy
    
    Proxy --> RateLimiter
    RateLimiter --> HelmetHPP
    HelmetHPP --> AuthCheck
    AuthCheck -->|Authorized Route| NodeCluster
    AuthCheck -->|WS Handshake| WS_Server
    
    NodeCluster -->|Emit Events| RedisPubSub
    WS_Server <-->|Sync State| RedisPubSub
    
    NodeCluster -->|Push Video Upload Job| BullQueue
    BullQueue -->|Pulls Tasks| VideoWorker
    
    VideoWorker -->|Fetch Raw / Upload Transcoded HLS| S3Bucket
    VideoWorker -->|Upload Image Assets| Cloudinary
    
    NodeCluster -->|Write / Query Metadata| MongoDB
    NodeCluster -->|Sync Autocomplete Index| SearchIndexer
    SearchIndexer -->|Push Search Indices| Typesense
    
    NodeCluster -->|Cache Profiles / Session Keys| RedisStore
    NodeCluster -->|Query Index| Typesense
    
    %% Regional indicators
    class UI,WS_Client client;
    class Proxy ingress;
    class RateLimiter,HelmetHPP,AuthCheck security;
    class NodeCluster,WS_Server app;
    class RedisStore,RedisPubSub,BullQueue broker;
    class VideoWorker,SearchIndexer worker;
    class MongoDB,Typesense,S3Bucket,Cloudinary storage;
```

---

## 🔄 Core Request Lifecycles & Flows

### 1. Video Processing & Transcoding Pipeline (HLS stream creation)
When a creator uploads a video, MediaVerse processes the video asynchronously to support dynamic bitrate streaming:

```mermaid
gantt
    title Video Transcoding Workflow (BullMQ + FFMPEG)
    dateFormat  X
    axisFormat %s sec
    
    section API Route
    Client Upload Request     :active, 0, 3
    S3 Upload Presign Creation : 3, 5
    Client Direct Upload to S3 : 5, 12
    Trigger Transcode Queue   :crit, 12, 14
    
    section BullMQ Queue
    Job Enqueued (Wait State) : 14, 17
    Worker Pulls Task         : 17, 18
    
    section FFMPEG Worker
    Download Raw Source       : 18, 22
    Create HLS Manifest (.m3u8): 22, 28
    Create TS Segments (.ts)  : 28, 38
    Upload Output Streams     : 38, 43
    Update DB Status (Ready)  : 43, 45
```

### 2. WebSocket Real-Time Event Dispatch System
Live interactions (tweets, replies, views, likes) travel through a distributed network synced via Redis:

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Client A
    actor Bob as Client B
    participant App as Express Gateway
    participant Redis as Redis Pub/Sub Adapter
    participant DB as MongoDB
    
    Alice->>App: Action (e.g. Like Video / Post Reply)
    rect rgb(30, 41, 59)
        note right of App: Process inside Node Cluster
        App->>DB: Mutate & Save Event
        DB-->>App: Confirm Write
    end
    App->>Redis: Publish Event (Channel: mediaverse_events)
    rect rgb(17, 24, 39)
        note over Redis: Distribute to all scaling clusters
        Redis-->>App: Broadcast to Room "video_123"
    end
    App-->>Bob: Emit socket event "new_like" / "new_reply"
```

---

## ⚡ Technical Features & Design Choices

*   **Dual Platforms**: Seamless transitions between MediaVerse Video (YouTube style, red accents) and MediaVerse X (Twitter style, blue accents) on a single session.
*   **HLS Streaming**: Auto-segmentation of uploaded videos into adaptive HLS playlists (`.m3u8` and `.ts`) via background workers.
*   **Low-Latency Search**: Autocomplete search indices synchronized with MongoDB documents and powered by Typesense.
*   **Redis Middleware**: Dual-purpose Redis engine:
    *   **Rate Limiting**: Sliding window rate limits that persist across proxy routing to prevent auth abuse lockouts.
    *   **Adapter Scaling**: Redis adapter for Socket.io enabling scaling across multiple Node.js instances.
*   **Security Architecture**: Cross-Origin Resource Sharing (CORS) configured with credentials support, Helmet header enforcement, and HPP parameter cleansing.
*   **Telemetry**: Sentry error boundaries integrated inside backend routes and job workers to log exceptions automatically.

---

## 📂 Repository Directory Layout

```
.
├── src/
│   ├── app.js               # Express application initialization & middleware config
│   ├── index.js             # API entrypoint, MongoDB connection, & server bind
│   ├── config/              # Redis, Typesense, Sentry, & DB config files
│   ├── controllers/         # Request handling logic (Users, Videos, Tweets, Likes, etc.)
│   ├── middlewares/         # Auth guards, Rate limiters, Error wrappers, Uploads
│   ├── models/              # Mongoose DB Schemas with indexes
│   ├── routes/              # HTTP Route declarations
│   ├── socket/              # Socket.io gateways & room managers
│   └── workers/             # Transcoder & index sync background workers (BullMQ)
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Landing Page, YouTube Feed, Twitter Feed)
│   │   ├── layouts/         # Layout shells (YouTubeLayout, TwitterLayout)
│   │   └── main.jsx         # React application shell & Axios response interceptor
│   └── package.json         # React dependencies (Framer Motion, React Three Fiber, Recharts)
├── docker-compose.yml       # Production-ready services orchestrator
└── package.json             # Backend dependencies
```

---

## 🚀 Local Installation & Running

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance
*   Redis Cluster
*   Typesense (optional for local mock search)

### Step 1: Clone and Configure Environments
Create a `.env` file at the root:
```env
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017/mediaverse
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name
```

### Step 2: Spin Up Environment Containers
If you have Docker installed, spin up all backing storage engines instantly:
```bash
npm run docker:dev
```

### Step 3: Run the Services
Run the Express backend API and background transcoding workers concurrently:
```bash
# Install root backend packages
npm install

# Run Express + Workers
npm run dev:all
```

Run the React frontend client in a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to explore your unified media universe.
