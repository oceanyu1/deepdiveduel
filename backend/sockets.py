from fastapi import WebSocket
import json
from typing import List, Dict
import asyncio


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.active_tasks: Dict[WebSocket, List[asyncio.Task]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.active_tasks[websocket] = []

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        # Cancel any remaining tasks for this connection
        tasks = self.active_tasks.pop(websocket, [])
        for task in tasks:
            if not task.done():
                task.cancel()
        print("🔌 Connection closed, tasks cancelled.")

    async def broadcast(self, payload: dict):
        message = json.dumps(payload)
        for connection in self.active_connections:
            await connection.send_text(message)

    def add_tasks(self, websocket: WebSocket, tasks: List[asyncio.Task]):
        """Store tasks associated with a connection."""
        self.active_tasks[websocket] = tasks

    def cancel_tasks(self, websocket: WebSocket):
        """Cancel all tasks for a specific connection."""
        tasks = self.active_tasks.pop(websocket, [])
        for task in tasks:
            if not task.done():
                task.cancel()
        self.active_tasks[websocket] = []  # Clear tasks
        print(f"🛑 Tasks for connection cancelled by user.")
