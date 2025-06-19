import { z } from "zod";


export const newGameConfigSchema = z.object({
	roomName: z.string().trim().min(3).max(18),
	roomType: z.enum(["1v1", "tournament"]).default("1v1"),
	visibility: z.enum(["friends", "public"]).default("friends")
});