export default function NodeModal({ node, onClose }) {
  if (!node) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-2xl border border-slate-700 max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-white">{node.id}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {node.wikipediaUrl && (
            <div>
              <p className="text-sm text-slate-400 mb-2">Wikipedia Page</p>
              <a
                href={node.wikipediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit Wikipedia
              </a>
            </div>
          )}

          {node.timestamp && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Visited At</p>
              <p className="text-white font-mono">{node.timestamp}</p>
            </div>
          )}

          {node.duration !== undefined && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Processing Time</p>
              <p className="text-white font-mono">{node.duration.toFixed(2)} ms</p>
            </div>
          )}

          {node.isStart && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
              <p className="text-green-400 font-semibold">🚀 Starting Node</p>
            </div>
          )}

          {node.isTarget && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 font-semibold">🎯 Target Node</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
