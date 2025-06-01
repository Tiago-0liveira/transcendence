import AuthManager from "@/auth/authManager";
import SocketHandler from "@/auth/socketHandler";
import { authGuard } from "@/router/guards";
import Router from "@/router/Router";
import { conditionalRender } from "@/utils/conditionalRender";
import { toastHelper } from "@/utils/toastHelper";

const setError = (el: HTMLDivElement, error: string) => {
	const spanError = el.querySelector("span#error-message");
	if (spanError) {
		spanError.textContent = error;
		el.style.display = "block";
	}
};

const getUpdatedRoomTemplate = (room: LobbyRoom, userId: number): string => {
	const playerReadyStatus = room.connectedPlayers.find((u) => u.id === userId)?.ready || false;

	return /* html */ `
		<div class="Lobby-Header flex flex-col space-x-4">
			<h1>${room.roomType}</h1>
			<div class="flex items-center justify-center">
				<span class="room-name">${room.name}:</span>
					${conditionalRender(
						room.settings.visibility === "public",
						`<span class="text-green-500">Public</span>`,
						`<span class="text-red-500">Private</span>`
					)}
				<button id="btn-copy-room-id" class="flex items-center">
					<img class="w-7" src="/clipboard.svg" />
				</button>
			</div>
		</div>
		<div class="Lobby-Content">
			<div class="players">
				<div class="players-header flex flex-col items-center space-y-2">
					<span class="player-ready flex items-center space-x-2">
						<span class="player-ready-status bg-gray-300 p-1 rounded-md ${conditionalRender(
							playerReadyStatus,
							"text-green-500",
							"text-red-500"
						)}">
							${conditionalRender(playerReadyStatus, "Ready", "Not Ready")}
						</span>
							<button id="btn-set-ready" data-ready="${playerReadyStatus}" class="p-1 ${conditionalRender(
								!playerReadyStatus,
								"bg-green-500",
								"bg-red-500"
							)}">
							${conditionalRender(playerReadyStatus, "Set Not Ready", "Set Ready")}
						</button>
					</span>
					<span>
						<span>Players: </span>
							<span class="${room.connectedPlayersNumber !== room.requiredPlayers ? "text-yellow-400" : "text-green-500"}">
							${room.connectedPlayersNumber} / ${room.requiredPlayers}
							</span>
						${renderOwnerStatus(room, userId)}
					</span>
				</div>
			</div>
		</div>
		<div class="main-content">
			${renderConnectedPlayers(room)}
		</div>
	`;
};

const renderOwnerStatus = (room: LobbyRoom, userId: number): string => {
	const owner = room.connectedPlayers.find((p) => p.id === room.owner);
	if (!owner) {
		return /* html */ `
			<span class="ml-1 p-1 rounded-md bg-gray-300 mb-1 flex items-center space-x-1">
				<span class="text-purple-700">Owner</span>
				<span>is</span>
				<span class="text-red-500">(missing)</span>
			</span>
		`;
	}
	if (room.owner === userId) {
		const startGameButton = conditionalRender(
			room.connectedPlayers.every((p) => p.ready),
			`bg-green-500`,
			`disabled cursor-not-allowed bg-gray-400`
		);
		return /* html */ `
			<span class="ml-1 p-1 rounded-md bg-gray-300 mb-1 flex items-center space-x-1">
				You can start the game when everyone is ready!
			</span>
			<button id="btn-start-game" class="${startGameButton}">Start Game</button>
		`;
	}
	return "";
};

