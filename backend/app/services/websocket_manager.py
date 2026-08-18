import asyncio
import json
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Maps conversation_id -> Set of active WebSocket connections
        self.active_conversations: Dict[int, Set[WebSocket]] = {}
        # Maps user_id -> Set of active WebSocket connections across all tabs/devices
        self.user_connections: Dict[int, Set[WebSocket]] = {}
        # Maps WebSocket -> (conversation_id, user_id)
        self.socket_info: Dict[WebSocket, tuple[int, int]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        await websocket.accept()

        if conversation_id not in self.active_conversations:
            self.active_conversations[conversation_id] = set()
        self.active_conversations[conversation_id].add(websocket)

        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

        self.socket_info[websocket] = (conversation_id, user_id)
        logger.info(f"WebSocket connected: user_id={user_id}, conversation_id={conversation_id}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.socket_info:
            conversation_id, user_id = self.socket_info.pop(websocket)

            if conversation_id in self.active_conversations:
                self.active_conversations[conversation_id].discard(websocket)
                if not self.active_conversations[conversation_id]:
                    del self.active_conversations[conversation_id]

            if user_id in self.user_connections:
                self.user_connections[user_id].discard(websocket)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]

            logger.info(f"WebSocket disconnected: user_id={user_id}, conversation_id={conversation_id}")

    async def broadcast_to_conversation(self, conversation_id: int, message_data: dict):
        if conversation_id in self.active_conversations:
            connections = list(self.active_conversations[conversation_id])
            for websocket in connections:
                try:
                    await websocket.send_json(message_data)
                except Exception as e:
                    logger.warning(f"Error broadcasting to WebSocket: {e}")
                    self.disconnect(websocket)

    def is_user_online(self, user_id: int) -> bool:
        return bool(self.user_connections.get(user_id))

    def get_online_user_ids(self) -> Set[int]:
        return set(self.user_connections.keys())


manager = ConnectionManager()
