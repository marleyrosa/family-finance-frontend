"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
  { key: "supermarket", label: "Supermercado", api: "Supermercado" },
  { key: "health", label: "Saude", api: "Saude" },
  { key: "transport", label: "Transporte", api: "Transporte" },
  { key: "services", label: "Servicos", api: "Serviços" },
  { key: "home", label: "Casa", api: "Casa" },
  { key: "technology", label: "Tecnologia", api: "Tecnologia" },
  { key: "personal", label: "Pessoal", api: "Pessoal" },
  { key: "fixed", label: "Gastos fixos", api: "Gastos fixo" },
];

const ALLOWED_EXPENSE_CATEGORIES = new Set(CATEGORY_OPTIONS.map((category) => category.api));

const API_CATEGORY_TO_LABEL = {
  Supermercado: "Supermercado",
  Saude: "Saude",
  Transporte: "Transporte",
  "Serviços": "Servicos",
  Casa: "Casa",
  Tecnologia: "Tecnologia",
  Pessoal: "Pessoal",
  "Gastos fixo": "Gastos fixos",
};

const PIE_COLORS = ["#9f7aea", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#ec4899", "#22c55e", "#6366f1"];
const BAR_COLORS = ["#38bdf8", "#f43f5e", "#a78bfa", "#f59e0b", "#34d399", "#fb7185", "#22d3ee", "#818cf8"];

const SIDEBAR_ITEMS = [
  { id: "overview", label: "Visao geral" },
  { id: "income", label: "Receitas" },
  { id: "expenses", label: "Despesas" },
  { id: "transactions", label: "Transacoes" },
  { id: "insights", label: "Insights automaticos" },
];

const TOAST_STYLES = {
  success: "border-emerald-400/40 bg-emerald-500/20 text-emerald-100",
  error: "border-rose-400/40 bg-rose-500/20 text-rose-100",
  warning: "border-amber-400/40 bg-amber-500/20 text-amber-100",
};

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

const monthKeyFromValue = (value) => String(value || "").slice(0, 7);

const monthValueFromDate = (value) => monthKeyFromValue(value) || currentMonth();

const competenceDateFromMonth = (value) => `${monthKeyFromValue(value)}-01`;

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
  const [searchField, setSearchField] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const [expenseForm, setExpenseForm] = useState({ category: CATEGORY_OPTIONS[0].api, amount: "", competence: currentMonth() });
  const [incomeForm, setIncomeForm] = useState({ amount: "", competence: currentMonth() });
  const [goals, setGoals] = useState({ monthlyGoal: 0, savingsGoal: 0 });

  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [toasts, setToasts] = useState([]);
  const lastNotificationKey = useRef("");

  const pushToast = (type, title, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4600);
  };

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
    const storedAvatar = localStorage.getItem("familymoney_avatar_url") || "";
    setAvatarUrl(storedAvatar);
    setNotificationEnabled(typeof Notification !== "undefined" && Notification.permission === "granted");
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
    setExpenseForm((prev) => ({ ...prev, competence: monthFilter }));
    setIncomeForm((prev) => ({ ...prev, competence: monthFilter }));
  }, [monthFilter]);

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
        const message = err.message || "Falha ao carregar dashboard";
        setError(message);
        pushToast("error", "Erro ao carregar", message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      if (monthKeyFromValue(item.competencia || item.created_at) !== monthFilter) return false;
      if (categoryFilter === "all") return true;
      const selected = CATEGORY_OPTIONS.find((c) => c.key === categoryFilter);
      return item.category === selected?.api;
    });
  }, [expenses, monthFilter, categoryFilter]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => monthKeyFromValue(item.competencia || item.created_at) === monthFilter);
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
    { name: "Mes selecionado", income: monthlyIncome, expenses: monthlyExpense },
    { name: "Total familiar", income: familyTotalIncome, expenses: familyTotalExpense },
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
        competence: item.competencia || item.created_at,
      })),
      ...filteredIncomes.map((item) => ({
        id: `income-${item.id}`,
        type: "income",
        owner: item.user_email,
        category: "Receitas",
        amount: Number(item.amount || 0),
        competence: item.competencia || item.created_at,
      })),
    ];

    return items.sort((a, b) => new Date(b.competence).getTime() - new Date(a.competence).getTime()).slice(0, 10);
  }, [filteredExpenses, filteredIncomes]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const buildTransactionDescription = (tx) => {
    if (tx.description || tx.descricao) {
      return String(tx.description || tx.descricao);
    }
    return `${tx.type === "expense" ? "Despesa" : "Receita"} ${tx.category}`;
  };

  const matchesSearch = (tx) => {
    if (!normalizedSearch) {
      return true;
    }

    const description = buildTransactionDescription(tx).toLowerCase();
    const category = String(tx.category || "").toLowerCase();
    const owner = String(tx.owner || "").toLowerCase();

    if (searchField === "description") {
      return description.includes(normalizedSearch);
    }
    if (searchField === "category") {
      return category.includes(normalizedSearch);
    }
    if (searchField === "user") {
      return owner.includes(normalizedSearch);
    }

    return description.includes(normalizedSearch) || category.includes(normalizedSearch) || owner.includes(normalizedSearch);
  };

  const searchableTransactions = useMemo(
    () => recentTransactions.filter((tx) => matchesSearch(tx)),
    [recentTransactions, normalizedSearch, searchField]
  );

  const searchedExpenses = useMemo(
    () =>
      filteredExpenses.filter((item) =>
        matchesSearch({
          type: "expense",
          owner: item.user_email,
          category: API_CATEGORY_TO_LABEL[item.category] || item.category,
          description: item.description || item.descricao,
        })
      ),
    [filteredExpenses, normalizedSearch, searchField]
  );

  const searchedIncomes = useMemo(
    () =>
      filteredIncomes.filter((item) =>
        matchesSearch({
          type: "income",
          owner: item.user_email,
          category: "Receitas",
          description: item.description || item.descricao,
        })
      ),
    [filteredIncomes, normalizedSearch, searchField]
  );

  const insights = useMemo(() => {
    const notes = [];

    if (monthlyIncome === 0) {
      notes.push({ level: "warning", text: "Nenhuma receita encontrada para este mes." });
    }

    if (committedPct >= 80) {
      notes.push({ level: "danger", text: `As despesas estao consumindo ${committedPct.toFixed(1)}% das receitas do mes.` });
    } else {
      notes.push({ level: "ok", text: `Comprometimento saudavel: ${committedPct.toFixed(1)}% das receitas.` });
    }

    if (goalProgress >= 100) {
      notes.push({ level: "danger", text: "Orcamento mensal estourado. Revise categorias variaveis." });
    } else if (goals.monthlyGoal > 0) {
      notes.push({ level: "ok", text: `Uso da meta de orcamento: ${goalProgress.toFixed(1)}%.` });
    }

    if (savingsProgress >= 100) {
      notes.push({ level: "ok", text: "Meta de economia atingida neste mes." });
    } else if (goals.savingsGoal > 0) {
      notes.push({ level: "warning", text: `Progresso da meta de economia: ${savingsProgress.toFixed(1)}%.` });
    }

    const topCategory = expensesByCategory[0];
    if (topCategory) {
      notes.push({
        level: "warning",
        text: `${topCategory.category} e a principal categoria de despesa com ${brl(topCategory.amount)} no mes.`,
      });
    }

    return notes;
  }, [committedPct, expensesByCategory, goalProgress, goals.monthlyGoal, goals.savingsGoal, monthlyIncome, savingsProgress]);

  const ownerLabel = (email) => {
    if (!email) {
      return "Nao informado";
    }
    if (user?.email && email === user.email) {
      return `${email} (voce)`;
    }
    return email;
  };

  const sendLocalNotification = async (title, body) => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return;
    }
    if (Notification.permission !== "granted") {
      return;
    }

    try {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          body,
        });
      } else {
        new Notification(title, { body, icon: "/icons/icon-192.svg" });
      }
    } catch {
      // no-op: keep dashboard usable even without notifications.
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      pushToast("warning", "Notificacoes indisponiveis", "Seu navegador nao suporta notificacoes locais.");
      return;
    }

    const permission = await Notification.requestPermission();
    const enabled = permission === "granted";
    setNotificationEnabled(enabled);
    if (enabled) {
      pushToast("success", "Notificacoes ativadas", "Lembretes financeiros locais foram ativados.");
      await sendLocalNotification("FamilYMoney", "Notificacoes financeiras ativadas com sucesso.");
    } else {
      pushToast("warning", "Permissao negada", "Ative notificacoes no navegador para receber lembretes.");
    }
  };

  useEffect(() => {
    if (loading) {
      return;
    }

    const currentKey = `${monthFilter}-${monthlyIncome}-${monthlyExpense}-${goalProgress}-${savingsProgress}`;
    if (lastNotificationKey.current === currentKey) {
      return;
    }
    lastNotificationKey.current = currentKey;

    pushToast(
      "success",
      "Resumo mensal",
      `Receitas: ${brl(monthlyIncome)} | Despesas: ${brl(monthlyExpense)} | Saldo Familiar: ${brl(familyBalance)}`
    );
    sendLocalNotification(
      "Resumo financeiro mensal",
      `Receitas ${brl(monthlyIncome)} e despesas ${brl(monthlyExpense)}.`
    );

    if (committedPct >= 80) {
      pushToast("warning", "Alerta de orcamento", `Despesas em ${committedPct.toFixed(1)}% das receitas do mes.`);
      sendLocalNotification("Alerta de orcamento", `Despesas em ${committedPct.toFixed(1)}% das receitas.`);
    }

    if (goals.savingsGoal > 0) {
      if (savingsProgress >= 100) {
        pushToast("success", "Meta de economia", "Parabens, sua meta de economia foi atingida.");
        sendLocalNotification("Meta de economia atingida", "Parabens! Voce atingiu sua meta de economia.");
      } else {
        pushToast("warning", "Meta de economia", `Progresso atual: ${savingsProgress.toFixed(1)}%.`);
      }
    }

    if (insights[0]?.text) {
      pushToast("warning", "Insight automatico", insights[0].text);
    }
  }, [
    committedPct,
    familyBalance,
    goalProgress,
    goals.savingsGoal,
    insights,
    loading,
    monthFilter,
    monthlyExpense,
    monthlyIncome,
    savingsProgress,
  ]);

  useEffect(() => {
    if (loading || !notificationEnabled) {
      return;
    }

    const reminderKey = `familymoney_reminder_${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(reminderKey)) {
      return;
    }

    localStorage.setItem(reminderKey, "sent");
    sendLocalNotification("Lembrete financeiro", "Registre suas receitas e despesas do dia no FamilYMoney.");
  }, [loading, notificationEnabled]);

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
        competencia: competenceDateFromMonth(expenseForm.competence || monthFilter),
      });
      setExpenseForm({ category: CATEGORY_OPTIONS[0].api, amount: "", competence: monthFilter });
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
      await createIncome(token, {
        amount: Number(incomeForm.amount),
        competencia: competenceDateFromMonth(incomeForm.competence || monthFilter),
      });
      setIncomeForm({ amount: "", competence: monthFilter });
      await loadDashboard(token);
      setShowIncomeForm(false);
    } catch (err) {
      setError(err.message || "Erro ao adicionar renda");
    }
  };

  const handleExportExcel = () => {
    const rows = ["type,owner,category,amount,competencia"];
    for (const tx of recentTransactions) {
      rows.push(`${tx.type},${tx.owner},${tx.category},${tx.amount},${tx.competence}`);
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

  const previousMonthFilter = useMemo(() => {
    const [year, month] = monthFilter.split("-").map(Number);
    const current = new Date(year, month - 1, 1);
    current.setMonth(current.getMonth() - 1);
    return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
  }, [monthFilter]);

  const previousMonthMetrics = useMemo(() => {
    const [year, month] = previousMonthFilter.split("-").map(Number);
    const prevExpenses = expenses.filter((item) => {
      return monthKeyFromValue(item.competencia || item.created_at) === previousMonthFilter;
    });
    const prevIncomes = incomes.filter((item) => {
      return monthKeyFromValue(item.competencia || item.created_at) === previousMonthFilter;
    });

    const prevExpenseTotal = prevExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const prevIncomeTotal = prevIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return {
      income: prevIncomeTotal,
      expense: prevExpenseTotal,
      balance: prevIncomeTotal - prevExpenseTotal,
    };
  }, [expenses, incomes, previousMonthFilter]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const monthLabel = monthFilter;

    doc.setFontSize(16);
    doc.text("FamilYMoney - Relatorio Financeiro Mensal", 14, 16);
    doc.setFontSize(10);
    doc.text(`Mes de referencia: ${monthLabel}`, 14, 24);

    doc.setFontSize(12);
    doc.text("Resumo mensal", 14, 34);
    autoTable(doc, {
      startY: 38,
      head: [["Indicador", "Valor"]],
      body: [
        ["Receitas", brl(monthlyIncome)],
        ["Despesas", brl(monthlyExpense)],
        ["Saldo", brl(balance)],
        ["Saldo Familiar", brl(familyBalance)],
        ["Comprometimento", `${committedPct.toFixed(1)}%`],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Resumo", "Mes selecionado", "Mes anterior"]],
      body: [
        ["Receitas", brl(monthlyIncome), brl(previousMonthMetrics.income)],
        ["Despesas", brl(monthlyExpense), brl(previousMonthMetrics.expense)],
        ["Saldo", brl(balance), brl(previousMonthMetrics.balance)],
      ],
      theme: "striped",
      styles: { fontSize: 9 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Categoria", "Despesa", "% das Receitas"]],
      body: expensesByCategory.map((item) => [item.category, brl(item.amount), `${item.pct_income.toFixed(1)}%`]),
      theme: "grid",
      styles: { fontSize: 9 },
    });

    const chartY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(11);
    doc.text("Analise visual por categoria (barra simplificada)", 14, chartY);
    let rowY = chartY + 6;
    const maxPct = Math.max(1, ...commitmentByCategory.map((item) => item.percentage));
    commitmentByCategory.slice(0, 6).forEach((item) => {
      const width = (item.percentage / maxPct) * 90;
      doc.text(item.category, 14, rowY);
      doc.setFillColor(90, 103, 216);
      doc.rect(70, rowY - 3, width, 4, "F");
      doc.text(`${item.percentage.toFixed(1)}%`, 165, rowY);
      rowY += 8;
    });

    doc.save(`relatorio_financeiro_${monthFilter}.pdf`);
    pushToast("success", "PDF gerado", "Relatorio financeiro mensal exportado com sucesso.");
  };

  const openEditExpenseModal = (expense) => {
    setEditModal({
      type: "expense",
      id: expense.id,
      category: expense.category,
      amount: String(expense.amount),
      competence: monthValueFromDate(expense.competencia || expense.created_at),
    });
  };

  const openEditIncomeModal = (income) => {
    setEditModal({
      type: "income",
      id: income.id,
      amount: String(income.amount),
      competence: monthValueFromDate(income.competencia || income.created_at),
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal?.id) {
      return;
    }

    const amount = Number(editModal.amount);
    if (!amount || amount <= 0) {
      setError(editModal.type === "expense" ? "Informe um valor de despesa valido" : "Informe um valor de renda valido");
      pushToast("error", "Valor invalido", "Informe um valor maior que zero.");
      return;
    }

    if (editModal.type === "expense" && !ALLOWED_EXPENSE_CATEGORIES.has(editModal.category)) {
      setError("Categoria invalida");
      pushToast("error", "Categoria invalida", "Selecione uma categoria valida.");
      return;
    }

    try {
      setError("");

      if (editModal.type === "expense") {
        await updateExpense(token, editModal.id, {
          category: editModal.category,
          amount,
          competencia: competenceDateFromMonth(editModal.competence || monthFilter),
        });
        pushToast("success", "Despesa atualizada", "Lancamento atualizado com sucesso.");
      } else {
        await updateIncome(token, editModal.id, {
          amount,
          competencia: competenceDateFromMonth(editModal.competence || monthFilter),
        });
        pushToast("success", "Receita atualizada", "Lancamento atualizado com sucesso.");
      }

      setEditModal(null);
      await loadDashboard(token);
    } catch (err) {
      const message = err.message || "Erro ao editar lancamento";
      setError(message);
      pushToast("error", "Erro ao editar", message);
    }
  };

  const openDeleteModal = (type, id) => {
    setDeleteModal({ type, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal?.id) {
      return;
    }

    try {
      setError("");

      if (deleteModal.type === "expense") {
        await deleteExpense(token, deleteModal.id);
        pushToast("warning", "Despesa excluida", "Lancamento removido com sucesso.");
      } else {
        await deleteIncome(token, deleteModal.id);
        pushToast("warning", "Receita excluida", "Lancamento removido com sucesso.");
      }

      setDeleteModal(null);
      await loadDashboard(token);
    } catch (err) {
      const message = err.message || "Erro ao excluir lancamento";
      setError(message);
      pushToast("error", "Erro ao excluir", message);
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      pushToast("error", "Arquivo invalido", "Selecione uma imagem para avatar.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setAvatarUrl(result);
      localStorage.setItem("familymoney_avatar_url", result);
      pushToast("success", "Avatar atualizado", "Sua foto de perfil foi atualizada.");
    };
    reader.onerror = () => {
      pushToast("error", "Erro no upload", "Nao foi possivel carregar a imagem.");
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const familyMembersCount = (split.users || []).length;
  const userDisplayName = user?.nome || user?.email || "Usuario FamilYMoney";
  const hasCustomAvatar = Boolean(avatarUrl);
  const profileAvatarUrl = avatarUrl;

  if (loading) {
    return <main className="p-6 text-slate-200">Carregando dashboard...</main>;
  }

  const userInitial = (user?.nome || user?.email || "F").slice(0, 1).toUpperCase();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(180,83,9,0.22),transparent_36%),radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.22),transparent_34%),linear-gradient(180deg,#06070b,#0f121c)] text-slate-100">
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 md:px-6 md:py-6 lg:grid-cols-[220px,1fr] lg:gap-6">
        <motion.aside
          initial={{ opacity: 0, x: -22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="frosted sticky top-5 hidden h-fit rounded-3xl border border-white/10 p-4 lg:block"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">FamilYMoney</p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-900">
                {hasCustomAvatar ? (
                  <img src={profileAvatarUrl} alt={userDisplayName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-violet-500 text-base font-bold text-white">
                    {userInitial}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{userDisplayName}</p>
                <p className="truncate text-xs text-slate-400">{user?.email || ""}</p>
              </div>
            </div>
            <label className="mt-2 block cursor-pointer rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-center text-xs text-slate-200 hover:bg-slate-900">
              Enviar foto do perfil
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
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
        </motion.aside>

        <motion.section variants={containerVariants} initial="hidden" animate="show" className="space-y-4 md:space-y-5">
          <motion.header variants={itemVariants} id="overview" className="frosted rounded-3xl border border-white/10 p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-violet-500 text-lg font-bold text-white">
                  {hasCustomAvatar ? (
                    <img src={profileAvatarUrl} alt={userDisplayName} className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-slate-900 bg-emerald-400" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bem-vindo de volta</p>
                  <h1 className="font-display text-2xl font-semibold md:text-3xl">{userDisplayName}</h1>
                  <p className="text-sm text-slate-300">{user?.email || ""} · {familyMembersCount} membros da familia</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-xl bg-fuchsia-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-500"
                  onClick={() => setShowExpenseForm((v) => !v)}
                >
                  Adicionar Despesa
                </button>
                <button
                  className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                  onClick={() => setShowIncomeForm((v) => !v)}
                >
                  Adicionar Receita
                </button>
                <button
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                  onClick={handleExportExcel}
                >
                  Exportar Relatorio CSV
                </button>
                <button
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                  onClick={handleExportPdf}
                >
                  Exportar PDF
                </button>
                <button
                  className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-500"
                  onClick={requestNotificationPermission}
                >
                  {notificationEnabled ? "Notificacoes ativas" : "Ativar notificacoes"}
                </button>
                <button
                  className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
                  onClick={handleLogout}
                >
                  Sair
                </button>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {SIDEBAR_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                >
                  {item.label}
                </a>
              ))}
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
                <option value="all">Todas as categorias</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                Receitas da familia: <strong className="text-white">{brl(familyTotalIncome)}</strong>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                Saldo Familiar: <strong className="text-white">{brl(familyBalance)}</strong>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <select
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
              >
                <option value="all">Buscar em tudo</option>
                <option value="description">Buscar por descricao</option>
                <option value="category">Buscar por categoria</option>
                <option value="user">Buscar por usuario</option>
              </select>
              <input
                className="sm:col-span-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                placeholder="Buscar transacoes por descricao, categoria ou usuario"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.header>

          <div className="pointer-events-none fixed right-3 top-3 z-50 flex w-[min(92vw,380px)] flex-col gap-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-lg backdrop-blur ${TOAST_STYLES[toast.type]}`}
              >
                <p className="font-semibold">{toast.title}</p>
                <p className="mt-0.5 text-xs opacity-95">{toast.message}</p>
              </div>
            ))}
          </div>

          {error ? <p className="rounded-xl bg-rose-500/20 p-3 text-sm text-rose-100">{error}</p> : null}

          <motion.section variants={itemVariants} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Receitas do mes", value: brl(monthlyIncome), tone: "from-sky-500/25 to-sky-300/5" },
              { title: "Despesas do mes", value: brl(monthlyExpense), tone: "from-fuchsia-500/25 to-fuchsia-300/5" },
              { title: "Saldo do mes", value: brl(balance), tone: "from-emerald-500/25 to-emerald-300/5" },
              { title: "Comprometimento", value: `${committedPct.toFixed(1)}%`, tone: "from-orange-500/25 to-orange-300/5" },
              { title: "Saldo Familiar", value: brl(familyBalance), tone: "from-violet-500/25 to-violet-300/5" },
            ].map((card) => (
              <motion.div
                key={card.title}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.tone} p-4 backdrop-blur-xl`}
              >
                <p className="text-sm text-slate-300">{card.title}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{card.value}</h2>
              </motion.div>
            ))}
          </motion.section>

          {showExpenseForm ? (
            <motion.section variants={itemVariants} className="frosted rounded-2xl border border-white/10 p-4">
              <h3 className="mb-3 text-lg font-semibold">Nova Despesa</h3>
              <div className="grid gap-2 md:grid-cols-4">
                <select
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 md:col-span-1"
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
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 md:col-span-1"
                  placeholder="Valor da despesa"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
                <input
                  type="month"
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 md:col-span-1"
                  value={expenseForm.competence}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, competence: e.target.value }))}
                />
                <button className="rounded-xl bg-fuchsia-600 px-3 py-2 font-medium text-white md:col-span-1" onClick={handleAddExpense}>
                  Salvar Despesa
                </button>
              </div>
            </motion.section>
          ) : null}

          {showIncomeForm ? (
            <motion.section variants={itemVariants} id="income" className="frosted rounded-2xl border border-white/10 p-4">
              <h3 className="mb-3 text-lg font-semibold">Nova Receita</h3>
              <div className="grid gap-2 md:grid-cols-3">
                <input
                  type="number"
                  step="0.01"
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2"
                  placeholder="Valor da receita"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
                <input
                  type="month"
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2"
                  value={incomeForm.competence}
                  onChange={(e) => setIncomeForm((prev) => ({ ...prev, competence: e.target.value }))}
                />
                <button className="rounded-xl bg-sky-600 px-3 py-2 font-medium text-white" onClick={handleAddIncome}>
                  Salvar Receita
                </button>
              </div>
            </motion.section>
          ) : null}

          <motion.section variants={itemVariants} className="frosted rounded-2xl border border-white/10 p-4">
            <h3 className="mb-3 text-lg font-semibold">Metas e economia</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Meta de Orcamento Mensal</label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2"
                  value={goals.monthlyGoal}
                  onChange={(e) => setGoals((prev) => ({ ...prev, monthlyGoal: Number(e.target.value || 0) }))}
                />
                <div className="mt-2 h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-fuchsia-500" style={{ width: `${goalProgress}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-300">Uso da meta: {goalProgress.toFixed(1)}%</p>
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Meta de Economia</label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2"
                  value={goals.savingsGoal}
                  onChange={(e) => setGoals((prev) => ({ ...prev, savingsGoal: Number(e.target.value || 0) }))}
                />
                <div className="mt-2 h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${savingsProgress}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-300">Economizado {brl(monthlySavings)} ({savingsProgress.toFixed(1)}%)</p>
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} id="expenses" className="frosted rounded-2xl border border-white/10 p-4">
            <h3 className="mb-3 text-lg font-semibold">Lista de Despesas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-100">
                <thead>
                  <tr>
                    <th className="p-2">Responsavel</th>
                    <th className="p-2">Categoria</th>
                    <th className="p-2">Valor</th>
                    <th className="p-2">Competencia</th>
                    <th className="p-2">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedExpenses.map((expense) => {
                    const isMine = user?.email && expense.user_email === user.email;
                    return (
                      <tr key={expense.id} className="border-t border-white/10">
                        <td className="p-2">
                          <span className="inline-flex rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-200">
                            {ownerLabel(expense.user_email)}
                          </span>
                        </td>
                        <td className="p-2">
                          {API_CATEGORY_TO_LABEL[expense.category] || expense.category}
                        </td>
                        <td className="p-2">{brl(expense.amount)}</td>
                        <td className="p-2">{new Date(expense.competencia || expense.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="p-2">
                          {isMine ? (
                            <div className="flex flex-wrap gap-1">
                              <button className="rounded-lg bg-sky-600 px-2 py-1 text-xs" onClick={() => openEditExpenseModal(expense)}>
                                Editar
                              </button>
                              <button className="rounded-lg bg-rose-600 px-2 py-1 text-xs" onClick={() => openDeleteModal("expense", expense.id)}>
                                Excluir
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Somente leitura</span>
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
            <h3 className="mb-3 text-lg font-semibold">Lista de Receitas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-100">
                <thead>
                  <tr>
                    <th className="p-2">Responsavel</th>
                    <th className="p-2">Valor</th>
                    <th className="p-2">Competencia</th>
                    <th className="p-2">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedIncomes.map((income) => {
                    const isMine = user?.email && income.user_email === user.email;
                    return (
                      <tr key={income.id} className="border-t border-white/10">
                        <td className="p-2">
                          <span className="inline-flex rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-200">
                            {ownerLabel(income.user_email)}
                          </span>
                        </td>
                        <td className="p-2">{brl(income.amount)}</td>
                        <td className="p-2">{new Date(income.competencia || income.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="p-2">
                          {isMine ? (
                            <div className="flex flex-wrap gap-1">
                              <button className="rounded-lg bg-sky-600 px-2 py-1 text-xs" onClick={() => openEditIncomeModal(income)}>
                                Editar
                              </button>
                              <button className="rounded-lg bg-rose-600 px-2 py-1 text-xs" onClick={() => openDeleteModal("income", income.id)}>
                                Excluir
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Somente leitura</span>
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
            <h3 className="mb-3 text-lg font-semibold">Divisao familiar proporcional</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-100">
                <thead>
                  <tr>
                    <th className="p-2">Pessoa</th>
                    <th className="p-2">Receitas</th>
                    <th className="p-2">Percentual</th>
                    <th className="p-2">Valor a pagar</th>
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
              <h3 className="mb-3 text-base font-semibold">Receitas vs Despesas</h3>
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
              <h3 className="mb-3 text-base font-semibold">Despesas por Categoria</h3>
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
              <h3 className="mb-3 text-base font-semibold">Categoria x % das Receitas</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commitmentByCategory}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="category" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip />
                    <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                      {commitmentByCategory.map((entry, index) => (
                        <Cell key={`${entry.category}-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </motion.section>

          <motion.section variants={itemVariants} className="frosted rounded-2xl border border-white/10 p-4">
            <h3 className="mb-3 text-lg font-semibold">Relatorios mensais</h3>
            <div className="grid gap-3 md:grid-cols-4">
              <article className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Mes selecionado ({monthFilter})</p>
                <p className="mt-1 text-sm text-slate-200">Receitas: {brl(monthlyIncome)}</p>
                <p className="text-sm text-slate-200">Despesas: {brl(monthlyExpense)}</p>
              </article>
              <article className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Mes anterior ({previousMonthFilter})</p>
                <p className="mt-1 text-sm text-slate-200">Receitas: {brl(previousMonthMetrics.income)}</p>
                <p className="text-sm text-slate-200">Despesas: {brl(previousMonthMetrics.expense)}</p>
              </article>
              <article className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Progresso de economia</p>
                <p className="mt-1 text-sm text-slate-200">Meta: {brl(goals.savingsGoal || 0)}</p>
                <p className="text-sm text-slate-200">Atual: {savingsProgress.toFixed(1)}%</p>
              </article>
              <article className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Analise por categoria</p>
                <p className="mt-1 text-sm text-slate-200">
                  Top categoria: {expensesByCategory[0]?.category || "Sem dados"}
                </p>
                <p className="text-sm text-slate-200">
                  Participacao: {expensesByCategory[0] ? `${expensesByCategory[0].pct_income.toFixed(1)}%` : "0%"}
                </p>
              </article>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} id="transactions" className="frosted rounded-2xl border border-white/10 p-4">
            <h3 className="mb-3 text-lg font-semibold">Transacoes Recentes</h3>
            <div className="relative pl-5">
              <span className="absolute left-2 top-1 h-[calc(100%-0.5rem)] w-px bg-white/15" />
              <div className="space-y-2">
                {searchableTransactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    whileHover={{ x: 3 }}
                    className="relative flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span
                      className={`absolute -left-[1.15rem] top-3 h-2.5 w-2.5 rounded-full ${
                        tx.type === "expense" ? "bg-rose-400" : "bg-emerald-400"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {tx.type === "expense" ? "Despesa" : "Receita"} · {tx.category}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-200">
                          {ownerLabel(tx.owner)}
                        </span>
                        <p className="text-xs text-slate-400">{new Date(tx.competence).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${tx.type === "expense" ? "text-rose-300" : "text-emerald-300"}`}>
                      {tx.type === "expense" ? "-" : "+"}
                      {brl(tx.amount)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} id="insights" className="frosted rounded-2xl border border-white/10 p-4">
            <h3 className="mb-3 text-lg font-semibold">Insights e alertas automaticos</h3>
            <div className="space-y-2">
              {insights.map((note, index) => (
                <motion.div
                  key={`${note.text}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.28 }}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    note.level === "danger"
                      ? "bg-rose-500/15 text-rose-100"
                      : note.level === "ok"
                      ? "bg-emerald-500/15 text-emerald-100"
                      : "bg-amber-500/15 text-amber-100"
                  }`}
                >
                  {note.text}
                </motion.div>
              ))}
            </div>
          </motion.section>

          <AnimatePresence>
            {editModal ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-3"
              >
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24, scale: 0.96 }}
                  className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950 p-4"
                >
                  <h4 className="text-lg font-semibold text-white">
                    {editModal.type === "expense" ? "Editar Despesa" : "Editar Receita"}
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">Atualize os dados e salve para recalcular dashboard e graficos.</p>

                  <div className="mt-4 space-y-3">
                    {editModal.type === "expense" ? (
                      <select
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                        value={editModal.category}
                        onChange={(e) => setEditModal((prev) => ({ ...prev, category: e.target.value }))}
                      >
                        {CATEGORY_OPTIONS.map((category) => (
                          <option key={category.key} value={category.api}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    ) : null}

                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                      value={editModal.amount}
                      placeholder={editModal.type === "expense" ? "Valor da despesa" : "Valor da receita"}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, amount: e.target.value }))}
                    />

                    <input
                      type="month"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                      value={editModal.competence}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, competence: e.target.value }))}
                    />
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button className="rounded-xl bg-slate-700 px-3 py-2 text-sm" onClick={() => setEditModal(null)}>
                      Cancelar
                    </button>
                    <button className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold" onClick={handleSaveEdit}>
                      Salvar
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {deleteModal ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-3"
              >
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24, scale: 0.96 }}
                  className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950 p-4"
                >
                  <h4 className="text-lg font-semibold text-white">Confirmar exclusao</h4>
                  <p className="mt-2 text-sm text-slate-300">Tem certeza que deseja excluir este lançamento?</p>

                  <div className="mt-4 flex justify-end gap-2">
                    <button className="rounded-xl bg-slate-700 px-3 py-2 text-sm" onClick={() => setDeleteModal(null)}>
                      Cancelar
                    </button>
                    <button className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold" onClick={confirmDelete}>
                      Excluir
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.section>
      </div>
    </main>
  );
}
