// frontend/src/app/contests/page.jsx

"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

export default function Contests() {
  const [contests, setContests] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const res = await axios.get("/api/contests");
      setContests(res.data.contests);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Contests load scatter o!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          NaijaTalk Contests
        </h1>
        {message && (
          <p className="text-center text-sm text-gray-600 mb-4">{message}</p>
        )}
        <div className="space-y-4">
          {contests.length > 0 ? (
            contests.map((contest) => (
              <div key={contest._id} className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-bold text-green-800">
                  {contest.title}
                </h2>
                <p className="text-gray-700">{contest.description}</p>
                <p className="text-gray-800 font-semibold">
                  Prize: ₦{contest.prize}
                </p>
                <p className="text-xs text-gray-600">
                  Ends: {new Date(contest.endDate).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No contests yet—abeg check back!</p>
          )}
        </div>
        <Link
          href="/"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
