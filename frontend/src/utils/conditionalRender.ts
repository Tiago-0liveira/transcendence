export const conditionalRender = (bool: boolean, template: string, optional?: string) => {
	return bool ? template : optional || "";
}