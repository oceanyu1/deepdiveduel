import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ControlBar from './components/ControlBar';
import AgentCard from './components/AgentCard';
import WinOverlay from './components/WinOverlay';
import GraphVisualization from './components/GraphVisualization';

export default function RabbitHoleArena() {
  const [start, setStart] = useState('');
  const [target, setTarget] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState(null);
  const intervalRef = useRef(null);
  const wsRef = useRef(null);
  
  const [bfsData, setBfsData] = useState({ 
    logs: [], 
    nodes: 0, 
    depth: 0, 
    model: 'ChatGPT-4o',
    path: []
  });
  const [dfsData, setDfsData] = useState({ 
    logs: [], 
    nodes: 0, 
    depth: 0, 
    model: 'ChatGPT-4o',
    path: []
  });

  const [bfsGraphData, setBfsGraphData] = useState({ nodes: [], links: [] });
  const [dfsGraphData, setDfsGraphData] = useState({ nodes: [], links: [] });

  const startRabbitHole = () => {
    if (!start || !target) {
      alert('Please enter both a starting website and target concept!');
      return;
    }

    setIsRunning(true);
    setWinner(null);
    
    setBfsData({ logs: [`Starting from: ${start}...`], nodes: 0, depth: 0, model: bfsData.model, path: [start] });
    setDfsData({ logs: [`Starting from: ${start}...`], nodes: 0, depth: 0, model: dfsData.model, path: [start] });
    setBfsGraphData({ 
      nodes: [{ id: start, isStart: true }], 
      links: [] 
    });
    setDfsGraphData({ 
      nodes: [{ id: start, isStart: true }], 
      links: [] 
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(`start:${start},target:${target}`);
    } else {
      alert('WebSocket not connected! Make sure backend is running on localhost:8000');
      setIsRunning(false);
    }
  };

  const resetArena = () => {
    setWinner(null);
    setIsRunning(false);
    setBfsData({ logs: [], nodes: 0, depth: 0, model: bfsData.model, path: [] });
    setDfsData({ logs: [], nodes: 0, depth: 0, model: dfsData.model, path: [] });
    setBfsGraphData({ nodes: [], links: [] });
    setDfsGraphData({ nodes: [], links: [] });
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const updateBfsModel = (model) => {
    setBfsData(prev => ({ ...prev, model }));
  };

  const updateDfsModel = (model) => {
    setDfsData(prev => ({ ...prev, model }));
  };

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      // Handle finish event (winner)
      if (payload.type === 'finish') {
        if (payload.winner && payload.agent_type) {
          const winnerName = payload.agent_type.toUpperCase();
          setWinner(winnerName);
          setIsRunning(false);
          
          console.log(`🏆 ${winnerName} won! Stopping all agents.`);
          
          // Update the winning agent's final data
          if (payload.agent_type === 'bfs') {
            setBfsData(prev => ({
              ...prev,
              logs: [...prev.logs, `✓ Found target!`, `🏆 Winner!`],
              path: payload.final_path || prev.path
            }));
          } else {
            setDfsData(prev => ({
              ...prev,
              logs: [...prev.logs, `✓ Found target!`, `🏆 Winner!`],
              path: payload.final_path || prev.path
            }));
          }
        } else {
          // Handle the losing agent's final update
          if (payload.agent_type === 'bfs') {
            setBfsData(prev => ({
              ...prev,
              logs: [...prev.logs, `❌ Race stopped`]
            }));
          } else {
            setDfsData(prev => ({
              ...prev,
              logs: [...prev.logs, `❌ Race stopped`]
            }));
          }
        }
        return;
      }

      // Handle update event
      if (payload.type !== 'update' || !payload.node || !payload.path) {
        return;
      }

      const nextLog = `Visiting: ${payload.node}`;
      const agentType = payload.agent_type;
      
      // Update the appropriate graph data
      const updateGraph = agentType === 'bfs' ? setBfsGraphData : setDfsGraphData;
      
      updateGraph(prev => {
        const newNodes = [...prev.nodes];
        const newLinks = [...prev.links];
        
        // Add current node if not exists
        if (!newNodes.find(n => n.id === payload.node)) {
          newNodes.push({
            id: payload.node,
            isTarget: payload.status === 'success'
          });
        }
        
        // Add link from parent if exists
        if (payload.parent && !newLinks.find(l => 
          l.source === payload.parent && l.target === payload.node
        )) {
          newLinks.push({
            source: payload.parent,
            target: payload.node
          });
        }
        
        return { nodes: newNodes, links: newLinks };
      });
      
      if (agentType === 'bfs') {
        setBfsData(prev => ({
          ...prev,
          logs: [...prev.logs, nextLog].slice(-8),
          nodes: payload.path.length,
          depth: Math.max(payload.path.length - 1, 0),
          path: payload.path
        }));
      } else {
        setDfsData(prev => ({
          ...prev,
          logs: [...prev.logs, nextLog].slice(-8),
          nodes: payload.path.length,
          depth: Math.max(payload.path.length - 1, 0),
          path: payload.path
        }));
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <Header />
      
      <ControlBar 
        start={start}
        target={target}
        setStart={setStart}
        setTarget={setTarget}
        isRunning={isRunning}
        onStart={startRabbitHole}
      />

      <div className="max-w-7xl mx-auto my-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraphVisualization 
          graphData={bfsGraphData} 
          title="BFS Search Graph" 
          color="blue"
        />
        <GraphVisualization 
          graphData={dfsGraphData} 
          title="DFS Search Graph" 
          color="purple"
        />
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AgentCard 
          title="The Explorer (BFS)" 
          color="blue" 
          data={bfsData} 
          description="Scanning siblings and adjacent links first."
          onModelChange={updateBfsModel}
          isRunning={isRunning}
        />

        <AgentCard 
          title="The Deep Diver (DFS)" 
          color="purple" 
          data={dfsData} 
          description="Following a single thread as deep as it goes."
          onModelChange={updateDfsModel}
          isRunning={isRunning}
        />
      </main>

      {winner && (
        <WinOverlay 
          winner={winner === 'BFS' ? 'The Explorer (BFS)' : 'The Deep Diver (DFS)'}
          path={winner === 'BFS' ? bfsData.path : dfsData.path}
          stats={{
            clicks: winner === 'BFS' ? bfsData.depth : dfsData.depth,
            nodes: winner === 'BFS' ? bfsData.nodes : dfsData.nodes,
            model: winner === 'BFS' ? bfsData.model : dfsData.model
          }}
          onReset={resetArena}
        />
      )}
    </div>
  );
}