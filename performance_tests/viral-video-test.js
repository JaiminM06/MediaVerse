import http from "k6/http";
import { check, sleep } from "k6";

// Load pre-generated authentication tokens from tokens.json
const tokens = JSON.parse(open("./tokens.json"));

// NOTE: Replace this with an actual video ID from your database before running
const VIRAL_VIDEO_ID = "68e8089910e4297965160d41"; // Placeholder

export const options = {
    stages: [
        { duration: "10s", target: 500 }, // Ramp up to 500 Virtual Users
        { duration: "30s", target: 1000 }, // Hold at 1000 VUs to simulate extreme viral peak
        { duration: "10s", target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ["p(95)<150"], // Target P95 under 150 ms
        http_req_failed: ["rate<0.01"],   // Acceptable failure rate < 1%
    },
};

export default function () {
    const url = `http://localhost:8000/api/v1/videos/${VIRAL_VIDEO_ID}`;

    // Generate a random IP address to bypass the 24-hour deduplication mechanism
    // This tricks the backend into processing every request as a unique view
    const randomIp = `${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
    )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    const params = {
        headers: {
            "Authorization": `Bearer ${tokens[(__VU - 1) % tokens.length]}`,
            "X-Forwarded-For": randomIp,
        },
    };

    const res = http.get(url, params);

    check(res, {
        "Status is 200": (r) => r.status === 200,
        "Response contains video views": (r) => {
            const body = r.json();
            return body && body.data && typeof body.data.views === "number";
        },
    });

    // Short sleep to hammer the server while keeping CPU bound manageable on the load generator
    sleep(0.1);
}
