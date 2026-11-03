"use client";

import statementImportParser from "./statement-import";

const { FAMILY_CATEGORIES, PERSONAL_CATEGORIES } = statementImportParser;

export default function StatementImportPanel({
  rows,
  fileName,
  error,
  importing,
  processing,
  ocrReviewRequired,
  target,
  onTargetChange,
  onFileChange,
  onUpdateRow,
  onSelectValid,
  onImport,
  onClear,
}) {
  const categories = target === "family" ? FAMILY_CATEGORIES : PERSONAL_CATEGORIES;
  const selectedCount = rows.filter((row) => row.selected && !row.imported).length;
  const duplicateCount = rows.filter((row) => row.possibleDuplicate).length;

  return (
    <section className="frosted rounded-2xl border border-white/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Importar extrato CSV ou PDF</h3>
          <p className="mt-1 text-sm text-slate-400">
            Arquivos sao processados neste navegador. Revise as linhas e confirme antes de importar; duplicidades possiveis ficam desmarcadas.
            Faturas Nubank de cartao tem reconhecimento dedicado; paginas digitalizadas podem ser lidas por OCR local em portugues.
          </p>
        </div>
        <label className="text-xs text-slate-300">
          Destino dos lancamentos
          <select
            aria-label="Destino dos lancamentos importados"
            className="mt-1 block w-full min-w-48 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
            value={target}
            onChange={(event) => onTargetChange(event.target.value)}
            disabled={importing || Boolean(fileName)}
          >
            <option value="family">Financas da familia</option>
            <option value="personal">Financas pessoais</option>
          </select>
        </label>
      </div>
      {fileName ? (
        <p className="mt-2 text-xs text-slate-400">
          Para trocar o destino sem perder as revisoes, limpe este arquivo e selecione-o novamente.
        </p>
      ) : null}
      <label className="mt-3 inline-flex cursor-pointer items-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20">
        Selecionar arquivo CSV ou PDF
        <input
          aria-label="Selecionar extrato CSV ou PDF"
          className="sr-only"
          type="file"
          accept=".csv,.pdf,text/csv,application/pdf"
          disabled={importing || Boolean(processing)}
          onChange={onFileChange}
        />
      </label>
      <p className="mt-2 text-xs text-slate-500">
        CSV: ate 2 MB. PDF: ate 10 MB e 20 paginas; OCR ate 5 paginas sem texto. Sao processadas ate 500 linhas candidatas.
      </p>
      {processing ? (
        <p role="status" aria-live="polite" className="mt-3 rounded-xl bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
          {processing}
        </p>
      ) : null}
      {ocrReviewRequired ? (
        <p role="status" className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          O texto foi reconhecido por OCR local e pode conter erros. As linhas começam desmarcadas; confira cada valor e selecione manualmente apenas as transacoes corretas.
        </p>
      ) : null}
      {target === "family" ? (
        <p className="mt-2 text-xs text-amber-100/80">
          Despesas familiares usam as categorias existentes; a descricao original fica preservada no comentario do lancamento.
          Categorias sem equivalente familiar pedem revisao antes de importar.
        </p>
      ) : null}
      {fileName ? <p className="mt-2 text-sm text-slate-300">Arquivo: {fileName}</p> : null}
      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
      {rows.length ? (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-300">
              {rows.length} linha(s) · {selectedCount} selecionada(s) · {duplicateCount} possivel(is) duplicidade(s)
            </p>
            <button
              type="button"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
              onClick={onSelectValid}
              disabled={importing || ocrReviewRequired}
            >
              {ocrReviewRequired ? "OCR: selecione as linhas manualmente" : "Selecionar validos sem duplicidade"}
            </button>
          </div>
          <p className="mt-2 text-xs text-amber-100/80">
            Duplicidade e baseada em tipo, mes, valor e descricao normalizada. Confira cada alerta; voce pode marcar uma linha conscientemente se ela for outra compra igual.
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-[1050px] w-full text-left text-xs">
              <thead>
                <tr className="text-slate-300">
                  <th className="p-2">Importar</th>
                  <th className="p-2">Linha</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Descricao</th>
                  <th className="p-2">Valor (R$)</th>
                  <th className="p-2">Categoria</th>
                  <th className="p-2">Competencia</th>
                  <th className="p-2">Revisao</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`statement-row-${row.rowNumber}`} className="border-t border-white/10 align-top">
                    <td className="p-2">
                      <input
                        aria-label={`Importar linha ${row.rowNumber}`}
                        type="checkbox"
                        checked={row.selected}
                        disabled={
                          Boolean(row.issue) ||
                          row.imported ||
                          importing ||
                          (target === "family" && row.type === "expense" && row.familyCategoryNeedsReview)
                        }
                        onChange={(event) => onUpdateRow(row.rowNumber, { selected: event.target.checked })}
                      />
                    </td>
                    <td className="p-2 text-slate-400">{row.rowNumber}</td>
                    <td className="p-2">
                      <select
                        aria-label={`Tipo da linha ${row.rowNumber}`}
                        className="w-32 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-white"
                        value={row.type}
                        disabled={row.imported || importing}
                        onChange={(event) =>
                          onUpdateRow(row.rowNumber, {
                            type: event.target.value,
                            typeNeedsReview: false,
                            selected:
                              event.target.value === "income" || !row.familyCategoryNeedsReview
                                ? row.selected
                                : false,
                          })
                        }
                      >
                        <option value="expense">Despesa</option>
                        <option value="income">Receita</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        aria-label={`Descricao da linha ${row.rowNumber}`}
                        className="w-52 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-white"
                        maxLength={255}
                        value={row.description}
                        disabled={row.imported || importing}
                        onChange={(event) => onUpdateRow(row.rowNumber, { description: event.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        aria-label={`Valor da linha ${row.rowNumber}`}
                        className="w-28 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-white"
                        inputMode="decimal"
                        value={row.amount}
                        disabled={row.imported || importing}
                        onChange={(event) => onUpdateRow(row.rowNumber, { amount: event.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        aria-label={`Categoria da linha ${row.rowNumber}`}
                        className="w-36 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-white"
                        value={target === "family" ? row.familyCategory : row.category}
                        disabled={row.imported || importing}
                        onChange={(event) =>
                          onUpdateRow(row.rowNumber, target === "family"
                            ? { familyCategory: event.target.value, familyCategoryNeedsReview: false }
                            : { category: event.target.value, categoryWasInferred: false })
                        }
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        aria-label={`Competencia da linha ${row.rowNumber}`}
                        className="w-36 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-white"
                        type="month"
                        value={row.competence}
                        disabled={row.imported || importing}
                        onChange={(event) => onUpdateRow(row.rowNumber, { competence: event.target.value })}
                      />
                    </td>
                    <td className="max-w-64 p-2 text-amber-100">
                      {row.imported ? (
                        <span className="text-emerald-300">Importado</span>
                      ) : row.issue ? (
                        row.issue
                      ) : row.importError ? (
                        row.importError
                      ) : row.possibleDuplicate ? (
                        <span>{row.duplicateReason}</span>
                      ) : target === "family" && row.type === "expense" && row.familyCategoryNeedsReview ? (
                        <span>Esta categoria nao tem equivalente familiar direto; selecione uma categoria para habilitar a linha.</span>
                      ) : row.typeNeedsReview ? (
                        <span>Confirme o tipo: o CSV nao informa se e receita ou despesa.</span>
                      ) : row.competenceWasInferred || (target === "personal" && row.categoryWasInferred) ? (
                        <span>
                          {row.competenceWasInferred ? "Data ausente; usamos o mes selecionado. " : ""}
                          {target === "personal" && row.categoryWasInferred ? "Categoria definida como Outros; revise." : ""}
                        </span>
                      ) : (
                        <span className="text-slate-500">Pronto para revisar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onImport}
              disabled={importing || !rows.some((row) => row.selected && !row.imported)}
            >
              {importing ? "Importando..." : "Confirmar e importar selecionados"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              disabled={importing || Boolean(processing)}
              onClick={onClear}
            >
              Limpar importacao
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
