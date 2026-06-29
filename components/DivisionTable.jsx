"use client";

import { brl } from "../dashboard/format";

export default function DivisionTable({ users = [] }) {
  if (!users.length) {
    return null;
  }

  return (
    <section className="frosted rounded-2xl border border-white/10 p-5 shadow-soft">
      <h3 className="mb-4 text-lg font-semibold">Divisao proporcional do mes</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-3 py-2">Pessoa</th>
              <th className="px-3 py-2">Renda</th>
              <th className="px-3 py-2">Percentual</th>
              <th className="px-3 py-2">Valor devido</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td className="px-3 py-2">{user.nome}</td>
                <td className="px-3 py-2">{brl(user.renda)}</td>
                <td className="px-3 py-2">{Number(user.percentual || 0).toFixed(2)}%</td>
                <td className="px-3 py-2">{brl(user.valor_devido)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
