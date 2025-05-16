import { toastHelper } from "@/utils/toastHelper";
import AuthManager from "./authManager";

class SocketHandler {
	private static instance: SocketHandler;
	private socket: WebSocket | null = null;

	private pingIntervalId: number;
	private reconnectTimeoutId: number;
	private lastPongTime!: number;
	private lastPingTime!: number;
	private tryToReconnect!: boolean;

	static PING_INTERVAL_TIMEOUT = 5000 as const;
	static RECONNECT_BASE_TIMEOUT = 8000 as const;

	public static getInstance() {
		if (!SocketHandler.instance) {
			SocketHandler.instance = new SocketHandler();
		}
		return SocketHandler.instance;
	}

	private pingIntervalHandler() {
		if (!this.socket)
			return;
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
		}
	}

	private constructor() {
		this.pingIntervalId = setInterval(this.pingIntervalHandler.bind(this), SocketHandler.PING_INTERVAL_TIMEOUT);
		this.reconnectTimeoutId = setInterval(this.reconnectHandler.bind(this), SocketHandler.RECONNECT_BASE_TIMEOUT);
	}

	public disconnect() {
		if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
			this.socket.close();
		}
	}
	public connect() {
		this.socket = this.createSocket();
	}

	private createSocket(): WebSocket {
		try {
			const accessToken = AuthManager.getInstance().GetAccessToken();
			if (!accessToken)
				throw new Error("Invalid AccessToken")
			const socket = new WebSocket(`ws://localhost:4000/ws?accessToken=${encodeURIComponent(accessToken)}`);
			this.prepareSocket(socket);
			return socket;
		} catch (error) {
			toastHelper.error(`Could not connect to WebSocket!\n`);
			throw new Error("Could not connect to WebSocket!");
		}
	}

	private prepareSocket(socket: WebSocket) {
		this.tryToReconnect = false;
		this.lastPingTime = Date.now();
		this.lastPongTime = Date.now();

		socket.addEventListener("open", this.openHandler.bind(this));
		socket.addEventListener("message", this.messageHandler.bind(this));
		socket.addEventListener("error", this.errorHandler.bind(this));
		socket.addEventListener("close", this.closeHandler.bind(this));
	}

	private cleanUpSocketListeners() {
		if (!this.socket)
			return;

		this.socket.removeEventListener("open", this.openHandler.bind(this));
		this.socket.removeEventListener("message", this.messageHandler.bind(this));
		this.socket.removeEventListener("error", this.errorHandler.bind(this));
		this.socket.removeEventListener("close", this.closeHandler.bind(this));
		this.socket = null;
	}

	private openHandler(ev: Event) {
		console.log("WebSocket connection opened.");
		this.tryToReconnect = false;
	}

	private errorHandler(ev: Event) {
		console.error("WebSocket encountered an error:", ev);
		toastHelper.error("WebSocket error occurred!");
	}

	private static isSocketValidMessage(message: any): message is SocketMessage {
		return typeof message === "object" && typeof message.type === "string"
	}

	private messageHandler(ev: MessageEvent<any>) {
		if (ev.data === "pong") {
			this.lastPongTime = Date.now();

			const calculatedPing = this.lastPongTime - this.lastPingTime;
			console.log("ping: ", calculatedPing, " ms");
			return;
		}
		try {
			const parsedMessage = JSON.parse(ev.data);
			if (SocketHandler.isSocketValidMessage(parsedMessage)) {
				console.log("parsedMessage: ", parsedMessage);
				switch (parsedMessage.type) {
					case "friend-online":
						toastHelper.friendOnline(parsedMessage.friendName, parsedMessage.avatar);
						break;
					case "friend-request":
						toastHelper.friendRequest(parsedMessage.friendName, parsedMessage.avatar, parsedMessage.friendId);
						break;
					case "friend-request-accepted":
						toastHelper.friendRequestAccepted(parsedMessage.friendName, parsedMessage.avatar);
						break;
					default:
						console.error(`Unkonwn SocketMessageType: ${parsedMessage}`);
						break;
				}
			}

		} catch (error) {
			console.warn("SOCKET MESSAGE WRONG FORMAT ERROR: ", error);
		}
	}

	private closeHandler(ev: CloseEvent) {
		console.warn("WebSocket connection closed. Reason:", ev.reason || "Unknown");
		console.log(`closeHandler: ${ev.code}`);
		this.cleanUpSocketListeners();
		/*
			4001 - invalid or missing credentials
			1005 - this.socket.close() - User probably logged out and this.socket.close was called
		*/
		this.tryToReconnect = ![4001, 1005].includes(ev.code);
	}
}

export default SocketHandler;
