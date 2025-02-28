// frontend/src/app/(auth)/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axios.post<{ token: string; message: string }>(
        "/api/auth/login",
        { email, password }
      );
      setMessage(res.data.message);
      localStorage.setItem("token", res.data.token);
      console.log("JWT Token:", res.data.token);
      setEmail("");
      setPassword("");
      setTimeout(() => router.push("/"), 1000); // Redirect to home
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMsg = err.response?.data?.message || "Login wahala o!";
        setMessage(errorMsg);
        if (err.response?.status === 403 && errorMsg.includes("banned")) {
          setTimeout(() => router.push("/appeal"), 1000); // Redirect to appeal
        }
      } else {
        setMessage("Login wahala o!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-green-800 mb-6">
          Login to NaijaTalk
        </h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-green-400"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
