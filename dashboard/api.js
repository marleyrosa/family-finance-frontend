"use client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://family-finance-backend.onrender.com";

export async function apiRequest(path, options = {}, token) {
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function login(email, password) {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  return apiRequest("/auth/login", {
    method: "POST",
    body: form,
  });
}
