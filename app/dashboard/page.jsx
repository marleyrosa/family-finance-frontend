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
import {
  createExpense,
  createIncome,
  deleteExpense,
  deleteIncome,
  getCurrentUser,
  getSplit,
  listExpenses,
  listIncomes,
  updateExpense,
  updateIncome,
} from "../../dashboard/api";

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

const SIDEBAR_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "transactions", label: "Transactions" },
  { id: "insights", label: "Insights" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const brl = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function DashboardPage() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
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

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpenseForm, setEditingExpenseForm] = useState({ category: CATEGORY_OPTIONS[0].api, amount: "" });
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [editingIncomeAmount, setEditingIncomeAmount] = useState("");

  const loadDashboard = async (authToken) => {
    const [meData, expensesData, incomesData, splitData] = await Promise.all([
      getCurrentUser(authToken),
      listExpenses(authToken),
      listIncomes(authToken),
      getSplit(authToken),
    ]);

    setUser(meData || null);
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

  const familyTotalIncome = useMemo(
    () => incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [incomes]
  );

  const familyTotalExpense = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );

  const familyBalance = familyTotalIncome - familyTotalExpense;

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
    { name: "This month", income: monthlyIncome, expenses: monthlyExpense },
    { name: "Family total", income: familyTotalIncome, expenses: familyTotalExpense },
  ];

  const goalProgress = goals.monthlyGoal > 0 ? Math.min((monthlyExpense / goals.monthlyGoal) * 100, 100) : 0;
  const savingsProgress = goals.savingsGoal > 0 ? Math.min((monthlySavings / goals.savingsGoal) * 100, 100) : 0;

  const recentTransactions = useMemo(() => {
    const items = [
      ...filteredExpenses.map((item) => ({
        id: `expense-${item.id}`,
        type: "expense",
        owner: item.user_email,
        category: API_CATEGORY_TO_LABEL[item.category] || item.category,
        amount: Number(item.amount || 0),
        created_at: item.created_at,
      })),
      ...filteredIncomes.map((item) => ({
        id: `income-${item.id}`,
        type: "income",
        owner: item.user_email,
        category: "Income",
        amount: Number(item.amount || 0),
        created_at: item.created_at,
      })),
    ];

    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
  }, [filteredExpenses, filteredIncomes]);

  const insights = useMemo(() => {
    const notes = [];

    if (monthlyIncome === 0) {
      notes.push({ level: "warning", text: "No income found for this month yet." });
    }

    if (committedPct >= 80) {
      notes.push({ level: "danger", text: `Expenses are consuming ${committedPct.toFixed(1)}% of monthly income.` });
    } else {
      notes.push({ level: "ok", text: `Healthy commitment level: ${committedPct.toFixed(1)}% of income.` });
    }

    if (goalProgress >= 100) {
      notes.push({ level: "danger", text: "Monthly budget goal exceeded. Consider reducing variable categories." });
    } else if (goals.monthlyGoal > 0) {
      notes.push({ level: "ok", text: `Budget goal usage is ${goalProgress.toFixed(1)}%.` });
    }

    if (savingsProgress >= 100) {
      notes.push({ level: "ok", text: "Savings target achieved for this month." });
    } else if (goals.savingsGoal > 0) {
      notes.push({ level: "warning", text: `Savings progress at ${savingsProgress.toFixed(1)}%.` });
    }

    const topCategory = expensesByCategory[0];
    if (topCategory) {
      notes.push({
        level: "warning",
        text: `${topCategory.category} is the top expense category at ${brl(topCategory.amount)} this month.`,
      });
    }

    return notes;
  }, [committedPct, expensesByCategory, goalProgress, goals.monthlyGoal, goals.savingsGoal, monthlyIncome, savingsProgress]);

  const ownerLabel = (email) => {
    if (!email) {
      return "Unknown";
    }
    if (user?.email && email === user.email) {
      return `${email} (you)`;
    }
    return email;
  };

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
      await createExpense(token, {
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
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
      await createIncome(token, { amount: Number(incomeForm.amount) });
      setIncomeForm({ amount: "" });
      await loadDashboard(token);
      setShowIncomeForm(false);
    } catch (err) {
      setError(err.message || "Erro ao adicionar renda");
    }
  };

  const handleExportExcel = () => {
    const rows = ["type,owner,category,amount,created_at"];
    for (const tx of recentTransactions) {
      rows.push(`${tx.type},${tx.owner},${tx.category},${tx.amount},${tx.created_at}`);
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

  const startEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setEditingExpenseForm({
      category: expense.category,
      amount: String(expense.amount),
    });
  };

  const saveEditExpense = async () => {
    if (!editingExpenseId) {
      return;
    }
    const amount = Number(editingExpenseForm.amount);
    if (!amount || amount <= 0) {
      setError("Informe um valor de despesa valido");
      return;
    }
    if (!ALLOWED_EXPENSE_CATEGORIES.has(editingExpenseForm.category)) {
      setError("Categoria invalida");
      return;
    }

    try {
      setError("");
      await updateExpense(token, editingExpenseId, {
        category: editingExpenseForm.category,
        amount,
      });
      setEditingExpenseId(null);
      await loadDashboard(token);
    } catch (err) {
      setError(err.message || "Erro ao editar despesa");
    }
  };

  const removeExpense = async (expenseId) => {
    if (!window.confirm("Excluir esta despesa?")) {
      return;
    }
    try {
      setError("");
      await deleteExpense(token, expenseId);
      await loadDashboard(token);
    } catch (err) {
      setError(err.message || "Erro ao excluir despesa");
    }
  };

  const startEditIncome = (income) => {
    setEditingIncomeId(income.id);
    setEditingIncomeAmount(String(income.amount));
  };

  const saveEditIncome = async () => {
    if (!editingIncomeId) {
      return;
    }

    const amount = Number(editingIncomeAmount);
    if (!amount || amount <= 0) {
      setError("Informe um valor de renda valido");
      return;
    }

    try {
      setError("");
      await updateIncome(token, editingIncomeId, { amount });
      setEditingIncomeId(null);
      setEditingIncomeAmount("");
      await loadDashboard(token);
    } catch (err) {
      setError(err.message || "Erro ao editar renda");
    }
  };

  const removeIncome = async (incomeId) => {
    if (!window.confirm("Excluir esta renda?")) {
      return;
    }
    try {
      setError("");
      await deleteIncome(token, incomeId);
      await loadDashboard(token);
    } catch (err) {
      setError(err.message || "Erro ao excluir renda");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  if (loading) {
    return <main className="p-6 text-slate-200">Carregando dashboard...</main>;
  }

  const userInitial = (user?.nome || user?.email || "F").slice(0, 1).toUpperCase();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(180,83,9,0.22),transparent_36%),radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.22),transparent_34%),linear-gradient(180deg,#06070b,#0f121c)] text-slate-100">
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 md:px-6 md:py-6 lg:grid-cols-[220px,1fr] lg:gap-6">
        <aside className="frosted sticky top-5 hidden h-fit rounded-3xl border border-white/10 p-4 lg:block">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">FamilYMoney</p>
          <nav className="mt-4 space-y-1">
            {SIDEBAR_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <motion.section variants={containerVariants} initial="hidden" animate="show" className="space-y-4 md:space-y-5">
          <motion.header variants={itemVariants} id="overview" className="frosted rounded-3xl border border-white/10 p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-violet-500 text-lg font-bold text-white">
                  {userInitial}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Welcome back</p>
                  <h1 className="font-display text-2xl font-semibold md:text-3xl">{user?.nome || "FamilYMoney User"}</h1>
                  <p className="text-sm text-slate-300">{user?.email || ""}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
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
                <button
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                  onClick={handleExportExcel}
                >
                  Export CSV
                </button>
                <button
                  className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              <input
                type="month"
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              />
              <select
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All categories</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                Family income total: <strong className="text-white">{brl(familyTotalIncome)}</strong>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                Family balance: <strong className="text-white">{brl(familyBalance)}</strong>
              </div>
            </div>
          </motion.header>

          {error ? <p className="rounded-xl bg-rose-500/20 p-3 text-sm text-rose-100">{error}</p> : null}

          <motion.section variants={itemVariants} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Monthly income", value: brl(monthlyIncome), tone: "from-sky-500/25 to-sky-300/5" },
              { title: "Monthly expenses", value: brl(monthlyExpense), tone: "from-fuchsia-500/25 to-fuchsia-300/5" },
              { title: "Monthly balance", value: brl(balance), tone: "from-emerald-500/25 to-emerald-300/5" },
              { title: "Income committed", value: `${committedPct.toFixed(1)}%`, tone: "from-orange-500/25 to-orange-300/5" },
            ].map((card) => (
              <div key={card.title} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.tone} p-4 backdrop-blur-xl`}>
                <p className="text-sm text-slate-300">{card.title}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{card.value}</h2>
              </div>
            ))}
          </motion.section>

          {showExpenseForm ? (
            <motion.section variants={itemVariants} className="frosted rounded-2xl border border-white/10 p-4">
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
            </motion.section>
          ) : null}

          {showIncomeForm ? (
            <motion.section variants={itemVariants} id="income" className="frosted rounded-2xl border border-white/10 p-4">
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
            </motion.section>
          ) : null}

          <motion.section variants={itemVariants} className="frosted rounded-2xl border border-white/10 p-4">
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
          </motion.section>

          <motion.section variants={itemVariants} id="expenses" className="frosted rounded-2xl border border-white/10 p-4">
            <h3 className="mb-3 text-lg font-semibold">Expense list</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-100">
                <thead>
                  <tr>
                    <th className="p-2">Owner</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => {
                    const isMine = user?.email && expense.user_email === user.email;
                    const isEditing = editingExpenseId === expense.id;
                    return (
                      <tr key={expense.id} className="border-t border-white/10">
                        <td className="p-2">{ownerLabel(expense.user_email)}</td>
                        <td className="p-2">
                          {isEditing ? (
                            <select
                              className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1"
                              value={editingExpenseForm.category}
                              onChange={(e) =>
                                setEditingExpenseForm((prev) => ({
                                  ...prev,
                                  category: e.target.value,
                                }))
                              }
                            >
                              {CATEGORY_OPTIONS.map((category) => (
                                <option key={category.key} value={category.api}>
                                  {category.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            API_CATEGORY_TO_LABEL[expense.category] || expense.category
                          )}
                        </td>
                        <td className="p-2">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              className="w-24 rounded-lg border border-white/10 bg-slate-950 px-2 py-1"
                              value={editingExpenseForm.amount}
                              onChange={(e) =>
                                setEditingExpenseForm((prev) => ({
                                  ...prev,
                                  amount: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            brl(expense.amount)
                          )}
                        </td>
                        <td className="p-2">{new Date(expense.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="p-2">
                          {isMine ? (
                            <div className="flex flex-wrap gap-1">
                              {isEditing ? (
                                <>
                                  <button className="rounded-lg bg-emerald-600 px-2 py-1 text-xs" onClick={saveEditExpense}>
                                    Save
                                  </button>
                                  <button className="rounded-lg bg-slate-700 px-2 py-1 text-xs" onClick={() => setEditingExpenseId(null)}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button className="rounded-lg bg-sky-600 px-2 py-1 text-xs" onClick={() => startEditExpense(expense)}>
                                    Edit
                                  </button>
                                  <button className="rounded-lg bg-rose-600 px-2 py-1 text-xs" onClick={() => removeExpense(expense.id)}>
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Read-only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="frosted rounded-2xl border border-white/10 p-4">
            <h3 className="mb-3 text-lg font-semibold">Income list</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-100">
                <thead>
                  <tr>
                    <th className="p-2">Owner</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncomes.map((income) => {
                    const isMine = user?.email && income.user_email === user.email;
                    const isEditing = editingIncomeId === income.id;
                    return (
                      <tr key={income.id} className="border-t border-white/10">
                        <td className="p-2">{ownerLabel(income.user_email)}</td>
                        <td className="p-2">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              className="w-24 rounded-lg border border-white/10 bg-slate-950 px-2 py-1"
                              value={editingIncomeAmount}
                              onChange={(e) => setEditingIncomeAmount(e.target.value)}
                            />
                          ) : (
                            brl(income.amount)
                          )}
                        </td>
                        <td className="p-2">{new Date(income.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="p-2">
                          {isMine ? (
                            <div className="flex flex-wrap gap-1">
                              {isEditing ? (
                                <>
                                  <button className="rounded-lg bg-emerald-600 px-2 py-1 text-xs" onClick={saveEditIncome}>
                                    Save
                                  </button>
                                  <button className="rounded-lg bg-slate-700 px-2 py-1 text-xs" onClick={() => setEditingIncomeId(null)}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button className="rounded-lg bg-sky-600 px-2 py-1 text-xs" onClick={() => startEditIncome(income)}>
                                    Edit
                                  </button>
                                  <button className="rounded-lg bg-rose-600 px-2 py-1 text-xs" onClick={() => removeIncome(income.id)}>
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Read-only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="frosted rounded-2xl border border-white/10 p-4">
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
                  {(split.users || []).map((entry) => (
                    <tr key={entry.user_email} className="border-t border-white/10">
                      <td className="p-2">{ownerLabel(entry.user_email)}</td>
                      <td className="p-2">{brl(entry.income)}</td>
                      <td className="p-2">{Number(entry.percentage || 0).toFixed(2)}%</td>
                      <td className="p-2">{brl(entry.amount_to_pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
            <article className="frosted rounded-2xl border border-white/10 p-4">
              <h3 className="mb-3 text-base font-semibold">Income vs expenses</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={totalExpenseChart}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip />
                    <Bar dataKey="income" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expenses" fill="#e11d48" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="frosted rounded-2xl border border-white/10 p-4">
              <h3 className="mb-3 text-base font-semibold">Pie by expense category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Pie data={expensesByCategory} dataKey="amount" nameKey="category" outerRadius={88} innerRadius={48}>
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="frosted rounded-2xl border border-white/10 p-4">
              <h3 className="mb-3 text-base font-semibold">Category % of income</h3>
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
            </article>
          </motion.section>

          <motion.section variants={itemVariants} id="transactions" className="frosted rounded-2xl border border-white/10 p-4">
            <h3 className="mb-3 text-lg font-semibold">Recent transactions</h3>
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {tx.type === "expense" ? "Expense" : "Income"} · {tx.category}
                    </p>
                    <p className="text-xs text-slate-400">
                      {ownerLabel(tx.owner)} · {new Date(tx.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${tx.type === "expense" ? "text-rose-300" : "text-emerald-300"}`}>
                    {tx.type === "expense" ? "-" : "+"}
                    {brl(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} id="insights" className="frosted rounded-2xl border border-white/10 p-4">
            <h3 className="mb-3 text-lg font-semibold">Monthly insights and alerts</h3>
            <div className="space-y-2">
              {insights.map((note, index) => (
                <div
                  key={`${note.text}-${index}`}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    note.level === "danger"
                      ? "bg-rose-500/15 text-rose-100"
                      : note.level === "ok"
                      ? "bg-emerald-500/15 text-emerald-100"
                      : "bg-amber-500/15 text-amber-100"
                  }`}
                >
                  {note.text}
                </div>
              ))}
            </div>
          </motion.section>
        </motion.section>
      </div>
    </main>
  );
}
