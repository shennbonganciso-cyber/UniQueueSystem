const defaultApiUrl = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://uniqueuesea.onrender.com/api";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? defaultApiUrl;

export async function loginUser(studentId: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ studentId, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Login failed");
  }

  return res.json();
}