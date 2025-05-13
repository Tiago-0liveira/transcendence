import Toastify from "toastify-js"


const DURATION = 5000;

const defaultToastOptions: Toastify.Options = {
	duration: DURATION,
	gravity: "top",
	position: "right",
	stopOnFocus: true,
	close: true,
	style: {
		display: "flex",
		alignItems: "center",
		fontSize: "20px",
		borderRadius: "8px",
		padding: "10px",
		margin: "10px",
		marginTop: "50px",
	}
} as const;

const deployToast = (text: string, options: Toastify.Options) => {
	Toastify({
		text: text,
		...defaultToastOptions,
		...options,
		style: {
			...defaultToastOptions.style,
			...options.style
		}
	}).showToast()
}

export const toastHelper = {
	success: (message: string) => {
		deployToast(message, {
			avatar: "/notifications/success-circle.svg",
			className: "success",
			style: {
				background: "green"
			}
		})
	},

	error: (message: string) => {
		deployToast(message, {
			avatar: "/notifications/error-circle.svg",
			className: "error",
			style: {
				background: "red"
			}
		})
	},

	info: (message: string) => {
		deployToast(message, {
			className: "info",
			avatar: "/notifications/info-circle.svg",
			style: {
				
			}
		})
	},

	warning: (message: string) => {
		deployToast(message, {
			avatar: "/notifications/warning-circle.svg",
			className: "warning",
			style: {
				background: "orange"
			}
		})
	},
};