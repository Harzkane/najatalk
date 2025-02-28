// frontend/src/app/(admin)/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import formatDate from "@/utils/formatDate";

type Report = {
  _id: string;
  threadId: { _id: string; title: string };
  userId: { _id: string; email: string };
  reportedUserId: { _id: string; email: string };
  reason: string;
  createdAt: string;
};

type BannedUser = {
  _id: string;
  email: string;
  appealReason?: string;
  appealStatus?: string;
};

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (token) {
      fetchReports();
      fetchBannedUsers();
    }
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<{ reports: Report[]; message: string }>(
        "/api/threads/reports",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(res.data.reports || []);
      setMessage(res.data.message);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Fetch scatter o!");
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } else {
        setMessage("Fetch scatter o!");
      }
      setReports([]);
    }
  };

  const fetchBannedUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<{
        bannedUsers: BannedUser[];
        message: string;
      }>("/api/users/banned", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBannedUsers(res.data.bannedUsers || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(
          err.response?.data?.message || "Fetch banned users scatter o!"
        );
      } else {
        setMessage("Fetch banned users scatter o!");
      }
      setBannedUsers([]);
    }
  };

  const handleDelete = async (threadId: string) => {
    if (!confirm("Sure say you wan delete this thread?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete<{ message: string }>(
        `/api/threads/${threadId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setReports(reports.filter((r) => r.threadId._id !== threadId));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Delete scatter o!");
      } else {
        setMessage("Delete scatter o!");
      }
    }
  };

  const handleDismiss = async (reportId: string) => {
    if (!confirm("Sure say you wan dismiss this report?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete<{ message: string }>(
        `/api/threads/reports/${reportId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      const updatedReports = reports.filter((r) => r._id !== reportId);
      setReports(updatedReports);
      if (updatedReports.length === 0) fetchReports();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Dismiss scatter o!");
      } else {
        setMessage("Dismiss scatter o!");
      }
      setReports(reports);
    }
  };

  const handleBanUser = async (userId: string, email: string) => {
    if (!confirm(`Sure say you wan ban ${email}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put<{ message: string }>(
        `/api/users/${userId}/ban`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      fetchReports();
      fetchBannedUsers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Ban scatter o!");
      } else {
        setMessage("Ban scatter o!");
      }
    }
  };

  const handleUnbanUser = async (userId: string, approve: boolean) => {
    if (
      !confirm(
        approve
          ? "Sure say you wan unban this user?"
          : "Sure say you wan reject this appeal?"
      )
    )
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put<{ message: string }>(
        `/api/users/${userId}/unban`,
        { approve },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      fetchBannedUsers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Unban scatter o!");
      } else {
        setMessage("Unban scatter o!");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/login");
  };

  if (!isLoggedIn) return <p className="text-center p-10">Abeg login first!</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto mb-3">
        <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold">Admin Dashboard—NaijaTalk</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {message && (
          <p className="text-center text-sm text-gray-600 mb-3 bg-white p-2 rounded-lg">
            {message}
          </p>
        )}

        {/* Reports Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-green-800 mb-3">
            Reports
          </h2>
          {reports && reports.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Thread
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Reported By
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Reason
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id} className="border-t border-gray-100">
                      <td className="p-3">
                        <Link
                          href={`/threads/${report.threadId._id}`}
                          className="text-green-800 hover:underline"
                        >
                          {report.threadId.title}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-700">
                        {report.userId.email}
                      </td>
                      <td className="p-3 text-gray-700">{report.reason}</td>
                      <td className="p-3 text-gray-600">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDelete(report.threadId._id)}
                          className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 text-sm mr-2"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleDismiss(report._id)}
                          className="bg-yellow-600 text-white px-2 py-1 rounded-lg hover:bg-yellow-700 text-sm mr-2"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() =>
                            handleBanUser(
                              report.reportedUserId._id,
                              report.reportedUserId.email
                            )
                          }
                          className="bg-purple-600 text-white px-2 py-1 rounded-lg hover:bg-purple-700 text-sm"
                        >
                          Ban User
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
              No reports yet—clean slate!
            </p>
          )}
        </div>

        {/* Banned Users Section */}
        <div>
          <h2 className="text-2xl font-semibold text-green-800 mb-3">
            Banned Users
          </h2>
          {bannedUsers && bannedUsers.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Appeal Reason
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bannedUsers.map((user) => (
                    <tr key={user.email} className="border-t border-gray-100">
                      <td className="p-3 text-gray-700">{user.email}</td>
                      <td className="p-3 text-gray-700">
                        {user.appealReason || "No appeal yet"}
                      </td>
                      <td className="p-3 text-gray-700">
                        {user.appealStatus || "N/A"}
                      </td>
                      <td className="p-3">
                        {user.appealStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleUnbanUser(user._id, true)}
                              className="bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 text-sm mr-2"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUnbanUser(user._id, false)}
                              className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 text-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
              No banned users yet—everybody dey behave!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
