export class baseElement extends HTMLElement {
	private ElemEventListeners: any;
	private isRendered: boolean;

	constructor() {
		super();
		this.isRendered = false;
		this.ElemEventListeners = [];
	}
	connectedCallback(): void {
		console.log("hello from connectedCallback");
	}

	disconnectedCallback(): void {
		console.log("hello from disconnectedCallback");
	}

	attributeChangedCallback(): void {
		this.updateRender();
	}

	render(): string {
		return "";
	}

	updateRender(): string {
		return this.render() + this.style;
	}

	getStyle(): string {
		return "<style></style>";
	}
}
