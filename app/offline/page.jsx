export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070c12] px-4 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
        <h1 className="text-2xl font-semibold">Sem conexao</h1>
        <p className="mt-2 text-sm text-slate-300">
          Voce esta offline no momento. Assim que a internet voltar, o FamilYMoney sera atualizado automaticamente.
        </p>
      </section>
    </main>
  );
}
