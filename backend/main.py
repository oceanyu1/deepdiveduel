import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from sockets import ConnectionManager

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
                asyncio.create_task(simulate_agent_race(""))
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def simulate_agent_race(query: str) -> None:
    fake_path = ["Start", "Food", "Pizza", "Cheese"]
    for index, node in enumerate(fake_path):
        parent = fake_path[index - 1] if index > 0 else None
        payload = {
            "type": "update",
            "node": node,
            "parent": parent,
            "status": "active",
            "path": fake_path[: index + 1],
            "agent_type": "dfs",
        }
        await manager.broadcast(payload)
        await asyncio.sleep(1)


def start():
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    start()
