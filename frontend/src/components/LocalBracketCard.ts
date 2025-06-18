import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { conditionalRender } from "@/utils/conditionalRender";
import BaseAttributeValidationElement from "@component/BaseAttributeValidationElement";
import { getButtonAndHandleClick } from "./BracketCard";


const TBD = "To be determined!";

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

class LocalBracketCard extends BaseAttributeValidationElement<LocalBracketCardAttributes> {
	constructor() {
		super();
	}

	static getAttributesValidators() {
		return super.defineValidator<LocalBracketCardAttributes>({
			"game-id": { },
			state: { values: ["waiting", "active", "stopped", "completed"] },
			winner: { required: false, values: ["left", "right"] },
			canJoin: { },

			lname: { },
			lscore: { },

			rname: { },
			rscore: { },
		});
	}

	render() {
		const data = {
			state: this.getAttribute("state")!,
			winner: this.getAttribute("winner"),
			gameId: this.getAttribute("game-id")!,
			canJoin: this.getAttribute("canJoin") === "true"
		};
		const lPlayerName = this.getAttribute("lname")!;
		const rPlayerName = this.getAttribute("rname")!;
		const lPlayer = {
			name: lPlayerName || TBD,
			determined: lPlayerName !== "",
			score: Number(this.getAttribute("lscore")!)
		};
		const rPlayer = {
			name: rPlayerName || TBD,
			determined: lPlayerName !== "",
			score: Number(this.getAttribute("rscore")!)
		};

		this.innerHTML = /* html */`
			<div class="bracket-card flex flex-col min-w-64 max-w-80 rounded-xl border shadow-lg ${getColorFromRoomStatus(data.state)} p-4 will-change-transform transition-transform hover:scale-105">
				<div class="bracket-content flex flex-col w-full space-y-3">
					<div class="player-info flex justify-between items-center text-sm">
						<div class="player left flex flex-col items-start">
							<span class="font-bold ${conditionalRender(lPlayer.determined, "text-green-600", "text-red-500")}">
								${lPlayer.name}
							</span>
							<span class="text-gray-500 text-xs">Score: ${lPlayer.score}</span>
						</div>
						<div class="player right flex flex-col items-end">
							<span class="font-bold ${conditionalRender(rPlayer.determined, "text-green-600", "text-red-500")}">
								${rPlayer.name}
							</span>
							<span class="text-gray-500 text-xs">Score: ${rPlayer.score}</span>
						</div>
					</div>
					${conditionalRender(data.state === "completed", `
						<div class="winner text-center font-bold text-lg text-indigo-700">
							Winner: ${data.winner === "left" ? lPlayer.name : rPlayer.name}
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
					${conditionalRender(data.canJoin, `
						<div class="join-button text-center mt-4">
							<button id="local-join-button" gameId="${data.gameId}" class="bg-blue-500 text-white font-bold py-1 px-2 rounded hover:bg-blue-600">
								Join Game
							</button>
						</div>
					`)}
				</div>
			</div>
		`;
	}
}


document.addEventListener("click", (e) => {
	getButtonAndHandleClick(e, "local-join", ["gameId"], (gameId) => {
		if (!gameId) throw new Error("Invalid roomId or gameId");

		Router.getInstance().navigate("/games/local/game-room", {}, { gameId });
	})
})

customElements.define("local-bracket-card", LocalBracketCard);
export default LocalBracketCard;