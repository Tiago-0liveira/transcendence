import AuthManager from "@/auth/authManager";
import SocketHandler from "@/auth/socketHandler";
import { authGuard } from "@/router/guards";
import Router from "@/router/Router";
import { conditionalRender } from "@/utils/conditionalRender";
import { toastHelper } from "@/utils/toastHelper";

const setError = (el: HTMLDivElement, error: string) => {
	const SpanError = el.querySelector("span#error-message")
	if (SpanError)
	{
		SpanError.textContent = error;
		el.style.display = "block"
	}
}

const getUpdatedRoomTemplate = (room: GameRoom): string => {
	return /* html */`
		<div class="Lobby-Header flex flex-col space-x-4">
			<h1>${room.roomType}</h1>
			<div class="flex items-center justify-center">
				<span class="room-name">${room.name}:</span>
				${conditionalRender(room.settings.visibility === "public", 
					"<span class=\"text-green-500\">Public</span>", 
					"<span class=\"text-red-500\">Private</span>"
				)}
				<button id="btn-copy-room-id" class="flex items-center"><img class="w-7" src="/clipboard.svg"/></button>
			</div>
		</div>
		<div class="Lobby-Content">
			<div class="players">
				<div class="players-header">
					<span>Players: </span>
					<span class="${room.connectedPlayersNumber !== room.requiredPlayers ? "text-yellow-400" : "text-green-500"}">${room.connectedPlayersNumber} / ${room.requiredPlayers}</span>
				</div>
			</div>
		</div>
		<div class="main-content">
			${conditionalRender(room.status === "waiting", /* html */`
				<div class="connected-players flex flex-col space-y-2 items-center">
					${room.connectedPlayers.map((player) => /* html */`
						<span class="player p-2 rounded-md bg-gray-300 w-52" data-player-id="${player.id}">
							<span class="player-name">${player.name}</span>
						</span>
					`).join("")}
				</div>
			`)}
		<div>
	`
}

const component = async () => {
	const user = AuthManager.getInstance().User;
	const sh = SocketHandler.getInstance();
	const router = Router.getInstance();
	let gameRoom: null | GameRoom = null
	let btnCopyLobbyId: HTMLButtonElement | null = null;

	const queryParams = router.getCurrentRoute()?.query
	if (!queryParams || !queryParams.roomId) {
		throw new Error("Room not found!")
	}

	// TODO: display all information
	const template = /* html */`
		<div class="lobby-room flex-1 flex flex-col justify-evenly items-center">
			<div id="div-loading" class="flex space-x-8 items-center">
				<span class="text-2xl">Loading Lobby Data...</span>
				<loading-spinner size="sm"></loading-spinner>
			</div>
			<div id="lobby-error" class="hidden">
				<div class="text-2xl">
					<span>Error: </span>
					<span id="error-message" class="text-red-500"></span>
				</div>
				<a href="/" class="link">Return to home screen</a>
			</div>
			<div id="room-content" class="w-full h-full">

			</div>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
	const divLoading = document.querySelector<HTMLDivElement>("div#div-loading")
	const divContent = document.querySelector<HTMLDivElement>("div#room-content")
	const divError = document.querySelector<HTMLDivElement>("div#lobby-error")
	if (!divLoading) throw new Error("Could not find div#div-loading!")
	if (!divContent) throw new Error("Could not find div#room-content!")
	if (!divError) throw new Error("Could not find div#lobby-error!")
		

	const btnCopyLobbyIdHandler = (ev: MouseEvent) => {
		if (!gameRoom) return;
		toastHelper.copyToClipboard("LobbyId", gameRoom.id)
	}

	sh.addMessageHandler("game-room-error", function (res) {
		divLoading.style.display = "none";
		divContent.style.display = "none";
		setError(divError, res.error)
	})
	sh.addMessageHandler("game-room-data-update", function (res) {
		console.log("get data: ", res);
		
		divError.style.display = "none";
		divLoading.style.display = "none";
		divContent.innerHTML = getUpdatedRoomTemplate(res);
		if (!gameRoom) {
			btnCopyLobbyId = document.querySelector<HTMLButtonElement>("button#btn-copy-room-id")
			if (!btnCopyLobbyId) throw new Error("Could not find button#btn-copy-room-id")
			btnCopyLobbyId.addEventListener("click", btnCopyLobbyIdHandler)
		}
		gameRoom = res
	})
	sh.addMessageHandler("leave-game-lobby", function (res) {
		if (res.reason) {
			toastHelper.warning(res.reason);
		}
		Router.getInstance().navigate("/games/open-rooms");
	})

	sh.sendMessage({
		type: "game-room-join-request",
		roomId: queryParams.roomId
	} satisfies SelectSocketMessage<"game-room-join-request">)

	return () => {
		if (gameRoom) sh.sendMessage({ type: "leave-game-lobby", roomId: gameRoom.id } satisfies SelectSocketMessage<"leave-game-lobby">)
		btnCopyLobbyId?.removeEventListener("click", btnCopyLobbyIdHandler)
		sh.removeMessageHandler("game-room-error");
		sh.removeMessageHandler("game-room-data-update");
	}
}

Router.getInstance().register({ path: '/games/lobby-room', component, guards: [authGuard] });