const renderConnectedPlayers = (room: LobbyRoom): string => {
	if (room.status !== "waiting") return "";
	return /* html */`
		<div class="connected-players flex flex-col space-y-2 items-center">
			${room.connectedPlayers.map((player) => /* html */ `
				<span class="player p-3 rounded-md bg-gray-300 w-52 flex justify-between" data-player-id="${player.id}">
					<span class="player-name text-lg flex items-center space-x-1">
						<span>${player.name}</span>
						${conditionalRender(
							player.id === room.owner,
							`<span class="badge bg-purple-500">Owner</span>`
						)}
					</span>
					<span class="w-7 h-7 rounded-full inline-block ${conditionalRender(
						player.ready,
						"bg-green-500",
						"bg-red-500"
					)}"></span>
				</span>
			`).join("")}
		</div>
	`;
};

const component = async () => {
	const user = AuthManager.getInstance().User!;
	const sh = SocketHandler.getInstance();
	const router = Router.getInstance();
	let gameRoom: LobbyRoom | null = null;

	const queryParams = router.getCurrentRoute()?.query;
	if (!queryParams || !queryParams.roomId) {
		throw new Error("Room not found!");
	}

	const template = /* html */ `
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
				<a href="/games/rooms" class="link">Return to game rooms</a>
			</div>
			<div id="room-content" class="w-full h-full"></div>
		</div>
	`;
	document.querySelector("#app")!.innerHTML = template;

	const divLoading = document.querySelector<HTMLDivElement>("#div-loading")!;
	const divContent = document.querySelector<HTMLDivElement>("#room-content")!;
	const divError = document.querySelector<HTMLDivElement>("#lobby-error")!;

	const handleSocketMessages = () => {
		sh.addMessageHandler("lobby-room-error", (res) => {
			divLoading.style.display = "none";
			divContent.style.display = "none";
			setError(divError, res.error);
		});

		sh.addMessageHandler("lobby-room-data-update", (res) => {
			divError.style.display = "none";
			divLoading.style.display = "none";
			divContent.innerHTML = getUpdatedRoomTemplate(res, user.id);
			gameRoom = res;
		});

		sh.addMessageHandler("lobby-room-leave", (res) => {
			if (res.reason) toastHelper.warning(res.reason);
			router.navigate("/games/rooms");
		});
	};

	const initialize = () => {
		sh.sendMessage({
			type: "lobby-room-join-request",
			roomId: queryParams.roomId,
		});

		document.addEventListener("click", handleUserActions);
		handleSocketMessages();
	};

	const handleUserActions = (ev: MouseEvent) => {
		if (!ev.target || !(ev.target instanceof Element)) return;

		const targetButton = ev.target.closest("button");
		if (!targetButton) return;

		switch (targetButton.id) {
			case "btn-copy-room-id":
				if (gameRoom) toastHelper.copyToClipboard("LobbyId", gameRoom.id);
				break;

			case "btn-set-ready":
				handleSetReady(targetButton as HTMLButtonElement);
				break;

			case "btn-start-game":
				if (gameRoom && gameRoom.connectedPlayers.every((p) => p.ready)) {
					sh.sendMessage({
						type: "lobby-room-start-game",
						roomId: gameRoom.id,
					});
				}
				break;
		}
	};

	const handleSetReady = (btn: HTMLButtonElement) => {
		if (!gameRoom || !gameRoom.connectedPlayers.some((p) => p.id === user.id)) {
			return toastHelper.error("You are not connected to this room!");
		}

		const readyStatus = btn.dataset.ready;
		if (!["true", "false"].includes(readyStatus || "")) {
			return toastHelper.error("Invalid ready status!");
		}

		sh.sendMessage({
			type: "lobby-room-player-set-ready",
			roomId: gameRoom.id,
			ready: readyStatus !== "true",
		});
	};

	initialize()
	return () => {
		if (gameRoom) {
			sh.sendMessage({
				type: "lobby-room-leave",
				roomId: gameRoom.id,
			});
		}
		sh.removeMessageHandler("lobby-room-error");
		sh.removeMessageHandler("lobby-room-data-update");
		document.removeEventListener("click", handleUserActions);
	};
};

Router.getInstance().register({
	path: "/games/lobby-room",
	component,
	guards: [authGuard],
});
