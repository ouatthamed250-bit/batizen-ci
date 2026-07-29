import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
  displayName: z.string().min(2, "Le nom doit faire au moins 2 caractères").optional(),
});

export const makeAdminSchema = z.object({
  idToken: z.string().min(10, "Token invalide"),
  secret: z.string().min(1, "Secret requis"),
});

export const chatSchema = z.object({
  message: z.string().min(1, "Message vide").max(2000, "Message trop long (max 2000 caractères)"),
});