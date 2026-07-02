import { usePatternsStore } from "@/src/store/patterns";

function App() {
  const cards = usePatternsStore((s) => s.cards);

  return (
    <div className="h-full bg-white text-slate-900">
      <header className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-bold">Pattern Library</h1>
      </header>
      <main className="p-4">
        {cards.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">No patterns saved yet.</p>
            <p className="text-sm mt-1">
              Click the Hooked icon on a pattern page to save it.
            </p>
          </div>
        ) : (
          <p className="text-sm">{cards.length} pattern(s) saved</p>
        )}
      </main>
    </div>
  );
}

export default App;
