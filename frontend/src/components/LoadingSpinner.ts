import BaseAttributeValidationElement from "@component/BaseAttributeValidationElement";

class LoadingSpinner extends BaseAttributeValidationElement<LoadingSpinnerAttributes> {
	static getAttributesValidators() {
		return super.defineValidator<LoadingSpinnerAttributes>({
			size: { required: false, values: ["sm", "md", "xl"] },
		});
	}

	connectedCallback() {
		this.render()
	}

	static getWidthBySize = (size: "sm" | "md" | "xl") => {
		switch (size) {
			case "sm":				
				return "w-8";
			case "md":
				return "w-16";
			case "xl":
				return "w-32";
			default:
				throw new Error(`Invalid parameter value size="${size}"`)
		}
	}

	render() {
		const size = this.getAttribute("size") ?? "md";
		this.innerHTML = /* html */`
			<div class="loading-spinner text-blue-500 flex items-center justify-center ${LoadingSpinner.getWidthBySize(size)}">
				<img src="/loading-spinner.svg" alt="loading spinner">
			</div>
		`;
	}
}


customElements.define("loading-spinner", LoadingSpinner);
export default LoadingSpinner;