"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

const CATEGORY_OPTIONS = [
  { key: "supermarket", label: "Supermarket", api: "Supermercado" },
  { key: "health", label: "Health", api: "Saude" },
  { key: "transport", label: "Transport", api: "Transporte" },
  { key: "services", label: "Services", api: "Serviços" },
  { key: "home", label: "Home", api: "Casa" },
  { key: "technology", label: "Technology", api: "Tecnologia" },
  { key: "personal", label: "Personal", api: "Pessoal" },
  { key: "fixed", label: "Fixed expenses", api: "Gastos fixo" },
];

// TODO completed: keep frontend expense payload categories aligned with backend DEFAULT_CATEGORIES.
const ALLOWED_EXPENSE_CATEGORIES = new Set(CATEGORY_OPTIONS.map((category) => category.api));

const API_CATEGORY_TO_LABEL = {
  Supermercado: "Supermarket",
  Saude: "Health",
  Transporte: "Transport",
  "Serviços": "Services",
  Casa: "Home",
  Tecnologia: "Technology",
  Pessoal: "Personal",
  "Gastos fixo": "Fixed expenses",
};

const PIE_COLORS = ["#9f7aea", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#ec4899", "#22c55e", "#6366f1"];

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

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
  const [incomes, setIncomes] = useState([]);
  const [split, setSplit] = useState({ users: [] });

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);

  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [expenseForm, setExpenseForm] = useState({ category: CATEGORY_OPTIONS[0].api, amount: "" });
  const [incomeForm, setIncomeForm] = useState({ amount: "" });
  const [goals, setGoals] = useState({ monthlyGoal: 0, savingsGoal: 0 });

  const loadDashboard = async (authToken) => {
    const [expensesData, incomesData, splitData] = await Promise.all([
      authRequest("/expenses", authToken),
      authRequest("/incomes", authToken),
      authRequest("/split", authToken),
    ]);

    setExpenses(expensesData || []);
    setIncomes(incomesData || []);
    setSplit(splitData || { users: [] });
  };

  useEffect(() => {
    const stored = localStorage.getItem("finance_goals");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setGoals({
          monthlyGoal: Number(parsed.monthlyGoal || 0),
          savingsGoal: Number(parsed.savingsGoal || 0),
        });
      } catch {
        setGoals({ monthlyGoal: 0, savingsGoal: 0 });
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("finance_goals", JSON.stringify(goals));
  }, [goals]);

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

  const filteredExpenses = useMemo(() => {
    const [year, month] = monthFilter.split("-").map(Number);
    return expenses.filter((item) => {
      const d = new Date(item.created_at);
      const sameMonth = d.getFullYear() === year && d.getMonth() + 1 === month;
      if (!sameMonth) return false;
      if (categoryFilter === "all") return true;
      const selected = CATEGORY_OPTIONS.find((c) => c.key === categoryFilter);
      return item.category === selected?.api;
    });
  }, [expenses, monthFilter, categoryFilter]);

  const filteredIncomes = useMemo(() => {
    const [year, month] = monthFilter.split("-").map(Number);
    return incomes.filter((item) => {
      const d = new Date(item.created_at);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }, [incomes, monthFilter]);

  const monthlyIncome = useMemo(
    () => filteredIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [filteredIncomes]
  );

  const monthlyExpense = useMemo(
    () => filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [filteredExpenses]
  );

  const balance = monthlyIncome - monthlyExpense;
  const committedPct = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 0;
  const monthlySavings = Math.max(balance, 0);

  const expensesByCategory = useMemo(() => {
    const map = new Map();
    for (const item of filteredExpenses) {
      const category = API_CATEGORY_TO_LABEL[item.category] || item.category || "Other";
      const amount = Number(item.amount || 0);
      map.set(category, (map.get(category) || 0) + amount);
    }

    return Array.from(map.entries()).map(([category, amount]) => ({
      category,
      amount,
      pct_income: monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0,
    }));
  }, [filteredExpenses, monthlyIncome]);

  const commitmentByCategory = useMemo(
    () =>
      expensesByCategory.map((item) => ({
        category: item.category,
        percentage: Number(item.pct_income.toFixed(2)),
      })),
    [expensesByCategory]
  );

  const totalExpenseChart = [
    { name: "Income", value: monthlyIncome },
    { name: "Expenses", value: monthlyExpense },
  ];

  const goalProgress = goals.monthlyGoal > 0 ? Math.min((monthlyExpense / goals.monthlyGoal) * 100, 100) : 0;
  const savingsProgress = goals.savingsGoal > 0 ? Math.min((monthlySavings / goals.savingsGoal) * 100, 100) : 0;

  const handleAddExpense = async () => {
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      setError("Informe um valor de despesa valido");
      return;
    }

    if (!ALLOWED_EXPENSE_CATEGORIES.has(expenseForm.category)) {
      setError("Categoria invalida");
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
      setExpenseForm({ category: CATEGORY_OPTIONS[0].api, amount: "" });
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
    for (const expense of filteredExpenses) {
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
    return <main className="p-6 text-slate-200">Carregando dashboard...</main>;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,_rgba(168,85,247,0.28),_transparent_40%),radial-gradient(circle_at_90%_10%,_rgba(14,165,233,0.18),_transparent_35%),linear-gradient(180deg,#040508,#0a0d14)] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Nu-Style Finance Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">Monthly control, category commitment, goals and savings.</p>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            className="rounded-xl bg-fuchsia-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-500"
            onClick={() => setShowExpenseForm((v) => !v)}
          >
          Add Expense
          </button>
          <button
            className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
            onClick={() => setShowIncomeForm((v) => !v)}
          >
          Add Income
          </button>
          <button className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500" onClick={handleExportExcel}>
          Export Excel
          </button>
          <button className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500" onClick={handleLogout}>
          Logout
          </button>

          <input
            type="month"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
          <select
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option className="text-slate-900" value="all">All categories</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option className="text-slate-900" key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="mb-4 rounded-xl bg-rose-500/20 p-3 text-rose-100">{error}</p> : null}

        <section className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Monthly income", value: brl(monthlyIncome), tone: "from-sky-500/20 to-sky-300/5" },
            { title: "Monthly expenses", value: brl(monthlyExpense), tone: "from-fuchsia-500/20 to-fuchsia-300/5" },
            { title: "Balance", value: brl(balance), tone: "from-emerald-500/20 to-emerald-300/5" },
            { title: "Income committed", value: `${committedPct.toFixed(1)}%`, tone: "from-orange-500/20 to-orange-300/5" },
          ].map((card, index) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.tone} p-4 backdrop-blur-xl`}
            >
              <p className="text-sm text-slate-300">{card.title}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{card.value}</h2>
            </motion.article>
          ))}
        </section>

      {showExpenseForm ? (
        <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <h3 className="mb-3 text-lg font-semibold">New Expense</h3>
          <div className="grid gap-2 md:grid-cols-3">
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2"
              value={expenseForm.category}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.key} value={category.api}>
                  {category.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2"
              placeholder="Amount"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
            />
            <button className="rounded-xl bg-fuchsia-600 px-3 py-2 font-medium text-white" onClick={handleAddExpense}>
              Save Expense
            </button>
          </div>
        </section>
      ) : null}

      {showIncomeForm ? (
        <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <h3 className="mb-3 text-lg font-semibold">New Income</h3>
          <div className="grid gap-2 md:grid-cols-3">
            <input
              type="number"
              step="0.01"
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2"
              placeholder="Amount"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({ amount: e.target.value })}
            />
            <button className="rounded-xl bg-sky-600 px-3 py-2 font-medium text-white" onClick={handleAddIncome}>
              Save Income
            </button>
          </div>
        </section>
      ) : null}

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <h3 className="mb-3 text-lg font-semibold">Goals and savings</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Monthly budget goal</label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2"
              value={goals.monthlyGoal}
              onChange={(e) => setGoals((prev) => ({ ...prev, monthlyGoal: Number(e.target.value || 0) }))}
            />
            <div className="mt-2 h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full bg-fuchsia-500" style={{ width: `${goalProgress}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-300">Used {goalProgress.toFixed(1)}% of monthly goal</p>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Savings target</label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2"
              value={goals.savingsGoal}
              onChange={(e) => setGoals((prev) => ({ ...prev, savingsGoal: Number(e.target.value || 0) }))}
            />
            <div className="mt-2 h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${savingsProgress}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-300">Saved {brl(monthlySavings)} ({savingsProgress.toFixed(1)}%)</p>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <h3 className="mb-3 text-lg font-semibold">Expense list</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-100">
            <thead>
              <tr>
                <th className="p-2">Category</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-t border-white/10">
                  <td className="p-2">{API_CATEGORY_TO_LABEL[expense.category] || expense.category}</td>
                  <td className="p-2">{brl(expense.amount)}</td>
                  <td className="p-2">{new Date(expense.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <h3 className="mb-3 text-lg font-semibold">Household split</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-100">
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
                <tr key={user.user_email} className="border-t border-white/10">
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
        <motion.article
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
        >
          <h3 className="mb-3 text-base font-semibold">Income vs expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalExpenseChart}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
        >
          <h3 className="mb-3 text-base font-semibold">Expenses by category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie data={expensesByCategory} dataKey="amount" nameKey="category" outerRadius={90}>
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
        >
          <h3 className="mb-3 text-base font-semibold">Income committed by category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commitmentByCategory}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="category" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip />
                <Bar dataKey="percentage" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>
      </section>
      </div>
    </main>
  );
}
