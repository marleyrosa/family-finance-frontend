"use client";

export const API_URL =
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

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const detail = data && data.detail ? data.detail : `Request failed: ${response.status}`;
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function login(email, password) {
  return apiRequest("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(nome, email, password) {
  return apiRequest("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, password }),
  });
}

export async function getDashboard(token, mes, ano) {
  return apiRequest(`/dashboard?mes=${mes}&ano=${ano}`, {}, token);
}
