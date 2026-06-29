"use client";

import { useState } from "react";
import { login } from "../dashboard/api"; // usa sua API

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const data = await login(email, password);

      // ✅ salva token
      localStorage.setItem("family_finance_token", data.access_token);

      // ✅ redireciona para dashboard
      window.location.href = "/dashboard";

    } catch (err) {
      alert("Erro no login");
      console.error(err);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Senha"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
}
