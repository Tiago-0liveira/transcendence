import AuthManager from "@/auth/authManager";
import SocketHandler from "@/auth/socketHandler";
import { authGuard } from "@/router/guards";
import Router from "@/router/Router";

const getRoomTemplate = (room: BasicPublicLobby): string => {
	return /* html */`
		<room-card
			room-id="${room.id}"
			name="${room.name}"
			owner="${room.owner}"
			status="${room.status}"
			required-players="${room.requiredPlayers}"
			connected-players-number="${room.connectedPlayersNumber}"
			is-friend="${room.isFriend}"
			room-type="${room.lobbyType}"
			can-join="${room.canJoin}"
		>
		</room-card>
	`
}

const component = async () => {
	const user = AuthManager.getInstance().User;
	const sh = SocketHandler.getInstance();

	// TODO: add spinner until we get the info
	// TODO: display all information
	const template = /* html */`
		<div class="lobby-room flex-1 flex flex-col justify-evenly items-center">
			<div id="div-loading" class="flex space-x-8 items-center">
				<span class="text-2xl">Loading Rooms Data...</span>
				<loading-spinner size="sm"></loading-spinner>
			</div>
			<div id="rooms" class="w-full h-full">

			</div>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
	const divLoading = document.querySelector<HTMLDivElement>("div#div-loading")
	const divRooms = document.querySelector<HTMLDivElement>("div#rooms")

	if (!divLoading) throw new Error("Could not find div#div-loading!")
	if (!divRooms) throw new Error("Could not find div#rooms!")


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

	sh.sendMessage({ type: "rooms-join" } satisfies SelectSocketMessage<"rooms-join">)

	return () => {
		sh.removeMessageHandler("rooms-update")
	}
}

Router.getInstance().register({ path: '/games/rooms', component, guards: [authGuard] });
