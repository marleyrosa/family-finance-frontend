"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://family-finance-backend-0r19.onrender.com";

const DEFAULT_CATEGORIES = [
  "Supermercado",
  "Saude",
  "Transporte",
  "Serviços",
  "Casa",
  "Tecnologia",
  "Pessoal",
  "Gastos fixo",
];

const brl = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

async function authRequest(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Erro na API");
  }

  return data;
}

export default function DashboardPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total_expense: 0, total_income: 0, balance: 0 });
  const [split, setSplit] = useState({ users: [] });

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);

  const [expenseForm, setExpenseForm] = useState({ category: DEFAULT_CATEGORIES[0], amount: "" });
  const [incomeForm, setIncomeForm] = useState({ amount: "" });

  const loadDashboard = async (authToken) => {
    const [expensesData, summaryData, splitData] = await Promise.all([
      authRequest("/expenses", authToken),
      authRequest("/summary", authToken),
      authRequest("/split", authToken),
    ]);

    setExpenses(expensesData || []);
    setSummary(summaryData || { total_expense: 0, total_income: 0, balance: 0 });
    setSplit(splitData || { users: [] });
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || "";
    if (!savedToken) {
      window.location.href = "/";
      return;
    }

    setToken(savedToken);

    const run = async () => {
      try {
        await loadDashboard(savedToken);
      } catch (err) {
        setError(err.message || "Falha ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const expensesByCategory = useMemo(() => {
    const map = new Map();
    for (const item of expenses) {
      const category = item.category || "Sem categoria";
      const amount = Number(item.amount || 0);
      map.set(category, (map.get(category) || 0) + amount);
    }

    return Array.from(map.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [expenses]);

  const incomeByUser = useMemo(
    () =>
      (split.users || []).map((user) => ({
        user_email: user.user_email,
        income: Number(user.income || 0),
      })),
    [split.users]
  );

  const totalExpenseChart = useMemo(
    () => [
      { name: "Despesas", value: Number(summary.total_expense || 0) },
      { name: "Renda", value: Number(summary.total_income || 0) },
    ],
    [summary.total_expense, summary.total_income]
  );

  const handleAddExpense = async () => {
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      setError("Informe um valor de despesa valido");
      return;
    }

    try {
      setError("");
      await authRequest("/expense", token, {
        method: "POST",
        body: JSON.stringify({
          category: expenseForm.category,
          amount: Number(expenseForm.amount),
        }),
      });
      setExpenseForm({ category: DEFAULT_CATEGORIES[0], amount: "" });
      await loadDashboard(token);
      setShowExpenseForm(false);
    } catch (err) {
      setError(err.message || "Erro ao adicionar despesa");
    }
  };

  const handleAddIncome = async () => {
    if (!incomeForm.amount || Number(incomeForm.amount) <= 0) {
      setError("Informe um valor de renda valido");
      return;
    }

    try {
      setError("");
      await authRequest("/income", token, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(incomeForm.amount),
        }),
      });
      setIncomeForm({ amount: "" });
      await loadDashboard(token);
      setShowIncomeForm(false);
    } catch (err) {
      setError(err.message || "Erro ao adicionar renda");
    }
  };

  const handleExportExcel = () => {
    const rows = ["category,amount,created_at"];
    for (const expense of expenses) {
      rows.push(`${expense.category},${expense.amount},${expense.created_at}`);
    }

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  if (loading) {
    return <main className="p-6">Carregando dashboard...</main>;
  }

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-4 flex flex-wrap gap-2">
        <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={() => setShowExpenseForm((v) => !v)}>
          Add Expense
        </button>
        <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={() => setShowIncomeForm((v) => !v)}>
          Add Income
        </button>
        <button className="rounded bg-emerald-700 px-3 py-2 text-white" onClick={handleExportExcel}>
          Export Excel
        </button>
        <button className="rounded bg-rose-700 px-3 py-2 text-white" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error ? <p className="mb-4 rounded bg-rose-100 p-3 text-rose-800">{error}</p> : null}

      <section className="mb-4 grid gap-3 md:grid-cols-3">
        <article className="rounded border p-4">
          <p className="text-sm text-slate-500">Total Expense</p>
          <h2 className="text-xl font-semibold">{brl(summary.total_expense)}</h2>
        </article>
        <article className="rounded border p-4">
          <p className="text-sm text-slate-500">Total Income</p>
          <h2 className="text-xl font-semibold">{brl(summary.total_income)}</h2>
        </article>
        <article className="rounded border p-4">
          <p className="text-sm text-slate-500">Balance</p>
          <h2 className="text-xl font-semibold">{brl(summary.balance)}</h2>
        </article>
      </section>

      {showExpenseForm ? (
        <section className="mb-4 rounded border p-4">
          <h3 className="mb-3 text-lg font-semibold">New Expense</h3>
          <div className="grid gap-2 md:grid-cols-3">
            <select
              className="rounded border p-2"
              value={expenseForm.category}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {DEFAULT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              className="rounded border p-2"
              placeholder="Amount"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
            />
            <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={handleAddExpense}>
              Save Expense
            </button>
          </div>
        </section>
      ) : null}

      {showIncomeForm ? (
        <section className="mb-4 rounded border p-4">
          <h3 className="mb-3 text-lg font-semibold">New Income</h3>
          <div className="grid gap-2 md:grid-cols-3">
            <input
              type="number"
              step="0.01"
              className="rounded border p-2"
              placeholder="Amount"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({ amount: e.target.value })}
            />
            <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={handleAddIncome}>
              Save Income
            </button>
          </div>
        </section>
      ) : null}

      <section className="mb-6 rounded border p-4">
        <h3 className="mb-3 text-lg font-semibold">Expenses</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-2">Category</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t">
                  <td className="p-2">{expense.category}</td>
                  <td className="p-2">{brl(expense.amount)}</td>
                  <td className="p-2">{new Date(expense.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6 rounded border p-4">
        <h3 className="mb-3 text-lg font-semibold">Payment View</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-2">User</th>
                <th className="p-2">Income</th>
                <th className="p-2">Percentage</th>
                <th className="p-2">Amount to Pay</th>
              </tr>
            </thead>
            <tbody>
              {(split.users || []).map((user) => (
                <tr key={user.user_email} className="border-t">
                  <td className="p-2">{user.user_email}</td>
                  <td className="p-2">{brl(user.income)}</td>
                  <td className="p-2">{Number(user.percentage || 0).toFixed(2)}%</td>
                  <td className="p-2">{brl(user.amount_to_pay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded border p-4">
          <h3 className="mb-3 text-base font-semibold">Total Expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalExpenseChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded border p-4">
          <h3 className="mb-3 text-base font-semibold">Expenses by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#1d4ed8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded border p-4">
          <h3 className="mb-3 text-base font-semibold">Income per User</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie data={incomeByUser} dataKey="income" nameKey="user_email" outerRadius={90} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </main>
  );
}
