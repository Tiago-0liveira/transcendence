import { z } from "zod";
import { UserAuthMethod } from "@enums/enums";

export const userSignupSchema = z.object({
    username: z.string().trim().toLowerCase().min(3, 'Username must be at least 3 characters long'),
    displayName: z.string().trim().min(3, 'Display name must be at least 3 characters').optional(),
    avatarUrl: z.string().trim().url('Invalid avatar URL').optional(),
    password: z
        .string()
        .trim()
        .min(6, "Password must be at least 6 characters long")
        .refine(pw => /[A-ZА-ЯЁ]/.test(pw), {
            message: "Password must contain at least one uppercase letter (Latin or Cyrillic)",
        })
        .refine(pw => /\d/.test(pw), {
            message: "Password must contain at least one digit",
        })
        .refine(pw => /[^A-Za-zА-Яа-яЁё0-9]/.test(pw), {
            message: "Password must contain at least one special character",
        }),
    authProvider: z.nativeEnum(UserAuthMethod).optional().default(UserAuthMethod.LOCAL),
});

export const userLoginSchema = z.object({
    username:   z.string().trim(),
    password:   z.string().trim(),
    token:      z.string().optional(),
});

