import { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function GraphVisualization({ graphData, title, color, onNodeClick }) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Set dimensions based on container
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  useEffect(() => {
    // Center view only once when graph starts
    if (fgRef.current && graphData.nodes.length > 0 && !hasInitialized) {
      setTimeout(() => {
        // Use zoomToFit for initial view to center on nodes properly
        fgRef.current.zoomToFit(400, 80);
        setHasInitialized(true);
      }, 300);
    }
    
    // Reset when graph is cleared
    if (graphData.nodes.length === 0) {
      setHasInitialized(false);
    }
  }, [graphData.nodes.length, hasInitialized]);

  const nodeColor = color === 'blue' ? '#3b82f6' : '#a855f7';
  const linkColor = color === 'blue' ? '#3b82f6' : '#a855f7';

  const handleResetView = () => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Fit all nodes in view with padding
      fgRef.current.zoomToFit(400, 80);
    }
  };

  const handleCenterView = () => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Calculate center of all nodes
      const avgX = graphData.nodes.reduce((sum, node) => sum + (node.x || 0), 0) / graphData.nodes.length;
      const avgY = graphData.nodes.reduce((sum, node) => sum + (node.y || 0), 0) / graphData.nodes.length;
      fgRef.current.centerAt(avgX, avgY, 400);
    }
  };

  return (
    <div className="w-full h-[400px] bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="p-3 border-b border-slate-700 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-xs text-slate-400 mt-1">
            {graphData.nodes.length} nodes explored
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
            Drag • Scroll zoom • Pan
          </span>
          <button
            onClick={handleCenterView}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded transition-colors"
          >
            Center
          </button>
          <button
            onClick={handleResetView}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded transition-colors"
          >
            Fit All
          </button>
        </div>
      </div>
      <div ref={containerRef} className="w-full h-[calc(100%-70px)]">
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel="id"
          nodeRelSize={5}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.id;
            const fontSize = 10 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            
            // Node color
            let fillColor = nodeColor;
            if (node.isStart) fillColor = '#22c55e'; // green
            if (node.isTarget) fillColor = '#ef4444'; // red
            
            // Draw circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = fillColor;
            ctx.fill();
            
            // Draw label
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(label, node.x, node.y + 8);
          }}
          onNodeClick={(node) => {
            if (onNodeClick) {
              onNodeClick(node);
            }
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
          linkColor={() => linkColor}
          linkWidth={1.5}
          backgroundColor="#1e293b"
          cooldownTicks={100}
        />
      </div>
    </div>
  );
}
