from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import json

# Import your graph setup
from graph_racer import app, AgentState 

app_server = FastAPI()

# Allow React to connect (CORS)
app_server.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for hackathon
    allow_methods=["*"],
    allow_headers=["*"],
)

@app_server.websocket("/ws/race")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # 1. Wait for Frontend to say "GO" with settings
    data = await websocket.receive_text()
    config = json.loads(data)
    
    start_topic = config.get("start", "Microwave")
    end_topic = config.get("end", "Chocolate")
    mode = config.get("mode", "bfs") # 'bfs' or 'dfs'

    # 2. Initialize State
    initial_state = {
        "target": end_topic,
        "mode": mode,
        "model_name": "meta-llama/llama-3-70b-instruct",
        "queue": [(start_topic, [start_topic])],
        "visited": [],
        "current_topic": start_topic,
        "current_path": [start_topic],
        "status": "start",
        "node_start_time": 0.0,
        "duration_ms": 0.0
    }

    print(f"🚀 Client connected. Starting {mode.upper()} race: {start_topic} -> {end_topic}")

    # 3. Run the Graph & Stream Output
    # We use astream (async stream) so we don't block the server
    async for event in app.astream(initial_state):
        data = event.get("search")
        if data:
            # Calculate Parent for Visualization (Edge drawing)
            # Path is like ["Microwave", "Raytheon"]. Parent is index -2.
            path = data.get("current_path", [])
            parent = path[-2] if len(path) > 1 else None
            current = data.get("current_topic")
            
            # Generate Wikipedia URL
            wiki_url = f"https://en.wikipedia.org/wiki/{current.replace(' ', '_')}" if current else None
            
            # 4. Send JSON to Frontend
            payload = {
                "type": "update",
                "node": current,
                "parent": parent,
                "status": data.get("status"),
                "path": path,
                "wikipedia_url": wiki_url,
                "duration_ms": data.get("duration_ms", 0),
                "agent_model": data.get("model_name", "meta-llama/llama-3-70b-instruct"),
                "agent_type": mode
            }
            await websocket.send_json(payload)
            
            # Artificial delay for dramatic effect (optional)
            await asyncio.sleep(0.5)
            
            # Check if we're done (success OR failure)
            if data.get("status") == "success":
                await websocket.send_json({
                    "type": "finish", 
                    "winner": True,
                    "final_path": path,
                    "total_steps": len(path) - 1
                })
                break
            elif data.get("status") == "failed":
                await websocket.send_json({
                    "type": "finish", 
                    "winner": False,
                    "message": "No path found"
                })
                break

if __name__ == "__main__":
    uvicorn.run(app_server, host="0.0.0.0", port=8000)