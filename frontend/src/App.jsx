import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ControlBar from './components/ControlBar';
import AgentCard from './components/AgentCard';
import WinOverlay from './components/WinOverlay';
import GraphVisualization from './components/GraphVisualization';
import NodeModal from './components/NodeModal';

export default function RabbitHoleArena() {
  const [start, setStart] = useState('');
  const [target, setTarget] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const intervalRef = useRef(null);
  const wsRef = useRef(null);
  
  const [bfsData, setBfsData] = useState({ 
    logs: [], 
    nodes: 0, 
    depth: 0, 
    model: 'openai/gpt-4o',
    path: []
  });
  const [dfsData, setDfsData] = useState({ 
    logs: [], 
    nodes: 0, 
    depth: 0, 
    model: 'openai/gpt-4o',
    path: []
  });

  const [bfsGraphData, setBfsGraphData] = useState({ nodes: [], links: [] });
  const [dfsGraphData, setDfsGraphData] = useState({ nodes: [], links: [] });

  const getModelDisplayName = (modelId) => {
    const modelNames = {
      'openai/gpt-4o': 'GPT-4o',
      'mistralai/mistral-large': 'Mistral Large',
      'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
      'mistralai/mistral-7b-instruct': 'Mistral 7B Instruct',
      'nousresearch/hermes-2-pro-llama-3-8b': 'Pro Llama 3 8B'
    };
    return modelNames[modelId] || modelId;
  };

  const extractTopicFromUrl = (url) => {
    // Extract topic from Wikipedia URL
    // e.g., https://en.wikipedia.org/wiki/Microwave -> Microwave
    const match = url.match(/\/wiki\/([^?#]+)$/);
    if (match) {
      return decodeURIComponent(match[1].replace(/_/g, ' '));
    }
    return null;
  };

  const startRabbitHole = async () => {
    if (!start || !target) {
      alert('Please enter both a starting URL and target URL!');
      return;
    }

    // Validate URLs
    if (!start.includes('wikipedia.org/wiki/') || !target.includes('wikipedia.org/wiki/')) {
      alert('Please enter valid Wikipedia URLs (e.g., https://en.wikipedia.org/wiki/Topic)');
      return;
    }

    const startTopic = extractTopicFromUrl(start);
    const targetTopic = extractTopicFromUrl(target);

    if (!startTopic || !targetTopic) {
      alert('Could not extract topics from URLs. Please check the format.');
      return;
    }

    // Validate URLs with backend
    try {
      const response = await fetch('http://127.0.0.1:8000/validate-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_url: start, target_url: target })
      });
      
      const result = await response.json();
      if (!result.valid) {
        alert(`Invalid Wikipedia URL(s): ${result.message}`);
        return;
      }
    } catch (error) {
      alert('Could not validate URLs. Make sure the backend is running.');
      return;
    }

    setIsRunning(true);
    setWinner(null);
    
    setBfsData({ logs: [`Starting from: ${startTopic}...`], nodes: 0, depth: 0, model: bfsData.model, path: [startTopic] });
    setDfsData({ logs: [`Starting from: ${startTopic}...`], nodes: 0, depth: 0, model: dfsData.model, path: [startTopic] });
    const startTimestamp = new Date().toLocaleString();
    setBfsGraphData({ 
      nodes: [{ 
        id: startTopic, 
        isStart: true,
        timestamp: startTimestamp,
        wikipediaUrl: start
      }], 
      links: [] 
    });
    setDfsGraphData({ 
      nodes: [{ 
        id: startTopic, 
        isStart: true,
        timestamp: startTimestamp,
        wikipediaUrl: start
      }], 
      links: [] 
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(`start:${startTopic},target:${targetTopic},bfs_model:${bfsData.model},dfs_model:${dfsData.model}`);
    } else {
      alert('WebSocket not connected! Make sure backend is running on localhost:8000');
      setIsRunning(false);
    }
  };

  const stopRabbitHole = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('stop');
    }
    setIsRunning(false);
    console.log('🛑 Race stopped by user.');
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
            isTarget: payload.status === 'success',
            wikipediaUrl: payload.wikipedia_url,
            timestamp: new Date().toLocaleString(),
            duration: payload.duration_ms || 0
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
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('stop'); // Force stop on component unmount/refresh
      }
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
        onStop={stopRabbitHole}
      />

      <div className="max-w-7xl mx-auto my-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraphVisualization 
          graphData={bfsGraphData} 
          title="BFS Search Graph" 
          color="blue"
          onNodeClick={setSelectedNode}
        />
        <GraphVisualization 
          graphData={dfsGraphData} 
          title="DFS Search Graph" 
          color="purple"
          onNodeClick={setSelectedNode}
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
            model: getModelDisplayName(winner === 'BFS' ? bfsData.model : dfsData.model)
          }}
          onReset={resetArena}
        />
      )}

      <NodeModal 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />
    </div>
  );
}