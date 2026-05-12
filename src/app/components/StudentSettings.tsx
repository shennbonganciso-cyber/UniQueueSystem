import React, { useState } from "react";
import { useNavigate } from "react-router";

const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://uniqueuesea.onrender.com/api");

const StudentSettings: React.FC = () => {
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const studentId = sessionStorage.getItem("studentId");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          oldPassword,
          newPassword,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error("JSON Parse Error:", parseErr);
        console.error("Response status:", res.status);
        console.error("Response statusText:", res.statusText);
        throw new Error(`Server error (${res.status}): Unable to parse response`);
      }

      if (!res.ok) {
        throw new Error(data.message || `Password update failed (${res.status})`);
      }

      setMessage("Password updated successfully");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error occurred");
      console.error("Change password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md bg-white/5 p-6 rounded-xl border border-white/10">
        <h1 className="text-xl mb-4">Change Password</h1>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full p-2 rounded bg-black/30 border border-white/10"
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 rounded bg-black/30 border border-white/10"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full p-2 bg-indigo-600 rounded"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {message && <p className="mt-3 text-sm">{message}</p>}

        <button
          onClick={() => navigate("/student")}
          className="mt-4 text-sm text-gray-400"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export { StudentSettings };
