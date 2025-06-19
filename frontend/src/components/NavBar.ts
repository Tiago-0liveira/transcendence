import AuthManager from "@/auth/authManager";
import API from "@/utils/BackendApi";
import { conditionalRender } from "@/utils/conditionalRender";

class NavBar extends HTMLElement {
	connectedCallback() {
		console.log("NavBar-connectedCallback")
		this.render()
	}

	/**
	 * @description Renders dynamic part of the nav-bar
	 */
	static updateNav() {
		const buttonsElement = document.querySelector("#nav-bar div.buttons")
		if (buttonsElement == null)
			throw new Error("NavBar could not find div.buttons")
		const user = AuthManager.getInstance().User;
		if (user == null) {
			buttonsElement.innerHTML = `
				<a href="/auth/login" class="btn-login-out">Login</a>
				<a href="/auth/signup" class="btn-login-out">Sign Up</a>
			`
		} else {
			buttonsElement.innerHTML = `
				<a href="/game" class="btn-steam">Chat</a>
				<a href="/game" class="btn-steam">Game</a>
				<a href="/players" class="btn-steam">Players</a>
				<a href="/profile" class="btn-steam">Profile</a>
				<a href="/friends" class="btn-steam">Friends</a>
				<a href="/settings" class="btn-steam">Settings</a>
  				<a href="/auth/logout" class="btn-logout">Logout</a>
  				
			`
		}
	}

	render() {
		this.innerHTML = `
<!--			<nav id="nav-bar" class="relative w-full bg-dark-500 text-fuchsia-200 p-2 shadow-md">-->
			<nav id="nav-bar" class="relative w-full bg-dark-500 text-fuchsia-200 p-2 shadow-md">
				<div class="flex justify-between items-center">
					<a href="/transcendence" class="btn-manual">Transcendence</a>
					<div class="buttons space-x-2">
						
					</div>
				</div>
			</nav>
		`;
		NavBar.updateNav()
	}
}


customElements.define("nav-bar", NavBar);
export default NavBar;