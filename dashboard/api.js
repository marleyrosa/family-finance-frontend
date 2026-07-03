"use client";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://family-finance-backend-0r19.onrender.com";

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
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  try {
    return await apiRequest("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
  } catch (error) {
    return apiRequest("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  }
}

export async function register(nome, email, password) {
  try {
    return await apiRequest("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, password }),
    });
  } catch (error) {
    return apiRequest("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, password }),
    });
  }
}

export async function getDashboard(token, mes, ano) {
  return apiRequest(`/dashboard?mes=${mes}&ano=${ano}`, {}, token);
}
