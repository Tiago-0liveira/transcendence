import AuthManager from "@/auth/authManager";
import LocalGameRoomManager from "@/auth/LocalGameManager";
import { newLocalGameConfigSchema } from "@/auth/validation";
import Router from "@/router/Router";
import { ZodError } from "zod";

const getPlayerNameInputTemplate = (idNumber: number) => {
    return /* html */`
        <div class="form-input-group" id="player-name-input-div-${idNumber}">
            <label for="player-name-${idNumber}" class="form-input-label">Player Name ${idNumber}</label>
            <input class="form-input" type="text" name="player-name-${idNumber}" id="player-name-${idNumber}" placeholder="Player Name ${idNumber}" required minLen="4" />
        </div>
    `
}

const getNewErrorTemplate = (error: string) => {
	return /* html */`
		<span class="form-message-error">${error}</span>
	`
}

const component = async () => {
	const user = AuthManager.getInstance().User;
	const router = Router.getInstance();
    const localGameManager = LocalGameRoomManager.getInstance()

	const template = /* html */`
        <div class="profile-card centered auth-box signup-box">
            <div class="settings-header login-section">Create Game Room</div>
            
            <form id="game-config" class="settings-form">
                <div id="errors" class="form-message-error"></div>

                <div class="form-input-group">
                    <label for="select-type" class="form-input-label">Game Type</label>
                    <select name="select-type" id="select-type" class="form-input">
                        <option value="1v1" selected>1v1</option>
                        <option value="tournament">Tournament</option>
                    </select>
                </div>
                <div class="form-input-group">
                    
                </div>

                <div id="playersNumber-div" class="form-input-group">
                    <div class="form-input-group">
                        <label class="form-input-label">Number of Players: <span id="players-number"></span></label>
                    </div>    
                </div>

                <div id="player-names" class="form-input-group">
                    ${getPlayerNameInputTemplate(1)}
                    ${getPlayerNameInputTemplate(2)}
                </div>

                <button type="submit" id="btn-create" class="btn-steam-fixed">Create Room</button>
            </form>
        </div>
		<div id="modal" class="hidden absolute w-full h-[calc(100%-53.33px)] z-10">
			<div class="w-full h-full opacity-90 bg-black absolute">

			</div>
			<div class="w-full h-full relative z-20 flex items-center justify-center">
				<div class="profile-card centered auth-box signup-box !self-center !max-w-3xl">
					<div class="settings-header login-section">A Local Game Room Already Exists</div>
					
					<form id="existing-game-form" class="settings-form space-y-5">
						<button type="submit" id="btn-delete-old-create" class="!bg-red-500 !text-black hover:!text-white btn-steam-fixed">Delete current room and create a new one</button>
						<button type="submit" id="btn-join-existing" class="!bg-green-500 !text-black hover:!text-white btn-steam-fixed">Join existing room</button>
					</form>
				</div>
			</div>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const form = document.querySelector<HTMLFormElement>("#game-config")
	const selectType = document.querySelector<HTMLSelectElement>("select#select-type")
    const spanPlayersNumber = document.querySelector<HTMLSpanElement>("span#players-number")
	const errorDiv = document.querySelector<HTMLDivElement>("div#errors")
    const playerNamesDiv = document.querySelector<HTMLDivElement>("div#player-names")
	const modal = document.querySelector<HTMLDivElement>("div#modal")
	const ExistingGameForm = document.querySelector<HTMLFormElement>("#existing-game-form")
	
    
	if (!form) { throw new Error("Could not find #game-config"); }
	if (!selectType) { throw new Error("Could not find select#select-type"); }
    if (!spanPlayersNumber) throw new Error("Could not get span#players-number");
	if (!errorDiv) { throw new Error("Could not find div#errors"); }
    if (!playerNamesDiv) { throw new Error("Could not find div#player-names"); }
	if (!modal) { throw new Error("Could not find div#modal"); }
	if (!ExistingGameForm) { throw new Error("Could not find form#existing-game-form"); }


	if (localGameManager.activeGameLobby) {
		if (modal.classList.contains("hidden")) modal.classList.remove("hidden")
	}


	const selectTypeChangeHandler = async (ev: Event) => {
		if (!(ev.target instanceof HTMLSelectElement)) return;

		if (["1v1", "tournament"].includes(ev.target.value)) {
			selectTypeChange(ev.target.value as LobbyType)
		} else {
			console.warn("Something is very wrong in select#select-type")
		}
	}
	const selectTypeChange = async (newValue: LobbyType) => {
		if (newValue === "tournament") {
			spanPlayersNumber.textContent = "4";
            playerNamesDiv.innerHTML += getPlayerNameInputTemplate(3)
            playerNamesDiv.innerHTML += getPlayerNameInputTemplate(4)
		} else {
			spanPlayersNumber.textContent = "2";
            const p3 = playerNamesDiv.querySelector("div#player-name-input-div-3")
            const p4 = playerNamesDiv.querySelector("div#player-name-input-div-4")
            if (p3) playerNamesDiv.removeChild(p3)
            if (p4) playerNamesDiv.removeChild(p4)
		}
	}

	const formSubmitHandler = async (e: SubmitEvent) => {
		e.preventDefault();
		
		const formData = new FormData(form);
		try {
			const data = {
				roomType: formData.get("select-type")?.toString() || ""
			};
			const validated = newLocalGameConfigSchema.parse(data)
			errorDiv.innerHTML = "";
            let playerNames = [
                formData.get("player-name-1")?.toString() ?? "",
				formData.get("player-name-2")?.toString() ?? "",
            ]
            if (validated.roomType === "tournament") {
                playerNames.push(
					formData.get("player-name-3")?.toString() ?? "",
					formData.get("player-name-4")?.toString() ?? ""
				)
            }
            if (playerNames.some(name => 
                name === "" ||
                name.toString().trim().length <= 3 ||
                name.toString().trim().length >= 12) ||
                playerNames.length !== (new Set(playerNames)).size
            ) {
                errorDiv.innerHTML = getNewErrorTemplate("Player Names must be between 3 and 12 chars and cannot be repeated!")
            } else {
                console.log(localGameManager.createRoom({ type: validated.roomType, playerNames }))
				router.navigate("/games/local/lobby-room")
            }

		} catch (error) {
			if (error instanceof ZodError) {
				console.log("zod error: ", error);
				errorDiv.innerHTML = "";/* reset errors */
				error.errors.forEach(err => {
					errorDiv.innerHTML += getNewErrorTemplate(err.message)
				})
			} else {
				console.error("Error: ", error);
			}
		}
	}

	const formExistingGameSubmitHandler = async (e: SubmitEvent) => {
		e.preventDefault()
		const submitter = e.submitter
		if (submitter instanceof HTMLButtonElement) {
			if (submitter.id === "btn-delete-old-create") {
				localGameManager.deleteActiveGameLobby()
				if (!modal.classList.contains("hidden")) {
					modal.classList.add("hidden")
				}
			} else if (submitter.id === "btn-join-existing") {
				router.navigate("/games/local/lobby-room")
			}
		}
	}
	
	selectTypeChange("1v1")
	selectType.addEventListener("change", selectTypeChangeHandler)
	form.addEventListener("submit", formSubmitHandler)
	ExistingGameForm.addEventListener("submit", formExistingGameSubmitHandler)

	return () => {
		selectType.removeEventListener("change", selectTypeChangeHandler)
		form.removeEventListener("submit", formSubmitHandler);
		ExistingGameForm.removeEventListener("submit", formExistingGameSubmitHandler)
	}
}

Router.getInstance().register({ path: '/games/local/create-game', component });
