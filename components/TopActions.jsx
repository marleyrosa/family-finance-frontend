"use client";

import { useState } from "react";

export default function TopActions({ onIncome, onInvite, onUpload, onExportCsv, onExportPdf }) {
  const [income, setIncome] = useState({ valor: "", mes: "", ano: "" });
  const [email, setEmail] = useState("");

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="frosted rounded-2xl border border-white/10 p-4 shadow-soft">
        <h4 className="mb-3 font-semibold">Adicionar renda</h4>
        <div className="space-y-2">
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Valor"
            value={income.valor}
            onChange={(e) => setIncome((prev) => ({ ...prev, valor: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Mes"
              value={income.mes}
              onChange={(e) => setIncome((prev) => ({ ...prev, mes: e.target.value }))}
            />
            <input
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Ano"
              value={income.ano}
              onChange={(e) => setIncome((prev) => ({ ...prev, ano: e.target.value }))}
            />
          </div>
          <button
            className="w-full rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-slate-950"
            onClick={() => onIncome(income)}
          >
            Salvar renda
          </button>
        </div>
      </article>

      <article className="frosted rounded-2xl border border-white/10 p-4 shadow-soft">
        <h4 className="mb-3 font-semibold">Convidar parceiro</h4>
        <input
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          placeholder="email@parceiro.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="mt-2 w-full rounded-xl bg-warm px-3 py-2 text-sm font-semibold text-slate-950"
          onClick={() => onInvite(email)}
        >
          Enviar convite
        </button>
      </article>

      <article className="frosted rounded-2xl border border-white/10 p-4 shadow-soft">
        <h4 className="mb-3 font-semibold">Boletos e relatorios</h4>
        <input
          type="file"
          accept="application/pdf"
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1 file:text-slate-950"
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className="rounded-xl bg-slate-700 px-3 py-2 text-sm" onClick={onExportCsv}>
            Exportar CSV
          </button>
          <button className="rounded-xl bg-slate-700 px-3 py-2 text-sm" onClick={onExportPdf}>
            Exportar PDF
          </button>
        </div>
      </article>
    </section>
  );
}
