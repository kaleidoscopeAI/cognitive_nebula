type ICAMessageListener = (data: any) => void;

class ICAService {
    private ws: WebSocket | null = null;
    private listeners: ICAMessageListener[] = [];
    private reconnectInterval: number = 3000; // 3 seconds
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log("WebSocket is already connected.");
            return;
        }

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log("ICA WebSocket connected.");
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.listeners.forEach(listener => listener(data));
            } catch (error) {
                console.error("Error parsing incoming ICA message:", error);
            }
        };

        this.ws.onerror = (error) => {
            console.error("ICA WebSocket error:", error);
        };

        this.ws.onclose = () => {
            console.log("ICA WebSocket disconnected. Attempting to reconnect...");
            setTimeout(() => this.connect(), this.reconnectInterval);
        };
    }

    sendMessage(type: string, payload: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type, payload });
            this.ws.send(message);
        } else {
            console.error("Cannot send message, WebSocket is not connected.");
        }
    }

    onMessage(listener: ICAMessageListener) {
        this.listeners.push(listener);

        // Return an unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

// Export a singleton instance of the service
export const icaService = new ICAService("ws://localhost:5001/ws/ica");
