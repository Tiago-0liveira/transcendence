import { toastHelper } from "@/utils/toastHelper";
import AuthManager from "./authManager";
import Router from "@/router/Router";
import ChatManager from "./chatManager";

class SocketHandler {
  private static instance: SocketHandler;
  private socket: WebSocket | null = null;
  private chatManager: ChatManager | null = null;

  private reconnectTimeoutId: number;
  private lastPongTime!: number;
  private lastPingTime!: number;
  private tryToReconnect: boolean;
  private messageSubscriptions: Map<SocketMessageType, SocketMessageHandler> =
    new Map();
  /**
   * @description Automatically used by openHandler, so when we try to send messages and we are still not connected it will store the messages here and send them all after connecting
   */
  private queuedMessages: SocketMessage[];

  static PING_INTERVAL_TIMEOUT = 5000 as const;
  static RECONNECT_BASE_TIMEOUT = 16000 as const;

  public static getInstance() {
    if (!SocketHandler.instance) {
      SocketHandler.instance = new SocketHandler();
    }
    return SocketHandler.instance;
  }

  private reconnectHandler() {
    if (this.tryToReconnect) {
      this.cleanUpSocketListeners();
      this.createSocket();
    }
  }

  private constructor() {
    this.tryToReconnect = false;
    this.reconnectTimeoutId = setInterval(
      this.reconnectHandler.bind(this),
      SocketHandler.RECONNECT_BASE_TIMEOUT,
    );
    this.queuedMessages = [];
    this.initializeChatManager();
  }

  public disconnect() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      this.socket.close();
    }
  }
  public connect() {
    this.createSocket();
  }

  private createSocket() {
    const accessToken = AuthManager.getInstance().GetAccessToken();
    if (!accessToken) return toastHelper.warning("You are not logged in so you can't connect to the websocket!")
    try {
      const socket = new WebSocket(
        `wss://${window.location.hostname}:4000/ws?accessToken=${encodeURIComponent(accessToken)}`,
      );
      this.prepareSocket(socket);
      this.socket = socket;
    } catch (error) {
      toastHelper.warning(`Could not connect to WebSocket!\n`);
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
    if (!this.socket) return;

    this.socket.removeEventListener("open", this.openHandler.bind(this));
    this.socket.removeEventListener("message", this.messageHandler.bind(this));
    this.socket.removeEventListener("error", this.errorHandler.bind(this));
    this.socket.removeEventListener("close", this.closeHandler.bind(this));
    // Clean up ChatManager if needed
    if (this.chatManager) {
      console.log("Cleaning up ChatManager subscriptions");
      this.chatManager.cleanup();
    }

    this.messageSubscriptions.clear();
    this.socket = null;
  }

  /**
   * @description Sends the param `msg` to the server or if the socket is not ready stores the message in a queue
   * @param msg SocketMessage
   */
  public sendMessage(msg: SocketMessage) {
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(msg));
      } else {
        this.queuedMessages.push(msg);
      }
    }
  }

  private async openHandler(ev: Event) {
    console.log("WebSocket connection opened.");

    //Ensure chatManager is initialized
    if (!this.chatManager) {
      await this.initializeChatManager();
    } else {
      this.chatManager.reset();
    }
    this.queuedMessages.forEach((message) => {
      this.socket?.send(JSON.stringify(message));
    });
    this.queuedMessages = [];
    this.tryToReconnect = false;
  }

  private errorHandler(ev: Event) {
    
  }

  private static isSocketValidMessage(message: any): message is SocketMessage {
    return typeof message === "object" && typeof message.type === "string";
  }

  private messageHandler(ev: MessageEvent<any>) {
    try {
      const parsedMessage = JSON.parse(ev.data);
      if (SocketHandler.isSocketValidMessage(parsedMessage)) {
        /*console.log("parsedMessage: ", parsedMessage);*/
        switch (parsedMessage.type) {
          case "friend-online":
            toastHelper.friendOnline(
              parsedMessage.friendName,
              parsedMessage.avatar,
            );
            break;
          case "friend-request":
            toastHelper.friendRequest(
              parsedMessage.friendName,
              parsedMessage.avatar,
              parsedMessage.friendId,
            );
            break;
          case "friend-request-accepted":
            toastHelper.friendRequestAccepted(
              parsedMessage.friendName,
              parsedMessage.avatar,
            );
            break;
          case "lobby-room-join":
            Router.getInstance().navigate(
              "/games/lobby-room",
              false,
              {},
              { roomId: parsedMessage.roomId },
            );
            break;
          case "game-room-join":
            Router.getInstance().navigate(
              "/games/game-room",
              false,
              {},
              { roomId: parsedMessage.roomId, gameId: parsedMessage.gameId },
            );
            break;
          default:
            break;
        }
        const messageHandler = this.messageSubscriptions.get(
          parsedMessage.type,
        );
        messageHandler && messageHandler.bind(this)(parsedMessage);
        /* console.log(
          "type: ",
          parsedMessage.type,
          " ,handler: ",
          messageHandler ? "exists" : "does not exist",
        ); */
      }
    } catch (error) {
      console.warn("SOCKET MESSAGE WRONG FORMAT ERROR: ", error);
    }
  }

  public addMessageHandler<T extends SocketMessageType>(
    messageName: T,
    handler: SocketMessageHandler<T>,
  ) {
    const setHandler = this.messageSubscriptions.get(messageName);
    if (setHandler) {
      this.messageSubscriptions.delete(messageName);
    }
    this.messageSubscriptions.set(messageName, handler as any);
  }

  public removeMessageHandler(messageName: SocketMessageType) {
    this.messageSubscriptions.delete(messageName);
  }

  private closeHandler(ev: CloseEvent) {
    if (![4001, 1005].includes(ev.code))
    {
      console.warn(
        "WebSocket connection closed. Reason:",
        ev.reason || "Unknown",
      );
      console.log(`closeHandler: ${ev.code}`);
    }
    this.cleanUpSocketListeners();
    /*
			4001 - invalid or missing credentials
			1005 - this.socket.close() - User probably logged out and this.socket.close was called
      1006 - socket lost the connection
		*/
    this.tryToReconnect = ![4001, 1005].includes(ev.code);
  }

  private async initializeChatManager() {
    try {
      // Dynamic import to avoid circular dependency
      const { default: ChatManager } = await import("@/auth/chatManager");
      this.chatManager = ChatManager.getInstance();
      console.log("ChatManager initialized with SocketHandler");
    } catch (error) {
      console.error("Failed to initialize ChatManager:", error);
    }
  }

  /**
   * Get the ChatManager instance associated with this SocketHandler
   */
  public async getChatManager() {
    if (!this.chatManager) {
      await this.initializeChatManager();
    }
    return this.chatManager;
  }

  /**
   * Check if ChatManager is initialized
   */
  public isChatManagerReady(): boolean {
    return this.chatManager !== null;
  }
}

export default SocketHandler;
