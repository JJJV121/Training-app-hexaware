class MessagingSocketManager {
  constructor() {
    self.ws = null;
    self.conversationId = null;
    self.listeners = {
      message: [],
      typing: [],
      status: [],
    };
    self.pingInterval = null;
    self.reconnectTimeout = null;
  }

  getWsUrl(conversationId, token) {
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
      ? import.meta.env.VITE_API_BASE_URL
      : 'http://localhost:8000';

    const wsProto = apiBase.startsWith('https') ? 'wss:' : 'ws:';
    const host = apiBase.replace(/^https?:\/\//, '');

    return `${wsProto}//${host}/ws/messaging/${conversationId}?token=${encodeURIComponent(token)}`;
  }

  connect(conversationId, onMessageCallback, onTypingCallback) {
    this.disconnect();

    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token || !conversationId) {
      console.warn('Cannot connect WebSocket: missing token or conversationId');
      return;
    }

    this.conversationId = conversationId;
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const url = this.getWsUrl(conversationId, cleanToken);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log(`WebSocket connected for conversation #${conversationId}`);
        this.startHeartbeat();
        this.notifyStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'NEW_MESSAGE') {
            if (onMessageCallback) onMessageCallback(data.message);
            this.listeners.message.forEach((cb) => cb(data.message));
          } else if (data.type === 'TYPING') {
            if (onTypingCallback) onTypingCallback(data);
            this.listeners.typing.forEach((cb) => cb(data));
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
        this.notifyStatus('error');
      };

      this.ws.onclose = () => {
        console.log(`WebSocket closed for conversation #${conversationId}`);
        this.stopHeartbeat();
        this.notifyStatus('disconnected');
      };
    } catch (e) {
      console.error('Failed to create WebSocket instance:', e);
    }
  }

  sendMessage(content) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'SEND_MESSAGE', content }));
      return true;
    }
    return false;
  }

  sendTyping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'TYPING' }));
    }
  }

  markRead() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'MARK_READ' }));
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 25000);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  notifyStatus(status) {
    this.listeners.status.forEach((cb) => cb(status));
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.conversationId = null;
  }
}

export default new MessagingSocketManager();
