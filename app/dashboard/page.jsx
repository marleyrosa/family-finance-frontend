"use client";

import { useEffect, useState } from "react";

import { getDashboard } from "../../dashboard/api";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    const now = new Date();

    const loadData = async () => {
      try {
        const dashboardData = await getDashboard(token, now.getMonth() + 1, now.getFullYear());
        setData(dashboardData);
      } catch (err) {
        console.error(err);
        if (err.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/";
          return;
        }
        setError("Erro ao carregar dashboard");
      }
    };

    loadData();
  }, []);

  if (error) {
    return <main style={{ padding: 40 }}>{error}</main>;
  }

  if (!data) {
    return <main style={{ padding: 40 }}>Carregando...</main>;
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Usuario: {data.usuario}</p>

      <h2>Resumo</h2>
      <p>Total despesas: R$ {data.cards.total_despesas}</p>
      <p>Total renda: R$ {data.cards.total_renda}</p>
      <p>Saldo: R$ {data.cards.saldo}</p>

      <h2>Gastos por categoria</h2>
      <ul>
        {data.gastos_por_categoria.map((item) => (
          <li key={item.categoria}>
            {item.categoria}: R$ {item.valor}
          </li>
        ))}
      </ul>
    </main>
  );
}
