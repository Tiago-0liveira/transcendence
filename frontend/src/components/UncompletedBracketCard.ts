import { conditionalRender } from "@/utils/conditionalRender";
import BaseAttributeValidationElement from "@component/BaseAttributeValidationElement";

const NameToBeDetermined = "To be determined!"

class UncompletedBracketCard extends BaseAttributeValidationElement<UncompletedBracketCardAttributes> {
	constructor() {
		super();
	}

	static getAttributesValidators() {
		return super.defineValidator<UncompletedBracketCardAttributes>({
			lPlayer: {},
			lname: { required: false, requireAttrs: ["lPlayer"] },

			rPlayer: {},
			rname: { required: false, requireAttrs: ["rPlayer"]  },
		});
	}

	render() {
		const lPlayer = {
			id: Number(this.getAttribute("lPlayer")!),
			name: this.getAttribute("lname") ?? NameToBeDetermined,
		};
		const rPlayer = {
			id: Number(this.getAttribute("rPlayer")!),
			name: this.getAttribute("rname") ?? NameToBeDetermined,
		};

		this.innerHTML = /* html */`
			<div class="bracket-card flex flex-col min-w-64 max-w-80 rounded-xl border shadow-lg bg-gray-50 p-4 will-change-transform transition-transform hover:scale-105">
				<div class="bracket-content flex flex-col w-full space-y-3">
					<div class="player-info flex justify-between items-center text-sm">
						<div class="player left flex flex-col items-start">
							<span class="font-bold ${conditionalRender(lPlayer.name !== NameToBeDetermined, 'text-green-600', 'text-red-600')}">
								${lPlayer.name}
							</span>
						</div>
						<div class="player right flex flex-col items-end">
							<span class="font-bold ${conditionalRender(rPlayer.name !== NameToBeDetermined, 'text-green-600', 'text-red-600')}">
								${rPlayer.name}
							</span>
						</div>
					</div>
					<div class="waiting text-center text-sm italic text-yellow-700">
						Waiting for players to finnish the games...
					</div>
				</div>
			</div>
		`;
	}
}


customElements.define("uncompleted-bracket-card", UncompletedBracketCard);
export default UncompletedBracketCard;