import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, "tokens.json"), "utf8"));

async function makeRequest(token) {
    return new Promise((resolve) => {
        const req = http.get({
            hostname: "localhost",
            port: 8000,
            path: "/api/v1/feed?limit=20",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                resolve(res.statusCode);
            });
        });
        req.on("error", (err) => {
            resolve(500);
        });
    });
}

async function warmUp() {
    console.log(`Pre-warming cache for ${tokens.length} users...`);
    const batchSize = 10;
    for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        await Promise.all(batch.map(token => makeRequest(token)));
    }
    console.log("Pre-warming complete! All cache keys populated.");
}

warmUp().catch(console.error);
