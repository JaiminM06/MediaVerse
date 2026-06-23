import "dotenv/config";
import http from "http";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { initSocket } from "./config/socket.js";
import { initTypesenseCollections } from "./config/typesenseCollections.js";

const server = http.createServer(app);
initSocket(server);

connectDB()
    .then(async () => {
        try {
            await initTypesenseCollections();
        } catch (tsError) {
            console.error("Typesense initialization failed:", tsError.message);
        }
        server.listen(process.env.PORT || 8000, () => {
            console.log("Server is running on port:", process.env.PORT || 8000);
        });
    })
    .catch((err) => {
        console.log("MongoDB connection failed:", err);
    });