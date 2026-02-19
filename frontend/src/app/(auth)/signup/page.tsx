// frontend/src/app/(auth)/signup/page.tsx
"use client";

import { useState, FormEvent } from "react";
import api from "@/utils/api";
import axios from "axios"; // Keep for isAxiosError check
import { useRouter } from "next/navigation"; // Add this

export default function Signup() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const router = useRouter(); // Add this

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ message: string }>("/auth/signup", {
        email,
        password,
      });
      setMessage(res.data.message);
      setEmail(""); // Clear fields
      setPassword("");
      setTimeout(() => router.push("/login"), 1000); // Redirect to login
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Signup scatter o!");
      } else {
        setMessage("Signup scatter o!");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-green-800 mb-6">
          Join NaijaTalk
        </h1>
        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Set your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
          >
            Sign Up
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
