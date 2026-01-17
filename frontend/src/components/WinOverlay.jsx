export default function WinOverlay({ winner, path, stats, onReset }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="max-w-2xl w-full bg-slate-800 border-2 border-yellow-500 rounded-3xl p-8 shadow-[0_0_50px_rgba(234,179,8,0.3)] text-center animate-in">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">
          Goal Reached!
        </h2>
        <p className="text-yellow-500 font-mono font-bold text-xl mb-6">
          Winner: {winner}
        </p>

        <div className="bg-slate-900 rounded-2xl p-6 mb-8 border border-slate-700">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-4 font-bold">
            Winning Connection Path
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {path.map((node, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="bg-slate-700 text-white px-3 py-1 rounded-full text-sm font-medium border border-slate-600">
                  {node}
                </span>
                {i < path.length - 1 && <span className="text-slate-500">→</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-slate-700/50 rounded-xl">
            <p className="text-[10px] text-slate-400 uppercase">Total Clicks</p>
            <p className="text-2xl font-black text-white">{stats.clicks}</p>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-xl">
            <p className="text-[10px] text-slate-400 uppercase">Nodes Scanned</p>
            <p className="text-2xl font-black text-white">{stats.nodes}</p>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-xl">
            <p className="text-[10px] text-slate-400 uppercase">Model Used</p>
            <p className="text-lg font-black text-blue-400">{stats.model}</p>
          </div>
        </div>

        <button 
          onClick={onReset}
          className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black rounded-xl transition-all hover:scale-[1.02] active:scale-95"
        >
          START NEW CHALLENGE
        </button>
      </div>
    </div>
  );
}