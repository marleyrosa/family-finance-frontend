"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "./api";

export default function Dashboard() {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("family_finance_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    carregarDashboard(token);
  }, []);

  async function carregarDashboard(token) {
    try {
      const data = await apiRequest(
        "/dashboard?mes=6&ano=2026",
        {},
        token
      );

      console.log("DADOS:", data);
      setDados(data);

    } catch (err) {
      console.error("Erro ao carregar:", err);
      alert("Erro ao carregar dashboard");
    }
  }

  if (!dados) return <p>Carregando...</p>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <h2>Resumo</h2>
      <p>Total despesas: R$ {dados.cards.total_despesas}</p>
      <p>Total renda: R$ {dados.cards.total_renda}</p>
      <p>Saldo: R$ {dados.cards.saldo}</p>

      <h2>Previsão</h2>
      <p>R$ {dados.previsao_gastos}</p>

      <h2>Meta</h2>
      <p>{dados.meta?.status}</p>

      <h2>Despesas</h2>

      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "20px"
      }}>
        <thead style={{ backgroundColor: "#222", color: "#fff" }}>
          <tr>
            <th style={{ padding: "10px", border: "1px solid #444" }}>Data</th>
            <th style={{ padding: "10px", border: "1px solid #444" }}>Descrição</th>
            <th style={{ padding: "10px", border: "1px solid #444" }}>Categoria</th>
            <th style={{ padding: "10px", border: "1px solid #444" }}>Valor</th>
          </tr>
        </thead>

        <tbody>
          {dados.itens.map((item, i) => (
            <tr key={i}>
              <td style={{ padding: "8px", border: "1px solid #444" }}>
                {item.data}
              </td>
              <td style={{ padding: "8px", border: "1px solid #444" }}>
                {item.descricao}
              </td>
              <td style={{ padding: "8px", border: "1px solid #444" }}>
                {item.categoria}
              </td>
              <td style={{ 
                padding: "8px", 
                border: "1px solid #444",
                color: "red",
                fontWeight: "bold"
              }}>
                R$ {item.valor}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
