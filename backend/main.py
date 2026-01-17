import asyncio
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from sockets import ConnectionManager
from graph_racer import app as graph_app

app = FastAPI()
manager = ConnectionManager()

# Allow all origins for easy frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "message": "health check"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            message = await websocket.receive_text()
            if message == "start":
                # Default query for testing
                asyncio.create_task(simulate_agent_race("start:Microwave,target:Chocolate"))
            elif message.startswith("start:"):
                # Allow custom query format: "start:Topic1,target:Topic2"
                asyncio.create_task(simulate_agent_race(message))
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def run_agent(start_topic: str, end_topic: str, mode: str):
    """Run a single agent (BFS or DFS) and broadcast updates."""
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
    
    print(f"🚀 Starting {mode.upper()} race: {start_topic} -> {end_topic}")
    
    async for event in graph_app.astream(initial_state):
        data = event.get("search")
        if data:
            path = data.get("current_path", [])
            parent = path[-2] if len(path) > 1 else None
            current = data.get("current_topic")
            
            wiki_url = f"https://en.wikipedia.org/wiki/{current.replace(' ', '_')}" if current else None
            
            payload = {
                "type": "update",
                "node": current,
                "parent": parent,
                "status": data.get("status"),
                "path": path,
                "wikipedia_url": wiki_url,
                "duration_ms": data.get("duration_ms", 0),
                "agent_model": "meta-llama/llama-3-70b-instruct",
                "agent_type": mode
            }
            await manager.broadcast(payload)
            
            if data.get("status") == "success":
                await manager.broadcast({
                    "type": "finish",
                    "agent_type": mode,
                    "winner": True,
                    "final_path": path,
                    "total_steps": len(path) - 1
                })
                break
            elif data.get("status") == "failed":
                await manager.broadcast({
                    "type": "finish",
                    "agent_type": mode,
                    "winner": False,
                    "message": "No path found"
                })
                break

async def simulate_agent_race(query: str) -> None:
    """Parse query and run both BFS and DFS agents in parallel."""
    # Expect query format: "start:Microwave,target:Chocolate"
    # Or fallback to defaults
    try:
        parts = dict(item.split(":") for item in query.split(","))
        start = parts.get("start", "Microwave")
        target = parts.get("target", "Chocolate")
    except:
        start = "Microwave"
        target = "Chocolate"
    
    # Run both agents in parallel
    await asyncio.gather(
        run_agent(start, target, "bfs"),
        run_agent(start, target, "dfs")
    )


def start():
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    start()
