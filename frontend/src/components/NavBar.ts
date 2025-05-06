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
				<a href="/auth/login" class="default hover:text-zinc-300">Login</a>
				<a href="/auth/signup" class="default hover:text-zinc-300">Sign Up</a>
			`
		} else {
			buttonsElement.innerHTML = `
				<a href="/user" class="default hover:text-zinc-300">${user?.displayName}</a>
				<a href="/auth/logout" class"default hover:text-zinc-300">Logout</a>
			`
		}
	}

	render() {
		this.innerHTML = `
			<nav id="nav-bar" class="relative w-full bg-blue-500 text-fuchsia-200 p-2 shadow-md">
				<div class="container mx-auto flex justify-between items-center">
					<a href="/" class="default text-md font-bold hover:text-zinc-300">Transcendence</a>
					<div class="buttons space-x-4">
						
					</div>
				</div>
			</nav>
		`;
		NavBar.updateNav()
	}
}


customElements.define("nav-bar", NavBar);
export default NavBar;