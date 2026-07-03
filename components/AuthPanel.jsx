"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function AuthPanel({ onLogin, onRegister, loading }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ nome: "", email: "", password: "" });

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (loading) {
      return;
    }
    if (mode === "login") {
      await onLogin(form.email, form.password);
      return;
    }
    await onRegister(form.nome, form.email, form.password);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-card/80 p-6 shadow-soft"
    >
      <h1 className="font-display text-2xl font-bold">FamilYMoney</h1>
      <p className="mt-1 text-sm text-slate-300">Gestao financeira familiar com divisao proporcional inteligente.</p>

      <div className="mt-5 flex gap-2 rounded-xl bg-slate-900/80 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === "login" ? "bg-accent/20" : "text-slate-400"}`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === "register" ? "bg-accent/20" : "text-slate-400"}`}
        >
          Cadastrar
        </button>
      </div>

      <form className="mt-4 space-y-3" onSubmit={submit}>
        {mode === "register" ? (
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            name="nome"
            value={form.nome}
            onChange={updateField}
            placeholder="Nome"
            required
          />
        ) : null}

        <input
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          type="email"
          name="email"
          value={form.email}
          onChange={updateField}
          placeholder="seuemail@dominio.com"
          required
        />

        <input
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          type="password"
          name="password"
          value={form.password}
          onChange={updateField}
          placeholder="Digite sua senha"
          required
        />

        <button type="submit" className="w-full rounded-xl bg-accent px-4 py-2 font-semibold text-slate-950" disabled={loading}>
          {loading ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>
    </motion.section>
  );
}
