import { z } from "zod";

export const userSignupSchema = z.object({
	username: z.string().trim().min(3, 'Username must be at least 3 characters long'),
	displayName: z.string().trim().min(3, 'Display name must be at least 3 characters').optional(),
	avatarUrl: z.string().url('Invalid avatar URL').optional(),
	password: z
		.string()
		.trim()
		.min(6, "Password must be at least 6 characters long")
		.refine(pw => /[A-Z]/.test(pw), {
			message: "Password must contain at least one uppercase letter",
		})
		.refine(pw => /\d/.test(pw), {
			message: "Password must contain at least one digit",
		})
		.refine(pw => /[^A-Za-z0-9]/.test(pw), {
			message: "Password must contain at least one special character",
		}),
});

export const userLoginSchema = z.object({
	username: z.string().trim(),
	password: z.string().trim(),
});

export const isValidLoginFormData = (_data: FormData): boolean => {

	const username_entry = _data.get("username");
	const password_entry = _data.get("password");
	if (!username_entry || !password_entry) { return false; }
	const username = username_entry.toString()
	const password = password_entry.toString()
	//TODO: add more specific validation like big chars and small, numbers, all those things
	if (username.length < 5 || username.length > 17) { return false; }
	if (password.length < 8 || password.length > 25) { return false; }


	const displayName_entry = _data.get("displayName");
	/*const _avatarUrl_entry = _data.get("avatarUrl");*/

	if (displayName_entry) {
		const displayName = displayName_entry.toString();
		if (displayName.length < 4 || displayName.length > 17) { return false; }
		// TODO: we could remove curse or strong words (maybe install node js lib with dictionary ?? or just leave it like this)
	}

	return true;
}

export const isValidGoogleOauthFormData = (_data: FormData): boolean => {
	const username_entry = _data.get("username");
	const displayName_entry = _data.get("displayName");
	const avatarUrl_entry = _data.get("avatarUrl");

	if (!username_entry) { return false; }

	const username = username_entry.toString();

	if (username.length < 5 || username.length > 17) { return false; }

	return true;
}