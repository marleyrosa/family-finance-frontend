"use client";

import { motion } from "framer-motion";

import { brl } from "../dashboard/format";

const CARD_STYLES = [
  "from-cyan-500/20 to-cyan-700/10",
  "from-amber-500/20 to-amber-700/10",
  "from-emerald-500/20 to-emerald-700/10",
];

const VALUE_COLORS = {
  ok: "text-ok",
  danger: "text-danger",
};

export default function SummaryCards({ cards }) {
  const entries = [
    { title: "Total de Despesas", value: cards.total_despesas, accent: "danger" },
    { title: "Total de Renda", value: cards.total_renda, accent: "ok" },
    { title: "Saldo", value: cards.saldo, accent: cards.saldo >= 0 ? "ok" : "danger" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {entries.map((entry, index) => (
        <motion.article
          key={entry.title}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.45 }}
          className={`frosted overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-5 shadow-soft ${CARD_STYLES[index]}`}
        >
          <p className="text-sm text-slate-300">{entry.title}</p>
          <h3 className={`mt-2 text-2xl font-bold ${VALUE_COLORS[entry.accent]}`}>{brl(entry.value)}</h3>
        </motion.article>
      ))}
    </div>
  );
}
