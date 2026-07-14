"use client";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://family-finance-backend-0r19.onrender.com";

export async function apiRequest(path, options = {}, token) {
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const detail = data && data.detail ? data.detail : `Falha na requisicao: ${response.status}`;
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function login(email, password) {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  try {
    return await apiRequest("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
  } catch (error) {
    return apiRequest("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  }
}

export async function register(nome, email, password) {
  try {
    return await apiRequest("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, password }),
    });
  } catch (error) {
    return apiRequest("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, password }),
    });
  }
}

export async function getDashboard(token, mes, ano) {
  return apiRequest(`/dashboard?mes=${mes}&ano=${ano}`, {}, token);
}

export async function getCurrentUser(token) {
  return apiRequest("/auth/me", {}, token);
}

export async function listExpenses(token) {
  return apiRequest("/expenses", {}, token);
}

export async function listIncomes(token) {
  return apiRequest("/incomes", {}, token);
}

export async function getSplit(token) {
  return apiRequest("/split", {}, token);
}

export async function createExpense(token, payload) {
  return apiRequest(
    "/expense",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updateExpense(token, expenseId, payload) {
  return apiRequest(
    `/expenses/${expenseId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function deleteExpense(token, expenseId) {
  return apiRequest(
    `/expenses/${expenseId}`,
    {
      method: "DELETE",
    },
    token
  );
}

export async function createIncome(token, payload) {
  return apiRequest(
    "/income",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updateIncome(token, incomeId, payload) {
  return apiRequest(
    `/incomes/${incomeId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function deleteIncome(token, incomeId) {
  return apiRequest(
    `/incomes/${incomeId}`,
    {
      method: "DELETE",
    },
    token
  );
}

export async function listPersonalIncomes(token) {
  return apiRequest("/personal/incomes", {}, token);
}

export async function listPersonalExpenses(token) {
  return apiRequest("/personal/expenses", {}, token);
}

export async function listPersonalInvestments(token) {
  return apiRequest("/personal/investments", {}, token);
}

export async function createPersonalIncome(token, payload) {
  return apiRequest(
    "/personal/income",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updatePersonalIncome(token, id, payload) {
  return apiRequest(
    `/personal/incomes/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function createPersonalExpense(token, payload) {
  return apiRequest(
    "/personal/expense",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updatePersonalExpense(token, id, payload) {
  return apiRequest(
    `/personal/expenses/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function createPersonalInvestment(token, payload) {
  return apiRequest(
    "/personal/investment",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updatePersonalInvestment(token, id, payload) {
  return apiRequest(
    `/personal/investments/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function deletePersonalIncome(token, id) {
  return apiRequest(
    `/personal/incomes/${id}`,
    {
      method: "DELETE",
    },
    token
  );
}

export async function deletePersonalExpense(token, id) {
  return apiRequest(
    `/personal/expenses/${id}`,
    {
      method: "DELETE",
    },
    token
  );
}

export async function deletePersonalInvestment(token, id) {
  return apiRequest(
    `/personal/investments/${id}`,
    {
      method: "DELETE",
    },
    token
  );
}

export async function getPersonalSummary(token, mes, ano) {
  return apiRequest(`/personal/summary?mes=${mes}&ano=${ano}`, {}, token);
}

async function fetchBinary(path, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { headers });
  if (!response.ok) {
    let detail = `Falha na requisicao: ${response.status}`;
    try {
      const data = await response.json();
      detail = data?.detail || detail;
    } catch {
      const text = await response.text();
      if (text) {
        detail = text;
      }
    }
    throw new Error(detail);
  }

  return response.blob();
}

export async function fetchPersonalReportCsv(token, mes, ano) {
  return fetchBinary(`/personal/reports/csv/${mes}/${ano}`, token);
}

export async function fetchPersonalReportPdf(token, mes, ano) {
  return fetchBinary(`/personal/reports/pdf/${mes}/${ano}`, token);
}
