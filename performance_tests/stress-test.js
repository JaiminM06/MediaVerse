import http from "k6/http";
import { check, sleep } from "k6";

// Load pre-generated authentication tokens from tokens.json
const tokens = JSON.parse(open("./tokens.json"));

export const options = {
    stages: [
        { duration: "20s", target: 750 }, // Ramp up to 750 VUs
        { duration: "30s", target: 750 }, // Hold at 750 VUs
        { duration: "10s", target: 0 },   // Ramp down to 0 VUs
    ],
    thresholds: {
        http_req_duration: ["p(95)<180"], // Target P95 under 180 ms
        http_req_failed: ["rate<0.01"],   // Request failures under 1% (ideal 0%)
    },
};

export default function () {
    // Select token based on the virtual user ID (1-indexed) to distribute requests across users
    const token = tokens[(__VU - 1) % tokens.length];

    const url = "http://localhost:8000/api/v1/feed?limit=20";
    const params = {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    };

    const res = http.get(url, params);

    check(res, {
        "Status is 200": (r) => r.status === 200,
        "Feed is cached/personalized": (r) => r.json("data.isPersonalized") === true,
        "Feed has videos": (r) => Array.isArray(r.json("data.feed")),
    });

    sleep(1);
}
