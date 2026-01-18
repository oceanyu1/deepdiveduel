import { useState } from 'react';

export default function AnalyticsModal({ winner, isOpen, onClose, stats, bfsPath, dfsPath }) {
  if (!isOpen) return null;

  const winnerName = winner === 'BFS' ? 'The Explorer (BFS)' : 'The Deep Diver (DFS)';
  const loserName = winner === 'BFS' ? 'The Deep Diver (DFS)' : 'The Explorer (BFS)';
  const winnerStats = winner === 'BFS' ? stats.bfs : stats.dfs;
  const loserStats = winner === 'BFS' ? stats.dfs : stats.bfs;
  const winnerPath = winner === 'BFS' ? bfsPath : dfsPath;
  const loserPath = winner === 'BFS' ? dfsPath : bfsPath;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-slate-800 border-2 border-yellow-500 rounded-3xl p-8 shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-in max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              📊 Race Analytics
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Winner Info */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 rounded-2xl p-6 mb-8 border border-yellow-500/50">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">
              Race Winner
            </p>
            <p className="text-3xl font-black text-yellow-500">
              🏆 {winnerName}
            </p>
          </div>

          {/* Winners Stats */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-yellow-500 mb-4 uppercase">Winner Stats</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-900/30 rounded-xl border border-blue-500">
                <p className="text-[10px] text-slate-400 uppercase">Nodes Visited</p>
                <p className="text-2xl font-black text-blue-400">{winnerStats.nodes}</p>
              </div>
              <div className="p-4 bg-blue-900/30 rounded-xl border border-blue-500">
                <p className="text-[10px] text-slate-400 uppercase">Max Depth</p>
                <p className="text-2xl font-black text-blue-400">{winnerStats.depth}</p>
              </div>
              <div className="p-4 bg-blue-900/30 rounded-xl border border-blue-500">
                <p className="text-[10px] text-slate-400 uppercase">Model Used</p>
                <p className="text-sm font-black text-blue-400">{winnerStats.model}</p>
              </div>
            </div>

            {/* Winner Path */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-4 font-bold">
                Winning Path (Target Reached ✓)
              </p>
              <div className="flex flex-wrap justify-center items-center gap-2">
                {winnerPath && winnerPath.map((node, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium border border-yellow-500/50">
                      {node}
                    </span>
                    {i < winnerPath.length - 1 && <span className="text-slate-500">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Loser Stats */}
          <div className="mb-8 pt-8 border-t border-slate-700">
            <h3 className="text-xl font-bold text-slate-400 mb-4 uppercase">Loser Stats</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                <p className="text-[10px] text-slate-400 uppercase">Nodes Visited</p>
                <p className="text-2xl font-black text-slate-300">{loserStats.nodes}</p>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                <p className="text-[10px] text-slate-400 uppercase">Max Depth</p>
                <p className="text-2xl font-black text-slate-300">{loserStats.depth}</p>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                <p className="text-[10px] text-slate-400 uppercase">Model Used</p>
                <p className="text-sm font-black text-slate-300">{loserStats.model}</p>
              </div>
            </div>

            {/* Loser Path */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-4 font-bold">
                {loserName} - Last Visited
              </p>
              <div className="flex flex-wrap justify-center items-center gap-2">
                {loserPath && loserPath.map((node, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`${i === loserPath.length - 1 ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-slate-700 text-slate-300 border-slate-600'} px-3 py-1 rounded-full text-sm font-medium border`}>
                      {node}
                    </span>
                    {i < loserPath.length - 1 && <span className="text-slate-500">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-xl transition-all hover:scale-[1.02] active:scale-95 mt-8"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
