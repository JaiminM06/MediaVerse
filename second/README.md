# MediaVerse

MediaVerse is a high-performance backend system for a YouTube/Twitter hybrid platform. It provides robust content management, social interactions, and media streaming capabilities. 

This project goes beyond standard CRUD operations by laying the foundation for advanced systems engineering concepts such as asynchronous video processing, real-time communications, and scalable search architectures.

## 🏗️ Architecture Flow

```
Client App
     │
     ▼ (REST / JSON)
Express API (Node.js) ──► JWT Auth / Middleware Validation
     │
     ├──► MongoDB Atlas (User Data, Social Graph, Video Metadata)
     │
     └──► Cloudinary (Direct Avatar & Thumbnail Uploads)
```
*(Note: System is currently being upgraded to support S3-based asynchronous FFmpeg transcoding and HLS adaptive streaming).*

## 🛠️ Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v20+) | High-throughput, non-blocking I/O execution |
| **Framework** | Express.js | RESTful API routing and middleware management |
| **Database** | MongoDB Atlas | Flexible schema design for complex social relationships |
| **ODM** | Mongoose | Data modeling and complex aggregation pipelines |
| **Auth** | JWT / bcrypt | Secure, stateless authentication with refresh tokens |
| **Media Storage** | Cloudinary | Fast, CDN-backed image and media delivery |

## 🧠 Key Engineering Decisions

1. **Complex Aggregation Pipelines over Joins:** Leveraging MongoDB's `$lookup` and `$addFields` to compute complex user metrics (like subscriber counts and watch history intersections) directly at the database level, reducing memory load on the Node.js process.
2. **Stateless Authentication:** Utilizing short-lived Access Tokens and long-lived Refresh Tokens stored in HTTP-only, secure cookies to prevent XSS attacks while maintaining persistent sessions.
3. **Optimistic Updates & Referencing:** Storing references (ObjectIds) in the database rather than deeply embedding documents. This ensures the social graph (likes, comments, subscriptions) remains scalable and consistent.

## 🚀 Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd mediaverse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the example environment file and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   *You will need a MongoDB Atlas URI and Cloudinary API credentials.*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:8000`.

## 🔗 Links

- **Live Demo:** [Coming Soon]
- **API Documentation:** [Coming Soon]

---
*Built with modern backend best practices in mind.*
