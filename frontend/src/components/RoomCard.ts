import AuthManager from "@/auth/authManager";
import SocketHandler from "@/auth/socketHandler";
import Router from "@/router/Router";
import { conditionalRender } from "@/utils/conditionalRender";
import BaseAttributeValidationElement from "@component/BaseAttributeValidationElement";

type ButtonClassId = "delete-room" | "enter-room"


const getColorFromRoomStatus = (status: LobbyStatus): string => {
	switch (status) {
		case "active":
			return "bg-yellow-500";
		case "completed":
			return "bg-red-500";
		case "waiting":
			return "bg-green-500";
		default:
			throw new Error(`invalid status: ${status}`)
	}
}

class RoomCard extends BaseAttributeValidationElement<RoomCardAttributes> {
	constructor() {
		super();
	}

	static getAttributesValidators() {
		return super.defineValidator<RoomCardAttributes>({
			"room-id": {},
			name: {},
			owner: {},
			ownerName: {},
			"room-type": { values: ["tournament", "1v1"] },
			status: { values: ["waiting", "active", "completed"] },
			"required-players": {},
			"connected-players-number": {},
			"is-friend": {},
			"can-join": {},
		});
	}

	render() {
		const userId = AuthManager.getInstance().User!.id
		const room: BasicPublicLobby & { public: boolean } = {
			id: this.getAttribute("room-id")!,
			name: this.getAttribute("name")!,
			owner: Number(this.getAttribute("owner")!),
			ownerName: this.getAttribute("ownerName")!,
			lobbyType: this.getAttribute("room-type")!,
			status: this.getAttribute("status")!,
			requiredPlayers: Number(this.getAttribute("required-players")!),
			connectedPlayersNumber: Number(this.getAttribute("connected-players-number")!),
			isFriend: this.getAttribute("is-friend") === 'true',
			public: Number(this.getAttribute("owner")!) !== userId,
			canJoin: this.getAttribute("can-join") === 'true',
		}

		this.innerHTML = /* html */`
			<div class="room-card min-w-64 max-w-80 max-h-20 rounded-md bg-slate-700 text-white p-2 flex gap-3">
				<div class="room-content flex flex-col w-full space-y-2">
					<div class="room-info text-left flex-[1] overflow-hidden flex justify-between">
						<span class="text-1xl self-start flex space-x-2">
							<span>${room.name}</span>
							<span class="badge bg-purple-500">
								${room.lobbyType}
							</span>
							<span class="badge bg-gray-500">
								${room.connectedPlayersNumber} / ${room.requiredPlayers}
							</span>
						</span>
						<span class="ml-2 badge 
							${conditionalRender(room.owner === userId, "bg-purple-700",
			conditionalRender(room.isFriend, "bg-blue-500", "bg-green-500"))
			}
						">
							${conditionalRender(room.owner === userId, "Owner",
				conditionalRender(room.isFriend, "Friend", "Public")
			)}
						</span>
					</div>
					<div class="flex w-full justify-between">
						<div class="left flex space-x-2">
							<span class="badge ${getColorFromRoomStatus(room.status)}">${room.status}</span>
						</div>
						<div class="right flex space-x-2">
							${conditionalRender(room.owner === userId, /* html */`
								<button data-room-id="${room.id}" id="delete-room-button" class="badge bg-red-500">Delete</button>	
							`)}
							${conditionalRender(room.canJoin, /* html */`
								<button data-room-id="${room.id}" id="enter-room-button" class="badge bg-blue-500">Enter</button>
							`)}
						</div>
					</div>
				</div>
			</div>
		`;
	}
}

const getButtonAndHandleClick = (e: MouseEvent, classId: ButtonClassId, cb: (userId: string) => void) => {
	if (!e.target) return;
	if (!(e.target instanceof Element)) return;

	const button = e.target.closest(`#${classId}-button`)
	if (button && button instanceof HTMLButtonElement) {
		const roomId = button.dataset.roomId
		if (roomId) {
			cb(roomId)
		}
	}
}

document.addEventListener("click", (e) => {
	getButtonAndHandleClick(e, "delete-room", (roomId) => {
		console.log("delete roomId: ", roomId)
		SocketHandler.getInstance().sendMessage({
			type: "lobby-room-delete", roomId: roomId
		} satisfies SelectSocketMessage<"lobby-room-delete">)
	})
	getButtonAndHandleClick(e, "enter-room", (roomId) => {
		console.log("enter-room roomId: ", roomId)
		Router.getInstance().navigate("/games/lobby-room", false, {}, { roomId: roomId })
	})
})

customElements.define("room-card", RoomCard);
export default RoomCard;