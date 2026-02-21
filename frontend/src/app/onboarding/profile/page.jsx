"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function ProfileOnboardingPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [addressFullName, setAddressFullName] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressDeliveryNote, setAddressDeliveryNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [missingFields, setMissingFields] = useState([]);
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const load = async () => {
      try {
        const res = await axios.get("/api/users/me/profile-completeness", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.profileCompleted) {
          router.replace("/marketplace");
          return;
        }

        const user = res.data?.user || {};
        setUsername(user.username || "");
        setAvatarUrl(user.avatarUrl || "");
        setBio(user.bio || "");
        setLocation(user.location || "");
        const delivery = user.defaultDeliveryAddress || {};
        setAddressFullName(delivery.fullName || "");
        setAddressPhone(delivery.phone || "");
        setAddressLine1(delivery.addressLine1 || "");
        setAddressLine2(delivery.addressLine2 || "");
        setAddressCity(delivery.city || "");
        setAddressState(delivery.state || "");
        setAddressPostalCode(delivery.postalCode || "");
        setAddressDeliveryNote(delivery.deliveryNote || "");
        setMissingFields(res.data?.missingFields || []);
        setProfileCompleteness(res.data?.profileCompleteness || 0);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setMessage(err.response?.data?.message || "Profile load scatter o!");
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            router.replace("/login");
            return;
          }
        } else {
          setMessage("Profile load scatter o!");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const liveMissing = useMemo(() => {
    const missing = [];
    if (!username.trim()) missing.push("username");
    if (!bio.trim()) missing.push("bio");
    if (!location.trim()) missing.push("location");
    return missing;
  }, [username, bio, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await axios.patch(
        "/api/users/me/profile",
        {
          username: username.trim().toLowerCase(),
          avatarUrl: avatarUrl.trim(),
          bio: bio.trim(),
          location: location.trim(),
          defaultDeliveryAddress: {
            fullName: addressFullName.trim(),
            phone: addressPhone.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: addressCity.trim(),
            state: addressState.trim(),
            postalCode: addressPostalCode.trim(),
            deliveryNote: addressDeliveryNote.trim(),
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMissingFields(res.data?.missingFields || []);
      setProfileCompleteness(res.data?.profileCompleteness || 0);
      setMessage(res.data?.message || "Profile updated.");

      if (res.data?.profileCompleted) {
        router.replace("/marketplace");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Profile update scatter o!");
      } else {
        setMessage("Profile update scatter o!");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading profile setup...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Complete Your Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Set up your public identity before using marketplace and community features.
        </p>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Profile completeness</p>
          <p className="text-lg font-semibold text-slate-900">{profileCompleteness}%</p>
          {missingFields.length > 0 && (
            <p className="text-xs text-slate-600">Missing: {missingFields.join(", ")}</p>
          )}
        </div>

        {message && (
          <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              placeholder="e.g. lagoshustler"
              className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
              required
            />
            <p className="mt-1 text-xs text-slate-500">3-24 chars, lowercase letters, numbers, underscore.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bio *</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people what you sell or talk about"
              className="h-24 w-full rounded-lg border border-slate-300 p-2 text-slate-800"
              maxLength={280}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Location *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lagos, Nigeria"
              className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
              maxLength={80}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Avatar URL (optional)</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-800">
              Default Delivery Address (optional)
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                type="text"
                value={addressFullName}
                onChange={(e) => setAddressFullName(e.target.value)}
                placeholder="Full name"
                className="rounded-lg border border-slate-300 p-2 text-slate-800"
              />
              <input
                type="text"
                value={addressPhone}
                onChange={(e) => setAddressPhone(e.target.value)}
                placeholder="Phone number"
                className="rounded-lg border border-slate-300 p-2 text-slate-800"
              />
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Address line 1"
                className="rounded-lg border border-slate-300 p-2 text-slate-800 md:col-span-2"
              />
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Address line 2"
                className="rounded-lg border border-slate-300 p-2 text-slate-800 md:col-span-2"
              />
              <input
                type="text"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                placeholder="City"
                className="rounded-lg border border-slate-300 p-2 text-slate-800"
              />
              <input
                type="text"
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
                placeholder="State"
                className="rounded-lg border border-slate-300 p-2 text-slate-800"
              />
              <input
                type="text"
                value={addressPostalCode}
                onChange={(e) => setAddressPostalCode(e.target.value)}
                placeholder="Postal code"
                className="rounded-lg border border-slate-300 p-2 text-slate-800"
              />
              <textarea
                value={addressDeliveryNote}
                onChange={(e) => setAddressDeliveryNote(e.target.value)}
                placeholder="Delivery note"
                className="h-20 rounded-lg border border-slate-300 p-2 text-slate-800 md:col-span-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || liveMissing.length > 0}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {saving ? "Saving..." : "Save and Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
