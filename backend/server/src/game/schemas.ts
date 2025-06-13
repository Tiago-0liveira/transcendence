import { z } from "zod";


export const newGameConfigSchema = z.object({
	roomName: z.string().trim().min(3).max(18),
	playersNumber: z.number().min(4).max(8).default(4),
	roomType: z.enum(["1v1", "tournament"]).default("1v1"),
	locality: z.enum(["local", "online"]).default("local"),
	visibility: z.enum(["friends", "public"]).default("friends")
});