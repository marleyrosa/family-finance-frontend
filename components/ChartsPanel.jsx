"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = ["#2dd4bf", "#f59e0b", "#60a5fa", "#f97316"];

export default function ChartsPanel({ monthly, split, categories }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="frosted rounded-2xl border border-white/10 p-5 shadow-soft"
      >
        <h3 className="mb-4 text-lg font-semibold">Evolucao mensal</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
              <XAxis dataKey="mes" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="rendas" stroke="#22c55e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="frosted rounded-2xl border border-white/10 p-5 shadow-soft"
      >
        <h3 className="mb-4 text-lg font-semibold">Divisao das despesas por pessoa</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={split} dataKey="valor_devido" nameKey="nome" outerRadius={88} innerRadius={54}>
                {split.map((item, index) => (
                  <Cell key={item.nome} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="frosted rounded-2xl border border-white/10 p-5 shadow-soft lg:col-span-2"
      >
        <h3 className="mb-4 text-lg font-semibold">Gastos por categoria</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categories}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
              <XAxis dataKey="categoria" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="valor" fill="#2dd4bf" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>
    </div>
  );
}
