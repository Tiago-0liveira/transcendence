import AuthManager from "@/auth/authManager";
import SocketHandler from "@/auth/socketHandler";
import { authGuard } from "@/router/guards";
import Router from "@/router/Router";

const getRoomTemplate = (room: BasicPublicLobby): string => {
	return /* html */`
		<div class="room-card-container">
			<div class="room-card ${room.lobbyType === 'tournament' ? 'room-card-tournament' : 'room-card-1v1'}">
				<div class="room-card-header-left">
					<span class="badge ${room.lobbyType === 'tournament' ? 'badge-purple' : 'badge-blue'}">
						${room.lobbyType}
					</span>
				</div>
				
				<div class="room-card-header">
					<span class="label">Name:</span>
					<span class="room-card-name" title="${room.name}">${room.name}</span>
					</span>
				</div>

				<div class="room-card-info">
					<div class="room-card-line">
						<span class="label">Status:</span>
						<span class="badge ${room.status === 'waiting' ? 'badge-green' : 'badge-red'}">
							${room.status}
						</span>
					</div>
					<div class="room-card-line">
						<span class="label">Players:</span>
						<span class="value">${room.connectedPlayersNumber} / ${room.requiredPlayers}</span>
					</div>
					<div class="room-card-line">
						<span class="label">Owner:</span>
<!--						<span class="value">${room.owner}</span>-->
<!--						<span class="value">${room.ownerName !== "" ? room.ownerName : "Owner is not in the lobby"}</span>-->
						<span class="value ${room.ownerName !== "" ? 'text-success' : 'text-danger'}">
  							${room.ownerName !== "" ? room.ownerName : "Owner is not in the lobby"}
						</span>
					</div>
				</div>

				<div class="room-card-actions">
					${room.canJoin
						? `<a class="btn-steam-fixed" href="/games/lobby-room?roomId=${room.id}">Enter</a>`
						: `<span class="text-muted">Full</span>`}

					${room.owner === AuthManager.getInstance().User?.id
						? `<button class="btn-logout ml-2" data-room-id="${room.id}" id="btn-delete-room">Delete</button>`
						: ``}
				</div>
			</div>
		</div>
	`
}

const component = async () => {
	const user = AuthManager.getInstance().User;
	const sh = SocketHandler.getInstance();

	// TODO: add spinner until we get the info
	// TODO: display all information
	const template = /* html */`
		<div class="profile-card">
			<h1 class="settings-header">Available Rooms</h1>

			<div id="div-loading" class="lobby-loading">
				<span class="loading-text">Loading Rooms Data...</span>
				<loading-spinner size="sm"></loading-spinner>
			</div>

			<div id="rooms" class="rooms-wrapper"></div>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
	const divLoading = document.querySelector<HTMLDivElement>("div#div-loading")
	const divRooms = document.querySelector<HTMLDivElement>("div#rooms")

	if (!divLoading) throw new Error("Could not find div#div-loading!")
	if (!divRooms) throw new Error("Could not find div#rooms!")

	const handleButtonClicks = (ev: MouseEvent) => {
		if (!ev.target || !(ev.target instanceof Element)) return;

		const btnPlayerSetReady = ev.target.closest("button#btn-delete-room");
		if (btnPlayerSetReady instanceof HTMLButtonElement) {
			const roomId  = btnPlayerSetReady.getAttribute("data-room-id");
			if (roomId) {
				sh.sendMessage({
					type: "lobby-room-delete",
					roomId: roomId,
				})
			}
		}
	}

	sh.addMessageHandler("rooms-update", function (res) {
		divLoading.style.display = "none";
		divRooms.innerHTML = "";
		if (res.rooms.length === 0) {
			divRooms.innerHTML = /* html */`
				<div class="flex items-center flex-col">
					<span class="text-2xl">No public rooms available!</span>
					<a href="/games/new-config" class="link">Create a new Room</a>
				</div>
			`;
		} else {
			res.rooms.forEach(room => {
				divRooms.innerHTML += getRoomTemplate(room)
			})
		}
	})

	document.addEventListener("click", handleButtonClicks)
	sh.sendMessage({ type: "rooms-join" } satisfies SelectSocketMessage<"rooms-join">)

	return () => {
		document.removeEventListener("click", handleButtonClicks)
		sh.removeMessageHandler("rooms-update")
	}
}

Router.getInstance().register({ path: '/games/rooms', component, guards: [authGuard] });
