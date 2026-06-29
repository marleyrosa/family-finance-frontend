"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch(
        "https://family-finance-backend.onrender.com/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            senha: password,
          }),
        }
      );

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        throw new Error(data.detail || "Erro no login");
      }

      localStorage.setItem("token", data.access_token);
      window.location.href = "/dashboard";
    } catch (err) {
      alert("Erro no login");
      console.error(err);
    }
  };

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
