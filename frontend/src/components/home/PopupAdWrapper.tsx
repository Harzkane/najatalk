"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import axios from "axios"; // Keep just in case, but usually not needed for simple gets

type Ad = {
  _id: string;
  brand: string;
  text: string;
  link: string;
  type: "sidebar" | "banner" | "popup";
  budget: number;
  cpc: number;
  status: "pending" | "active" | "expired";
};

export default function PopupAdWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [popupAd, setPopupAd] = useState<Ad | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const checkPremiumAndPopup = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsPremium(res.data.isPremium);
          console.log("User Premium Status:", res.data.isPremium);
        } catch (err) {
          console.error("Premium check error:", err);
        }
      }
      if (!isPremium && !localStorage.getItem("hasSeenPopup")) {
        console.log("Fetching popup ad...");
        await fetchPopupAd();
      } else {
        console.log("Skipping popup: Premium or already seen.");
      }
    };
    checkPremiumAndPopup();
  }, []); // Empty dependency to run once on mount

  const fetchPopupAd = async () => {
    try {
      const res = await api.get("/ads", {
        params: { status: "active", type: "popup" },
      });
      console.log("Popup Ads Fetched:", res.data.ads);
      const activePopups = res.data.ads.filter(
        (ad: Ad) => ad.type === "popup" && ad.budget >= ad.cpc // Explicit type check
      );
      console.log("Filtered Active Popups:", activePopups);
      if (activePopups.length > 0) {
        setPopupAd(activePopups[0]);
        console.log("Tracking Popup Impression:", activePopups[0]._id);
        await api.get(`/ads/impression/${activePopups[0]._id}`);
        localStorage.setItem("hasSeenPopup", "true");
      } else {
        console.log("No valid popup ads found.");
        setPopupAd(null);
      }
    } catch (err) {
      console.error("Popup fetch error:", err);
      setPopupAd(null);
    }
  };

  const trackPopupClick = async (adId: string) => {
    try {
      console.log("Tracking Popup Click:", adId);
      await api.post(`/ads/click/${adId}`);
      console.log("Popup click tracked.");
    } catch (err) {
      console.error("Popup click error:", err);
    }
  };

  const closePopup = () => {
    setPopupAd(null);
    console.log("Popup closed.");
  };

  return (
    <>
      {children}
      {!isPremium && popupAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
            <a
              href={popupAd.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackPopupClick(popupAd._id)}
              className="text-blue-600 font-bold hover:underline text-lg"
            >
              {popupAd.brand}: {popupAd.text}
            </a>
            <button
              onClick={closePopup}
              className="mt-4 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
