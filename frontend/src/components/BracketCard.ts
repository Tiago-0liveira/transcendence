import AuthManager from "@/auth/authManager";
import SocketHandler from "@/auth/socketHandler";
import Router from "@/router/Router";
import { conditionalRender } from "@/utils/conditionalRender";
import BaseAttributeValidationElement from "@component/BaseAttributeValidationElement";


const getColorFromRoomStatus = (status: GameState): string => {
	// Use pastel or soft colors for better aesthetics on a white background
	switch (status) {
		case "active":
			return "bg-green-50 border-green-300 text-green-800";
		case "completed":
			return "bg-blue-50 border-blue-300 text-blue-800";
		case "waiting":
			return "bg-yellow-50 border-yellow-300 text-yellow-800";
		case "stopped":
			return "bg-gray-50 border-gray-300 text-gray-800";
		default:
			throw new Error(`invalid status: ${status}`);
	}
};

class BracketCard extends BaseAttributeValidationElement<BracketCardAttributes> {
	constructor() {
		super();
	}

	static getAttributesValidators() {
		return super.defineValidator<BracketCardAttributes>({
			"lobby-id": {},
			"game-id": {},
			state: { values: ["waiting", "active", "stopped", "completed"] },
			winner: { required: false, values: ["left", "right"] },

			lPlayer: {},
			lname: {},
			lconnected: {},
			lscore: {},

			rPlayer: {},
			rname: {},
			rconnected: {},
			rscore: {},
		});
	}

	render() {
		const userId = AuthManager.getInstance().User!.id;
		const data = {
			state: this.getAttribute("state")!,
			winner: this.getAttribute("winner"),
			lobbyId: this.getAttribute("lobby-id")!,
			gameId: this.getAttribute("game-id")!
		};
		const lPlayer = {
			id: Number(this.getAttribute("lPlayer")!),
			name: this.getAttribute("lname")!,
			connected: this.getAttribute("lconnected")! === "true",
			score: Number(this.getAttribute("lscore")!)
		};
		const rPlayer = {
			id: Number(this.getAttribute("rPlayer")!),
			name: this.getAttribute("rname")!,
			connected: this.getAttribute("rconnected")! === "true",
			score: Number(this.getAttribute("rscore")!)
		};
		console.log(data);

		const showJoinButton = data.winner === null && (lPlayer.id === userId || rPlayer.id === userId);

		this.innerHTML = /* html */`
			<div class="bracket-card flex flex-col min-w-64 max-w-80 rounded-xl border shadow-lg ${getColorFromRoomStatus(data.state)} p-4 will-change-transform transition-transform hover:scale-105">
				<div class="bracket-content flex flex-col w-full space-y-3">
					<div class="player-info flex justify-between items-center text-sm">
						<div class="player left flex flex-col items-start">
							<span class="font-bold ${conditionalRender(data.state === "completed" || lPlayer.connected, 'text-green-600', 'text-red-600')}">
								${lPlayer.name} ${conditionalRender(data.state === "stopped" && !lPlayer.connected, '(Disconnected)')}
							</span>
							<span class="text-gray-500 text-xs">Score: ${lPlayer.score}</span>
						</div>
						<div class="player right flex flex-col items-end">
							<span class="font-bold ${rPlayer.connected ? 'text-green-600' : 'text-red-600'}">
								${conditionalRender(data.state === "stopped" && !rPlayer.connected, '(Disconnected)')} ${rPlayer.name}
							</span>
							<span class="text-gray-500 text-xs">Score: ${rPlayer.score}</span>
						</div>
					</div>
					${conditionalRender(data.state === "completed", `
						<div class="winner text-center font-bold text-lg text-indigo-700">
							Winner: ${data.winner === "left" ? lPlayer.name : rPlayer.name}
						</div>
					`)}
					${conditionalRender(data.state === "waiting", `
						<div class="waiting text-center text-sm italic text-yellow-700">
							Waiting for players to connect...
						</div>
					`)}
					${conditionalRender(data.state === "active", `
						<div class="active text-center text-sm font-semibold text-green-700">
							Game in progress...
						</div>
					`)}
					${conditionalRender(data.state === "stopped", `
						<div class="stopped text-center text-sm text-gray-600 italic">
							Game has been stopped.
						</div>
					`)}
					${conditionalRender(showJoinButton, `
						<div class="join-button text-center mt-4">
							<button id="join-button" roomId="${data.lobbyId}" gameId="${data.gameId}" class="bg-blue-500 text-white font-bold py-1 px-2 rounded hover:bg-blue-600">
								Join Game
							</button>
						</div>
					`)}
				</div>
			</div>
		`;
	}
}



const getButtonAndHandleClick = <T extends string[]>(
	e: MouseEvent,
	classId: "join",
	keys: T,
	cb: (...args: { [K in keyof T]: string | undefined }) => void
) => {
	if (!e.target) return;
	if (!(e.target instanceof Element)) return;

	const button = e.target.closest<HTMLButtonElement>(`#${classId}-button`);
	if (button) {
		const dataSet = keys.map((key) => button.getAttribute(key));

		cb(...(dataSet as { [K in keyof T]: string | undefined }));
	}
};

document.addEventListener("click", (e) => {
	getButtonAndHandleClick(e, "join", ["roomId", "gameId"],(roomId, gameId) => {
		if (!roomId || !gameId) throw new Error("Invalid roomId or gameId");

		Router.getInstance().navigate("/games/game-room", {}, { roomId, gameId });
	})
})

customElements.define("bracket-card", BracketCard);
export default BracketCard;