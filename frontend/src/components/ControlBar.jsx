export default function ControlBar({ start, target, setStart, setTarget, isRunning, onStart }) {
  return (
    <div className="max-w-5xl mx-auto mb-12 bg-slate-800 p-4 rounded-3xl border border-slate-700 shadow-2xl">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-2">
            Starting Website
          </label>
          <input 
            placeholder="e.g. Mustard (Wikipedia)" 
            className="w-full bg-slate-900 mt-1 p-4 rounded-xl border border-slate-700 text-white outline-none focus:border-blue-500"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onStart()}
            disabled={isRunning}
          />
        </div>
        <div className="text-2xl text-slate-600 font-black">TO</div>
        <div className="flex-1 w-full">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-2">
            Target Concept
          </label>
          <input 
            placeholder="e.g. Microwave Ovens" 
            className="w-full bg-slate-900 mt-1 p-4 rounded-xl border border-slate-700 text-white outline-none focus:border-purple-500"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onStart()}
            disabled={isRunning}
          />
        </div>
        <button 
          onClick={onStart}
          disabled={isRunning}
          className="h-full px-10 py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-tighter transition-colors"
        >
          {isRunning ? 'RUNNING...' : 'GO!'}
        </button>
      </div>
    </div>
  );
}