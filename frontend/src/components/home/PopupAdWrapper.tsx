"use client";

import { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import axios from "axios";

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
  const POPUP_COOLDOWN_MS = 6 * 60 * 60 * 1000;

  const fetchPopupAd = useCallback(async () => {
    try {
      const res = await api.get("/ads", {
        params: { status: "active", type: "popup" },
      });
      console.log("Popup Ads Fetched:", res.data.ads);
      const activePopups = res.data.ads.filter(
        (ad: Ad) => ad.type === "popup" && ad.budget >= ad.cpc
      );

      if (activePopups.length > 0) {
        setPopupAd(activePopups[0]);
        console.log("Tracking Popup Impression:", activePopups[0]._id);
        await api.get(`/ads/impression/${activePopups[0]._id}`);
      } else {
        console.log("No valid popup ads found.");
        setPopupAd(null);
      }
    } catch (err) {
      console.error("Popup fetch error:", err);
      setPopupAd(null);
    }
  }, []);

  useEffect(() => {
    const checkPremiumAndPopup = async () => {
      let userIsPremium = false;
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          userIsPremium = Boolean(res.data.isPremium);
          setIsPremium(userIsPremium);
          console.log("User Premium Status:", userIsPremium);
        } catch (err) {
          console.error("Premium check error:", err);
        }
      }
      const lastSeen = Number(localStorage.getItem("popupLastSeenAt") || "0");
      const withinCooldown = Date.now() - lastSeen < POPUP_COOLDOWN_MS;

      if (!userIsPremium && !withinCooldown) {
        console.log("Fetching popup ad...");
        await fetchPopupAd();
      } else {
        console.log("Skipping popup: Premium or cooldown active.");
      }
    };
    checkPremiumAndPopup();
  }, [fetchPopupAd]);

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
    localStorage.setItem("popupLastSeenAt", Date.now().toString());
    console.log("Popup closed.");
  };

  return (
    <>
      {children}
      {!isPremium && popupAd && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))]">
          <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Sponsored
            </p>
            <a
              href={popupAd.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackPopupClick(popupAd._id)}
              className="text-slate-800 font-semibold hover:text-slate-900"
            >
              {popupAd.brand}
              <span className="mt-1 block text-sm font-normal text-slate-600">
                {popupAd.text}
              </span>
            </a>
            <button
              onClick={closePopup}
              className="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}
