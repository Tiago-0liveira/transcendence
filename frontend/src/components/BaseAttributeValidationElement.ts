import { validateElementMultipleStringAttributes, validateElementStringAttribute } from "@/utils/components";

abstract class BaseAttributeValidationElement<T extends StringsObject> extends HTMLElement {
	/**
	 * @description This function must use `this.defineValidator` in Child classes
	 * */
	static getAttributesValidators(): ObjectStringAttributeValidator<{}> {
		return {};
	}
	
	static get observedAttributes() {
		return Object.keys(this.getAttributesValidators());
	}

	static defineValidator<T extends StringsObject>(arg: ObjectStringAttributeValidator<T>) {
		return arg
	}

	public getAttribute<K extends keyof T>(name: K): T[K] | null {
		return super.getAttribute(name as string) as T[K] | null;
	}
	public setAttribute<K extends keyof T>(name: K, value: T[K]) {
		super.setAttribute(name as string, value as T[K]);
	}

	protected initHasValidated = false;

	connectedCallback() {
		const constructor = this.constructor as typeof BaseAttributeValidationElement<T>;
		try {
			validateElementMultipleStringAttributes(this, constructor.getAttributesValidators());
			this.initHasValidated = true;
			this.render();
		} catch (e) {
			console.error(`Error validating element ${this.tagName}: ${e}`);
			this.innerHTML = `<div class="error-message">Error validating element ${this.tagName}: ${e}</div>`;
		}
		
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (oldValue !== newValue) {
			const constructor = this.constructor as typeof BaseAttributeValidationElement<T>;
			const attrsValidation = constructor.getAttributesValidators()
			if (name in attrsValidation) {
				validateElementStringAttribute(this, attrsValidation, name);
			}
			if (this.initHasValidated) {
				this.render();
			}
		}
	}

	/**
	 * @description This method is called when the element is created or when an attribute is changed.
	 * It must not validate any attributes, it is assured that the attributes are valid.
	 */
	abstract render(): void
}

export default BaseAttributeValidationElement;