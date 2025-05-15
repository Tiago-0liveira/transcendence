import { toastHelper } from "@/utils/toastHelper";

class SocketHandler {
	private static instance: SocketHandler;
	private socket: WebSocket;

	private pingIntervalId: number;
	private lastPongTime!: number;
	private lastPingTime!: number;
	private reconnectTimeoutId: number;
	private tryToReconnect: boolean;

	static PING_INTERVAL_TIMEOUT = 5000 as const;
	static RECONNECT_BASE_TIMEOUT = 8000 as const;

	public static getInstance() {
		if (!SocketHandler.instance) {
			SocketHandler.instance = new SocketHandler();
		}
		return SocketHandler.instance;
	}

	private pingIntervalHandler() {
		const now = Date.now();
		if (now - this.lastPongTime > SocketHandler.PING_INTERVAL_TIMEOUT * 2) {
			console.warn("WebSocket is unresponsive. Attempting to reconnect...");
			if (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)
				this.socket.close();
			return;
		}
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send("ping");
			this.lastPingTime = Date.now();
		}
	}
	private reconnectHandler() {
		if (this.tryToReconnect) {
			this.cleanUpSocketListeners();
			this.socket = this.createSocket();
			this.prepareSocket();
		}
	}

	private constructor() {
		this.tryToReconnect = false;

		this.socket = this.createSocket();
		this.prepareSocket();

		this.pingIntervalId = setInterval(this.pingIntervalHandler.bind(this), SocketHandler.PING_INTERVAL_TIMEOUT);
		this.reconnectTimeoutId = setInterval(this.reconnectHandler.bind(this), SocketHandler.RECONNECT_BASE_TIMEOUT);
	}

	private createSocket(): WebSocket {
		try {
			const socket = new WebSocket(`ws://localhost:4000/ws`);
			console.log("socket: ", socket);
			return socket;
		} catch (error) {
			toastHelper.error(`Could not connect to WebSocket!\n`);
			throw new Error("Could not connect to WebSocket!");
		}
	}

	private prepareSocket() {
		this.lastPingTime = Date.now();
		this.lastPongTime = Date.now();

		this.socket.addEventListener("open", this.openHandler.bind(this));
		this.socket.addEventListener("message", this.messageHandler.bind(this));
		this.socket.addEventListener("error", this.errorHandler.bind(this));
		this.socket.addEventListener("close", this.closeHandler.bind(this));
	}

	private cleanUpSocketListeners() {
		this.socket.removeEventListener("open", this.openHandler.bind(this));
		this.socket.removeEventListener("message", this.messageHandler.bind(this));
		this.socket.removeEventListener("error", this.errorHandler.bind(this));
		this.socket.removeEventListener("close", this.closeHandler.bind(this));
	}

	private openHandler(ev: Event) {
		console.log("WebSocket connection opened.");
		this.tryToReconnect = false;
	}

	private errorHandler(ev: Event) {
		console.error("WebSocket encountered an error:", ev);
		toastHelper.error("WebSocket error occurred!");
	}

	private messageHandler(ev: MessageEvent<any>) {
		if (ev.data === "pong") {
			this.lastPongTime = Date.now();

			const calculatedPing = this.lastPongTime - this.lastPingTime;
			console.log("ping: ", calculatedPing, " ms")
		}
	}

	private closeHandler(ev: CloseEvent) {
		console.warn("WebSocket connection closed. Reason:", ev.reason || "Unknown");
		/*toastHelper.error("WebSocket disconnected!");*/
		this.cleanUpSocketListeners();
		this.tryToReconnect = true;
	}
}

export default SocketHandler;
