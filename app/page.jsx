"use client";

import { useState } from "react";

import AuthPanel from "../components/AuthPanel";
import { login as loginRequest, register as registerRequest } from "../dashboard/api";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(email, password) {
    setLoading(true);
    setError("");
    try {
      const data = await loginRequest(email, password);
      localStorage.setItem("token", data.access_token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Erro no login");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(nome, email, password) {
    setLoading(true);
    setError("");
    try {
      await registerRequest(nome, email, password);
      const data = await loginRequest(email, password);
      localStorage.setItem("token", data.access_token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Erro no cadastro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <AuthPanel onLogin={handleLogin} onRegister={handleRegister} loading={loading} />
        {error ? (
          <p className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-center text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
