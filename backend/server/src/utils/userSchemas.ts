import { z } from "zod";
import { UserAuthMethod } from "@enums/enums";

export const userSignupSchema = z.object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters long').max(30),
    displayName: z.string().trim().min(3, 'Display name must be at least 3 characters').max(30).optional(),
    avatarUrl:      z.string().url('Invalid avatar URL').optional(),
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

export const googleSignupCompleteSchema = z.object({
    username:       z.string().trim().min(3, 'Username must be at least 3 characters long').max(30),
    displayName:    z.string().trim().min(3, 'Display name must be at least 3 characters').max(30).optional(),
    avatarUrl:      z.string().url('Invalid avatar URL').optional(),
});

export const googleRequestSchema = z.object({
    code:   z.string().min(1, "Google authorization code is required"),
    token:  z.string().optional()
});

export const updateSchema = z.object({
    displayName:    z.string().trim().min(3, 'Display name must be at least 3 characters').max(30),
    avatarUrl:      z.string().url('Invalid avatar URL').optional(),
});

export const changePasswordSchema = z.object({
    oldPassword: z.string(),
    newPassword: z
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
});
