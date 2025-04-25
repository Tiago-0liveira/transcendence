/**
 * 
 * @param el the element to validate
 * @param attrName the attribute name to validate
 * @param values optional array of valid values for the attribute
 * @returns true if the attribute is valid, throws an error if not ensuring attribute presence
 */
export const validateElementStringAttribute = <T extends StringsObject>(el: HTMLElement, attrs: ObjectStringAttributeValidator<T>, attrName: string): boolean => {
	if (!isValidAttributeName(attrName)) {
		throw new Error(`Invalid attribute name: ${attrName}`);
	}
	const validator = attrs[attrName];
	if (!validator) return true;

	const attrValue = el.getAttribute(attrName);
	if (attrValue == null) {
		if (validator.conditional) {
			for (const [key, value] of Object.entries(validator.conditional)) {
				if (el.hasAttribute(key) && el.getAttribute(key) === value) {
					throw new Error(`Element ${el.tagName} attribute ${attrName} is conditional on ${key}`);
				}
			}
		}
		if (validator.required === false) return true;
		throw new Error(`Element ${el.tagName} must have attribute ${attrName}`);
	}
	if (validator.requireAttrs) {
		for (const requiredAttr of validator.requireAttrs) {
			if (!el.hasAttribute(requiredAttr)) {
				throw new Error(`Element ${el.tagName} must have attribute ${requiredAttr}`);
			}
		}
	}

	if (validator.values && validator.values.length > 0 && !validator.values.includes(attrValue as T[string])) {
		throw new Error(`Element ${el.tagName} attribute ${attrName} must be one of ${validator.values.join(", ")}`);
	}
	return true;
}

export const validateElementMultipleStringAttributes = <T extends StringsObject>(el: HTMLElement, attrs: ObjectStringAttributeValidator<T>): boolean => {
	for (const attrName in attrs) {
		validateElementStringAttribute(el, attrs, attrName);
	}
	return true;
}

export const isValidAttributeName = (name: string): boolean => {
	try {
		const el = document.createElement('div');
		el.setAttribute(name, '');
		return el.hasAttribute(name);
	} catch {
		return false;
	}
}
