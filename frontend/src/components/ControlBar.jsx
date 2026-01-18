import { Play, StopCircle } from 'lucide-react';

export default function ControlBar({ 
  start, 
  target, 
  setStart, 
  setTarget, 
  isRunning, 
  onStart,
  onStop
}) {
  return (
    <div className="max-w-4xl mx-auto p-4 bg-slate-800 rounded-lg shadow-lg">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-2">
            Starting Wikipedia URL
          </label>
          <input 
            type="url"
            placeholder="e.g. https://en.wikipedia.org/wiki/Mustard" 
            className="w-full p-3 bg-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onStart()}
            disabled={isRunning}
          />
        </div>
        <div className="text-2xl text-slate-600 font-black">TO</div>
        <div className="flex-1 w-full">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-2">
            Target Wikipedia URL
          </label>
          <input 
            type="url"
            placeholder="Target: https://en.wikipedia.org/wiki/Chocolate" 
            className="w-full p-3 bg-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onStart()}
            disabled={isRunning}
          />
        </div>
      </div>

      <div className="flex justify-center mt-4">
        {!isRunning ? (
          <button 
            onClick={onStart}
            className="flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            disabled={!start || !target}
          >
            <Play className="mr-2" size={20} />
            Start Race
          </button>
        ) : (
          <button 
            onClick={onStop}
            className="flex items-center justify-center px-8 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <StopCircle className="mr-2" size={20} />
            Stop Race
          </button>
        )}
      </div>
    </div>
  );
}