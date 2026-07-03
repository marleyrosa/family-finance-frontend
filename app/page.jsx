"use client";

import { useState } from "react";

import AuthPanel from "../components/AuthPanel";
import { login as loginRequest, register as registerRequest } from "../dashboard/api";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  async function handleLogin(email, password) {
    setLoading(true);
    setError("");
    try {
      const data = await loginRequest(email, password);
      localStorage.setItem("token", data.access_token);
      showToast("success", "Login realizado com sucesso. Redirecionando...");
      window.location.href = "/dashboard";
    } catch (err) {
      const message = err.message || "Erro ao fazer login";
      setError(message);
      showToast("error", message);
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
      showToast("success", "Conta criada com sucesso. Redirecionando...");
      window.location.href = "/dashboard";
    } catch (err) {
      const message = err.message || "Erro ao criar conta";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {toast ? (
          <p
            className={`mb-3 rounded-xl border px-3 py-2 text-center text-sm ${
              toast.type === "success"
                ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
                : "border-rose-400/40 bg-rose-500/20 text-rose-100"
            }`}
          >
            {toast.message}
          </p>
        ) : null}
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
