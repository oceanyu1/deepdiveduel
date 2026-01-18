import asyncio
import json
import wikipediaapi

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from sockets import ConnectionManager
from graph_racer import app as graph_app

app = FastAPI()
manager = ConnectionManager()

# Pydantic model for URL validation
class URLValidation(BaseModel):
    start_url: str
    target_url: str

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


@app.post("/validate-urls")
async def validate_urls(urls: URLValidation):
    """Validate that both Wikipedia URLs exist using the wikipedia-api library."""
    def extract_title_from_url(url: str) -> str:
        """Extract the title from a Wikipedia URL."""
        if "/wiki/" not in url:
            return None
        return url.split("/wiki/")[-1].split("?")[0].split("#")[0]
    
    start_title = extract_title_from_url(urls.start_url)
    target_title = extract_title_from_url(urls.target_url)
    
    if not start_title or not target_title:
        return {"valid": False, "message": "Invalid Wikipedia URL format"}
    
    # Check both URLs
    start_valid = check_with_library(urls.start_url)
    target_valid = check_with_library(urls.target_url)
    
    if not start_valid and not target_valid:
        return {"valid": False, "message": "Both Wikipedia pages do not exist"}
    elif not start_valid:
        return {"valid": False, "message": f"Starting page '{start_title}' does not exist"}
    elif not target_valid:
        return {"valid": False, "message": f"Target page '{target_title}' does not exist"}
    
    return {"valid": True, "message": "Both URLs are valid"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            message = await websocket.receive_text()
            if message.startswith("start:"):
                # Allow custom query format: "start:Topic1,target:Topic2"
                race_task = asyncio.create_task(simulate_agent_race(websocket, message))
                # We don't store this task in the manager as it manages its own children
            elif message == "stop":
                manager.cancel_tasks(websocket)

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
    
    try:
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
    except asyncio.CancelledError:
        print(f"🛑 {mode.upper()} agent cancelled.")
        # Optionally, notify the frontend that this agent was stopped
        await manager.broadcast({
            "type": "stop_ack",
            "agent_type": mode,
            "message": "Agent stopped by user."
        })
    except Exception as e:
        print(f"Error in {mode.upper()} agent: {e}")


async def simulate_agent_race(websocket: WebSocket, query: str) -> None:
    """Parse query and run both BFS and DFS agents in parallel until one wins."""
    # Expect query format: "start:Microwave,target:Chocolate"
    # Or fallback to defaults
    try:
        parts = dict(item.split(":") for item in query.split(","))
        start = parts.get("start", "Microwave")
        target = parts.get("target", "Chocolate")
    except:
        start = "Microwave"
        target = "Chocolate"
    
    # Run both agents in parallel but cancel when one finishes
    bfs_task = asyncio.create_task(run_agent(start, target, "bfs"))
    dfs_task = asyncio.create_task(run_agent(start, target, "dfs"))

    # Associate tasks with the connection for cancellation
    manager.add_tasks(websocket, [bfs_task, dfs_task])
    
    # Wait for first one to complete
    done, pending = await asyncio.wait(
        [bfs_task, dfs_task],
        return_when=asyncio.FIRST_COMPLETED
    )
    
    # Cancel the remaining tasks
    for task in pending:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    
    print(f"🏁 Race finished! Winner stopped both agents.")

def check_with_library(url):
    # Extract the title from the URL first (e.g., "Apple" from ".../wiki/Apple")
    title = url.split("/wiki/")[-1]
    
    wiki = wikipediaapi.Wikipedia('MyApp/1.0', 'en')
    page = wiki.page(title)
    
    return page.exists()

def start():
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    start()
