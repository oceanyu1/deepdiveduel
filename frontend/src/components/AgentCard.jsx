export default function AgentCard({ title, color, data, description, onModelChange, isRunning }) {
  const colorClass = color === 'blue' 
    ? 'border-blue-500 text-blue-400' 
    : 'border-purple-500 text-purple-400';
  
  return (
    <div className={`bg-slate-800 border-t-4 ${colorClass} rounded-xl p-6 shadow-xl`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <select 
            value={data.model}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={isRunning}
            className="bg-slate-700 text-xs text-white p-2 rounded-lg outline-none border border-slate-600 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="openai/gpt-4o">GPT-4o</option>
            <option value="mistralai/mistral-large">Mistral Large</option>
            <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
            <option value="mistralai/mistral-7b-instruct">Mistral 7B Instruct</option>
            <option value="nousresearch/hermes-2-pro-llama-3-8b">Pro Llama 3 8B</option>
          </select>
          <div className="text-right">
            <span className="block text-2xl font-mono font-bold">{data.nodes}</span>
            <span className="text-[10px] uppercase text-slate-500">Websites Scanned</span>
          </div>
        </div>
      </div>

      <div className="bg-black rounded-lg p-4 h-64 font-mono text-xs overflow-y-auto mb-6 border border-slate-700">
        <div className="text-slate-500 mb-2">// Initializing traversal...</div>
        {data.logs.map((log, i) => (
          <div key={i} className="mb-1 text-emerald-500">{`> ${log}`}</div>
        ))}
        {data.logs.length === 0 && (
          <div className="text-slate-700">Waiting for input...</div>
        )}
      </div>

      <div className="bg-slate-900/50 p-4 rounded-lg flex justify-around">
        <div className="text-center">
          <div className="text-slate-500 text-[10px] uppercase">Path Depth</div>
          <div className="text-lg font-bold">{data.depth}</div>
        </div>
        <div className="border-r border-slate-700"></div>
        <div className="text-center">
          <div className="text-slate-500 text-[10px] uppercase">Avg Click Depth</div>
          <div className="text-lg font-bold">
            {data.nodes > 0 ? (data.depth / data.nodes).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>
    </div>
  );
}