// frontend/src/app/(auth)/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axios.post<{
        token: string;
        userId: string;
        message: string;
      }>("/api/auth/login", { email, password });
      setMessage(res.data.message);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId); // Store userId
      console.log("Logged in User ID:", res.data.userId);
      setEmail("");
      setPassword("");
      let destination = "/marketplace";
      try {
        const completenessRes = await axios.get("/api/users/me/profile-completeness", {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });
        destination = completenessRes.data?.profileCompleted
          ? "/marketplace"
          : "/onboarding/profile";
      } catch {
        destination = "/marketplace";
      }
      setTimeout(() => router.push(destination), 800);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMsg = err.response?.data?.message || "Login wahala o!";
        setMessage(errorMsg);
        if (err.response?.status === 403 && errorMsg.includes("banned")) {
          // Pass ban signal via query param
          setTimeout(() => router.push("/appeal?fromBan=true"), 1000);
        }
      } else {
        setMessage("Login wahala o!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 w-full max-w-md">
        <h1 className="text-3xl font-bold text-green-800 mb-6">
          Login to NaijaTalk
        </h1>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
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
      </div>
    </div>
  );
}
