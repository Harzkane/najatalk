// frontend/src/app/users/[id]/page.jsx

"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/api/users/${id}`);
      setUser(res.data.user);
      setListings(res.data.listings);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Profile load scatter o!");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const time = date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZone: "Africa/Lagos",
      })
      .toLowerCase();
    const month = date.toLocaleString("en-US", { month: "short" });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${time} On ${month} ${day}, ${year}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <p className="text-gray-600">{message || "Loading profile..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto mb-3">
        <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">User Profile</h1>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-green-100 hover:text-white text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/marketplace"
                className="text-green-100 hover:text-white text-sm font-medium"
              >
                Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {message && (
          <p className="text-center text-sm text-gray-600 mb-4 bg-white p-2 rounded-lg">
            {message}
          </p>
        )}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            Seller Info
          </h2>
          <p className="text-gray-800">
            <strong>Email:</strong> {user.email}
          </p>
          {user.flair && (
            <p className="text-gray-800">
              <strong>Flair:</strong>{" "}
              <span
                className={`inline-block text-white px-1 rounded text-xs ${
                  user.flair === "Oga at the Top"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
              >
                {user.flair}
              </span>
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            Listings
          </h2>
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((listing) => (
                <Link href="/marketplace" key={listing._id}>
                  <div className="bg-gray-50 p-4 rounded-lg shadow hover:bg-gray-100 cursor-pointer">
                    <h3 className="text-lg font-bold text-green-800">
                      {listing.title}
                    </h3>
                    <p className="text-gray-700">{listing.description}</p>
                    <p className="text-gray-800 font-semibold">
                      ₦{listing.price / 100}
                    </p>
                    <p className="text-xs text-gray-600">
                      Category: {listing.category}
                    </p>
                    <p className="text-xs text-gray-600">
                      Status:{" "}
                      <span
                        className={`${
                          listing.status === "active"
                            ? "text-green-600"
                            : listing.status === "pending"
                            ? "text-yellow-600"
                            : "text-gray-600"
                        } font-semibold`}
                      >
                        {listing.status.charAt(0).toUpperCase() +
                          listing.status.slice(1)}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600">
                      Posted: {formatDate(listing.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              No listings yet—abeg start dey sell!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
