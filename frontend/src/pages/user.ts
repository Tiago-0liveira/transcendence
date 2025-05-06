import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards";

const component = async () => {

	const user = AuthManager.getInstance().User!;
	const template = `
		<div class="user">
			<h1>Hello ${user.username}</h1>
			<nav>
				<a href="/">Home</a>
			</nav>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
	
}

	const userMenuButton = document.getElementById("menu-user-button");
	const userDropdown = document.getElementById("user-dropdown-menu");

	userMenuButton?.addEventListener("click", (e) => {
		e.stopPropagation();
		const isExpanded = userMenuButton.getAttribute("aria-expanded") === "true";
		userMenuButton.setAttribute("aria-expanded", (!isExpanded).toString());
		userDropdown?.classList.toggle("hidden");
	});

	window.addEventListener("click", (e: MouseEvent) => {
		const target = e.target as Node;
		if (!userMenuButton?.contains(target) && !userDropdown?.contains(target)) {
			userDropdown?.classList.add("hidden");
			userMenuButton?.setAttribute("aria-expanded", "false");
		}
	});
};

Router.getInstance().register({
	path: "/user",
	guards: [authGuard],
	component,
});
