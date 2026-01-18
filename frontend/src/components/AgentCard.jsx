export default function AgentCard({ title, data }) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col h-[400px]">
      <div className="p-3 border-b border-slate-700 flex justify-between items-start">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <div className="text-right">
            <span className="block text-2xl font-mono font-bold text-white">{data.nodes}</span>
            <span className="text-[10px] uppercase text-slate-400">Articles Visited</span>
        </div>
      </div>

      <div className="bg-black p-4 font-mono text-xs overflow-y-auto border-b border-slate-700 flex-grow">
        <div className="text-slate-500 mb-2">// Agent log...</div>
        {data.logs.map((log, i) => (
          <div key={i} className="mb-1 text-emerald-400">{`> ${log}`}</div>
        ))}
        {data.logs.length === 0 && (
          <div className="text-slate-700">Waiting for input...</div>
        )}
      </div>

      <div className="bg-slate-900/50 p-3 flex justify-around">
        <div className="text-center">
          <div className="text-slate-400 text-[10px] uppercase">Path Depth</div>
          <div className="text-lg font-bold text-white">{data.depth}</div>
        </div>
        <div className="border-r border-slate-700"></div>
        <div className="text-center">
          <div className="text-slate-400 text-[10px] uppercase">Avg Click Depth</div>
          <div className="text-lg font-bold text-white">
            {data.nodes > 0 ? (data.depth / data.nodes).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>
    </div>
  );
}