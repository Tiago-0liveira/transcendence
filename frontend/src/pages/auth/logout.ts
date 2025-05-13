import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";

const component = async () => {
	const template = /* html */`
		<div class="flex-1 flex items-center justify-center">
			<div class="logout-content text-center flex flex-col items-center text-lg space-y-4">
				<!-- Dynamic content will be injected here -->
			</div>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const container = document.querySelector(".logout-content") as HTMLElement;

	let isUnmounted = false;
	let timeout: null | number = null;
	let interval: null | number = null;

	// Initial state: show loading spinner
	container.innerHTML = /* html */`
		<span>Logging out...</span>
		<img src="/loading.svg" class="w-10 h-10 animate-spin" alt="loading spinner" />
	`;

	try {
		const ok = await AuthManager.getInstance().logout();

		if (isUnmounted) return;

		container.innerHTML = ok
			? successTemplate()
			: failureTemplate("Could not logout.");
	} catch (error: any) {
		if (isUnmounted) return;
		const message = error?.message || "An unexpected error occurred.";
		container.innerHTML = failureTemplate(message);
	}

	// Countdown logic
	const countdownEl = document.getElementById("countdown");
	let countdown = 4;

	interval = setInterval(() => {
		if (!countdownEl) return;
		countdown -= 1;
		if (countdown <= 0) {
			clearInterval(interval!);
		} else {
			countdownEl.innerText = countdown.toString();
		}
	}, 1000);

	// Redirect after 4 seconds
	timeout = setTimeout(() => {
		if (!isUnmounted) Router.getInstance().navigate("/");
	}, 4000);

	// Optional: manual redirect by clicking button
	const redirectButton = document.getElementById("redirect-now");
	const onRedirectNow = () => {
		if (timeout) clearTimeout(timeout);
		if (interval) clearInterval(interval);
		Router.getInstance().navigate("/");
	};
	redirectButton?.addEventListener("click", onRedirectNow);

	// Cleanup when component is unmounted
	return () => {
		isUnmounted = true;
		if (timeout) clearTimeout(timeout);
		if (interval) clearInterval(interval);
		redirectButton?.removeEventListener("click", onRedirectNow);
	}
};

// HTML template for successful logout
const successTemplate = () => `
	<span>Logged out successfully!</span>
	<img src="/check.svg" class="w-10 h-10" alt="check icon" />
	<span>Redirecting to home in <span id="countdown">4</span> seconds...</span>
	<button id="redirect-now" class="mt-2 text-blue-600 hover:underline text-sm">Return to homepage now</button>
`;

// HTML template for logout failure
const failureTemplate = (message: string) => `
	<span>${message}</span>
	<img src="/cross.svg" class="w-10 h-10" alt="cross icon" />
	<span>Redirecting to home in <span id="countdown">4</span> seconds...</span>
	<button id="redirect-now" class="mt-2 text-blue-600 hover:underline text-sm">Return to homepage now</button>
`;

Router.getInstance().register({ path: '/auth/logout', component });
