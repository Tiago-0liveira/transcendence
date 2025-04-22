import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";

const component = async () => {
	const template = `
		<div class="flex items-center justify-center h-screen">
			<h1 class="h1-text text-3xl flex flex-col items-center">

			</h1>
		</div>
	`;
	
	document.querySelector('#app')!.innerHTML = template;

	const h1Element = document.querySelector("h1.h1-text");
	h1Element!.innerHTML = `
		<span>Logging out...</span>
		<img src="/loading.svg" class="w-10 h-10" alt="loading spinner" />
	`;

	let timeout: null | number = null;

	AuthManager.getInstance().logout().then((ok) => {
		if (ok) {
			h1Element!.innerHTML = `
				<span>Logged out successfully!</span>
				<img src="/check.svg" class="w-10 h-10" alt="check" />
				<span>Redirecting to home in 4 seconds...</span>
			`;
		} else {
			h1Element!.innerHTML = `
				<span>Could not logout!</span>
				<img src="/cross.svg" class="w-10 h-10" alt="cross" />
				<span>Redirecting to home in 4 seconds...</span>
			`;
		}
		timeout = setTimeout(() => {
			Router.getInstance().navigate("/");
		}, 4000);
	}).catch((error) => {
		h1Element!.innerHTML = `
			<span>Could not logout!error: ${error}</span>
			<img src="/cross.svg" class="w-10 h-10" alt="cross" />
			<span>Redirecting to home in 4 seconds...</span>
		`;
		timeout = setTimeout(() => {
			Router.getInstance().navigate("/");
		}, 4000);
	})
	
	return () => {
		if (timeout) {
			clearTimeout(timeout);
		}
	}
}

Router.getInstance().register({ path: '/logout', component });
