import { X, TrendingUp, Activity, Clock, Award, Zap, Target, Brain, Sparkles } from 'lucide-react';

export default function AnalyticsModal({ isOpen, onClose, bfsData, dfsData, winner, raceStartTime }) {
  if (!isOpen) return null;

  const bfsAvgDepth = bfsData.nodes > 0 ? (bfsData.depth / bfsData.nodes).toFixed(2) : '0.00';
  const dfsAvgDepth = dfsData.nodes > 0 ? (dfsData.depth / dfsData.nodes).toFixed(2) : '0.00';
  
  // Calculate time taken
  const getBfsTime = () => {
    if (!raceStartTime || !bfsData.finishTime) return null;
    return ((bfsData.finishTime - raceStartTime) / 1000).toFixed(2);
  };
  
  const getDfsTime = () => {
    if (!raceStartTime || !dfsData.finishTime) return null;
    return ((dfsData.finishTime - raceStartTime) / 1000).toFixed(2);
  };
  
  const bfsTime = getBfsTime();
  const dfsTime = getDfsTime();
  
  // Calculate efficiency metrics
  const bfsEfficiency = bfsData.nodes > 0 ? (bfsData.depth / bfsData.nodes * 100).toFixed(1) : 0;
  const dfsEfficiency = dfsData.nodes > 0 ? (dfsData.depth / dfsData.nodes * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-w-4xl w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-500" size={28} />
            <h2 className="text-2xl font-bold text-white">Race Analytics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Winner Section */}
          {winner && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Award className="text-yellow-500" size={32} />
                <div>
                  <h3 className="text-xl font-bold text-white">Winner</h3>
                  <p className="text-slate-300">
                    {winner === 'BFS' ? 'The Spider (BFS)' : 'The Snake (DFS)'} found the target first!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BFS Stats */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                  <TrendingUp size={20} />
                  BFS (Breadth-First Search)
                </h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Brain size={12} /> Powered by {bfsData.model}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Nodes Explored</span>
                  <span className="text-white font-bold text-xl">{bfsData.nodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Path Depth</span>
                  <span className="text-white font-bold text-xl">{bfsData.depth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Click Depth</span>
                  <span className="text-white font-bold text-xl">{bfsAvgDepth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Efficiency</span>
                  <span className="text-white font-bold text-xl">{bfsEfficiency}%</span>
                </div>
                {bfsTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock size={14} /> Time to Complete
                    </span>
                    <span className="text-green-400 font-bold text-xl">{bfsTime}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* DFS Stats */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                  <TrendingUp size={20} />
                  DFS (Depth-First Search)
                </h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Brain size={12} /> Powered by {dfsData.model}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Nodes Explored</span>
                  <span className="text-white font-bold text-xl">{dfsData.nodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Path Depth</span>
                  <span className="text-white font-bold text-xl">{dfsData.depth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Click Depth</span>
                  <span className="text-white font-bold text-xl">{dfsAvgDepth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Efficiency</span>
                  <span className="text-white font-bold text-xl">{dfsEfficiency}%</span>
                </div>
                {dfsTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock size={14} /> Time to Complete
                    </span>
                    <span className="text-green-400 font-bold text-xl">{dfsTime}s</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Path Comparison */}
          {bfsData.path.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock size={20} />
                Search Paths
              </h3>
              
              <div className="space-y-4">
                {/* BFS Path */}
                <div>
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">BFS Path ({bfsData.path.length} nodes)</h4>
                  <div className="bg-slate-900/50 rounded-lg p-3 flex flex-wrap gap-2">
                    {bfsData.path.map((node, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-medium border border-blue-500/30">
                          {node}
                        </span>
                        {i < bfsData.path.length - 1 && <span className="text-slate-600">→</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* DFS Path */}
                <div>
                  <h4 className="text-sm font-semibold text-purple-400 mb-2">DFS Path ({dfsData.path.length} nodes)</h4>
                  <div className="bg-slate-900/50 rounded-lg p-3 flex flex-wrap gap-2">
                    {dfsData.path.map((node, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs font-medium border border-purple-500/30">
                          {node}
                        </span>
                        {i < dfsData.path.length - 1 && <span className="text-slate-600">→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-yellow-500" size={20} />
                <h4 className="font-semibold text-white">Speed</h4>
              </div>
              <p className="text-sm text-slate-400">
                {/* NEW LOGIC: Check for winner instead of requiring both times */}
                {winner ? (
                  winner === 'BFS' && bfsTime ? (
                    <span className="text-blue-400">BFS won in {bfsTime}s</span>
                  ) : winner === 'DFS' && dfsTime ? (
                    <span className="text-purple-400">DFS won in {dfsTime}s</span>
                  ) : (
                    'Calculating time...'
                  )
                ) : (
                  'Race in progress...'
                )}
              </p>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-green-500" size={20} />
                <h4 className="font-semibold text-white">Accuracy</h4>
              </div>
              <p className="text-sm text-slate-400">
                {bfsData.depth > 0 && dfsData.depth > 0 ? (
                  bfsData.depth <= dfsData.depth ? (
                    <span className="text-blue-400">BFS found shorter path ({bfsData.depth} vs {dfsData.depth})</span>
                  ) : (
                    <span className="text-purple-400">DFS found shorter path ({dfsData.depth} vs {bfsData.depth})</span>
                  )
                ) : (
                  'No path found yet'
                )}
              </p>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="text-blue-500" size={20} />
                <h4 className="font-semibold text-white">Efficiency</h4>
              </div>
              <p className="text-sm text-slate-400">
                {bfsData.nodes > 0 && dfsData.nodes > 0 ? (
                  bfsEfficiency > dfsEfficiency ? (
                    <span className="text-blue-400">BFS more efficient ({bfsEfficiency}% vs {dfsEfficiency}%)</span>
                  ) : (
                    <span className="text-purple-400">DFS more efficient ({dfsEfficiency}% vs {bfsEfficiency}%)</span>
                  )
                ) : (
                  'Calculating...'
                )}
              </p>
            </div>
          </div>

          {/* AI Model Insights */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/30">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Brain className="text-indigo-400" size={22} />
              🤖 AI Model Intelligence Insights
            </h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="bg-slate-900/50 rounded p-3">
                <p className="font-semibold text-white mb-1">Model Comparison:</p>
                <p>
                  {bfsData.model === dfsData.model ? (
                    <>
                      Both algorithms used <strong className="text-purple-400">{bfsData.model}</strong>. 
                      The performance difference is purely based on the search algorithm strategy (BFS vs DFS), 
                      showing how the same AI can produce different results with different exploration patterns.
                    </>
                  ) : (
                    <>
                      <strong className="text-blue-400">{bfsData.model}</strong> (BFS) vs{' '}
                      <strong className="text-purple-400">{dfsData.model}</strong> (DFS). 
                      Different models can have varying levels of semantic understanding, 
                      affecting their ability to select relevant Wikipedia links.
                    </>
                  )}
                </p>
              </div>

              <div className="bg-slate-900/50 rounded p-3">
                <p className="font-semibold text-white mb-1">Link Selection Quality:</p>
                <p>
                  The AI model's job is to intelligently choose which Wikipedia links to follow from each page. 
                  {bfsEfficiency > dfsEfficiency ? (
                    <>
                      {' '}<strong className="text-blue-400">{bfsData.model}</strong> showed better link selection with{' '}
                      <strong>{bfsEfficiency}%</strong> efficiency, meaning it made smarter choices about which paths to explore.
                    </>
                  ) : dfsEfficiency > bfsEfficiency ? (
                    <>
                      {' '}<strong className="text-purple-400">{dfsData.model}</strong> showed better link selection with{' '}
                      <strong>{dfsEfficiency}%</strong> efficiency, meaning it made smarter choices about which paths to explore.
                    </>
                  ) : (
                    ' Both models showed similar link selection quality.'
                  )}
                </p>
              </div>

              {bfsData.nodes > 0 && dfsData.nodes > 0 && (
                <div className="bg-slate-900/50 rounded p-3">
                  <p className="font-semibold text-white mb-1">Exploration Strategy:</p>
                  <p>
                    {bfsData.nodes < dfsData.nodes ? (
                      <>
                        <strong className="text-blue-400">{bfsData.model}</strong> was more selective, 
                        exploring {bfsData.nodes} nodes compared to {dfsData.nodes}. 
                        This suggests better semantic understanding and more focused pathfinding.
                      </>
                    ) : (
                      <>
                        <strong className="text-purple-400">{dfsData.model}</strong> was more selective, 
                        exploring {dfsData.nodes} nodes compared to {bfsData.nodes}. 
                        This suggests better semantic understanding and more focused pathfinding.
                      </>
                    )}
                  </p>
                </div>
              )}

              {winner && bfsTime && dfsTime && (
                <div className="bg-green-500/10 rounded p-3 border border-green-500/30">
                  <p className="font-semibold text-green-400 mb-1">⚡ Performance Winner:</p>
                  <p>
                    <strong className="text-white">{winner === 'BFS' ? bfsData.model : dfsData.model}</strong>
                    {' '}demonstrated superior performance by completing the search in{' '}
                    <strong className="text-green-400">{winner === 'BFS' ? bfsTime : dfsTime}s</strong>
                    {' '}with a path of <strong>{winner === 'BFS' ? bfsData.depth : dfsData.depth}</strong> steps. 
                    {bfsData.model !== dfsData.model && ' Try different model combinations to see how they compare!'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Algorithm Insights */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-3">💡 Algorithm Insights</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                • <strong className="text-blue-400">BFS (Breadth-First)</strong> explores nodes level by level, guaranteeing the shortest path but potentially exploring more nodes
              </p>
              <p>
                • <strong className="text-purple-400">DFS (Depth-First)</strong> dives deep into one path before backtracking, which can be faster but may not find the shortest path
              </p>
              {winner && (
                <p className="text-green-400">
                  • <strong>{winner === 'BFS' ? 'BFS' : 'DFS'}</strong> won the race by finding the target in {winner === 'BFS' ? bfsData.depth : dfsData.depth} steps{bfsTime && dfsTime ? ` and ${winner === 'BFS' ? bfsTime : dfsTime}s` : ''}
                </p>
              )}
              {bfsData.nodes > 0 && dfsData.nodes > 0 && (
                <>
                  <p>
                    • <strong>Node Exploration:</strong> BFS explored {bfsData.nodes} nodes vs DFS explored {dfsData.nodes} nodes
                  </p>
                  <p>
                    • <strong>Search Strategy:</strong> {bfsData.nodes > dfsData.nodes ? 'DFS was more selective in its exploration' : 'BFS was more selective in its exploration'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
