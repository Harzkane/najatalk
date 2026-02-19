import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api", // Default to local Next.js proxy or backend
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
