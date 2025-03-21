"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Others");
  const [message, setMessage] = useState("");
  const [editId, setEditId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchListings();
    fetchCategories();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await axios.get("/api/marketplace/listings");
      // setListings(res.data.listings.filter((l) => l.status === "active"));
      setListings(res.data.listings);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Market load scatter o!");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/marketplace/categories");
      setCategories(res.data.categories);
    } catch (err) {
      setMessage(err.response?.data?.message || "Categories load scatter o!");
      setCategories([
        "Electronics",
        "Fashion",
        "Home",
        "Food",
        "Services",
        "Others",
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }
    try {
      const url = editId
        ? `/api/marketplace/listings/${editId}`
        : "/api/marketplace/listings";
      const method = editId ? "put" : "post";
      const res = await axios({
        method,
        url,
        data: { title, description, price: Number(price), category },
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message);
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("Others");
      setEditId(null);
      fetchListings();
    } catch (err) {
      setMessage(err.response?.data?.message || "Listing scatter o!");
    }
  };

  const handleEdit = (listing) => {
    setEditId(listing._id);
    setTitle(listing.title);
    setDescription(listing.description);
    setPrice(listing.price / 100);
    setCategory(listing.category);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.delete(`/api/marketplace/listings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message);
      fetchListings();
    } catch (err) {
      setMessage(err.response?.data?.message || "Delete scatter o!");
    }
  };

  const handleBuy = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }
    try {
      const res = await axios.post(
        `/api/marketplace/buy/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      fetchListings();
    } catch (err) {
      console.error("Buy Error:", err.response?.data);
      setMessage(err.response?.data?.message || "Buy scatter o!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Format date to "7:20pm On Mar 21, 2025"
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto mb-3">
        <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              NaijaTalk Marketplace—Buy & Sell!
            </h1>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-green-100 hover:text-white text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/premium"
                className="text-green-100 hover:text-white text-sm font-medium"
              >
                Wallet
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
              >
                Logout
              </button>
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
            {editId ? "Edit Item" : "Sell Something"}
          </h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Item Title (e.g., Jollof Pot)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 mb-2 border rounded-lg text-gray-800"
              required
            />
            <textarea
              placeholder="Description (e.g., Barely used, still dey shine)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 mb-2 border rounded-lg text-gray-800 h-24"
              required
            />
            <input
              type="number"
              placeholder="Price (₦)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 mb-2 border rounded-lg text-gray-800"
              min="1"
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 mb-2 border rounded-lg text-gray-800"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
            >
              {editId ? "Update Item" : "Post Item"}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {listings.length > 0 ? (
            listings.map((listing) => (
              <div
                key={listing._id}
                className="bg-white p-4 rounded-lg shadow flex justify-between"
              >
                <div>
                  <h2 className="text-lg font-bold text-green-800">
                    {listing.title}
                  </h2>
                  <p className="text-gray-700">{listing.description}</p>
                  <p className="text-gray-800 font-semibold">
                    ₦{listing.price / 100}
                  </p>
                  <p className="text-xs text-gray-600">
                    Seller: {listing.userId.email}{" "}
                    {listing.userId.flair && (
                      <span
                        className={`inline-block text-white px-1 rounded text-xs ${
                          listing.userId.flair === "Oga at the Top"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      >
                        {listing.userId.flair}
                      </span>
                    )}
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
                          : "text-yellow-600"
                      } font-semibold`}
                    >
                      {listing.status.charAt(0).toUpperCase() +
                        listing.status.slice(1)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Posted: {formatDate(listing.createdAt)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Updated: {formatDate(listing.updatedAt)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {listing.status === "active" && (
                    <>
                      <button
                        onClick={() => handleEdit(listing)}
                        className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(listing._id)}
                        className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleBuy(listing._id)}
                        className="bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700"
                      >
                        Buy
                      </button>
                    </>
                  )}
                  {listing.status === "pending" && (
                    <p className="text-xs text-yellow-600">In Escrow</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
              No items yet—be the first to sell!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
