import { useState, useRef } from 'react';
import Header from './components/Header';
import ControlBar from './components/ControlBar';
import AgentCard from './components/AgentCard';
import WinOverlay from './components/WinOverlay';

export default function RabbitHoleArena() {
  const [start, setStart] = useState('');
  const [target, setTarget] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState(null);
  const intervalRef = useRef(null);
  
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

  const startRabbitHole = () => {
    if (!start || !target) {
      alert('Please enter both a starting website and target concept!');
      return;
    }

    setIsRunning(true);
    setWinner(null);
    
    setBfsData({ logs: [], nodes: 0, depth: 0, model: bfsData.model, path: [] });
    setDfsData({ logs: [], nodes: 0, depth: 0, model: dfsData.model, path: [] });
    
    setBfsData(prev => ({ 
      ...prev, 
      logs: [
        `Starting from: ${start}`,
        'Analyzing all adjacent links...',
        'Found 12 sibling pages',
        'Visiting: Condiments',
        'Visiting: Food Science',
        'Visiting: Kitchen Tools'
      ],
      path: [start]
    }));
    
    setDfsData(prev => ({ 
      ...prev, 
      logs: [
        `Starting from: ${start}`,
        'Following deepest link...',
        'Diving into: History of Spices',
        'Going deeper: Ancient Trade Routes',
        'Deeper still: Medieval Commerce',
        'Found link: Preservation Methods'
      ],
      path: [start]
    }));

    intervalRef.current = setInterval(() => {
      setBfsData(prev => {
        const newNodes = prev.nodes + Math.floor(Math.random() * 3) + 1;
        const newDepth = Math.floor(newNodes / 3);
        const newLogs = [...prev.logs];
        
        if (newNodes % 5 === 0) {
          newLogs.push(`Scanned ${newNodes} pages...`);
        }
        
        if (newNodes >= 30 && !winner) {
          setWinner('BFS');
          setIsRunning(false);
          clearInterval(intervalRef.current);
          return {
            ...prev,
            nodes: newNodes,
            depth: newDepth,
            logs: [...newLogs, `✓ Found connection to ${target}!`],
            path: [start, 'Condiments', 'Food Preservation', 'Heat Treatment', 'Kitchen Appliances', target]
          };
        }
        
        return {
          ...prev,
          nodes: newNodes,
          depth: newDepth,
          logs: newLogs.slice(-8)
        };
      });
      
      setDfsData(prev => {
        const newNodes = prev.nodes + Math.floor(Math.random() * 2) + 1;
        const newDepth = Math.floor(newNodes / 2);
        const newLogs = [...prev.logs];
        
        if (newNodes % 4 === 0) {
          newLogs.push(`Exploring depth level ${newDepth}...`);
        }
        
        if (newNodes >= 35 && !winner) {
          setWinner('DFS');
          setIsRunning(false);
          clearInterval(intervalRef.current);
          return {
            ...prev,
            nodes: newNodes,
            depth: newDepth,
            logs: [...newLogs, `✓ Found connection to ${target}!`],
            path: [start, 'History', 'Industrial Revolution', 'Electromagnetic Waves', 'Radio Technology', 'Magnetron', target]
          };
        }
        
        return {
          ...prev,
          nodes: newNodes,
          depth: newDepth,
          logs: newLogs.slice(-8)
        };
      });
    }, 400);
  };

  const resetArena = () => {
    setWinner(null);
    setIsRunning(false);
    setBfsData({ logs: [], nodes: 0, depth: 0, model: bfsData.model, path: [] });
    setDfsData({ logs: [], nodes: 0, depth: 0, model: dfsData.model, path: [] });
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