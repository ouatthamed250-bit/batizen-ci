import { registerSchema, makeAdminSchema, chatSchema } from "@/lib/validation";

describe("Validation Zod", () => {
  describe("registerSchema", () => {
    it("accepte un email et password valides", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejette un email invalide", () => {
      const result = registerSchema.safeParse({
        email: "pas-un-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("rejette un password trop court", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("makeAdminSchema", () => {
    it("accepte idToken et secret valides", () => {
      const result = makeAdminSchema.safeParse({
        idToken: "valid-token-12345",
        secret: "mon-secret",
      });
      expect(result.success).toBe(true);
    });

    it("rejette un idToken trop court", () => {
      const result = makeAdminSchema.safeParse({
        idToken: "short",
        secret: "mon-secret",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("chatSchema", () => {
    it("accepte un message valide", () => {
      const result = chatSchema.safeParse({ message: "Bonjour" });
      expect(result.success).toBe(true);
    });

    it("rejette un message vide", () => {
      const result = chatSchema.safeParse({ message: "" });
      expect(result.success).toBe(false);
    });

    it("rejette un message trop long", () => {
      const result = chatSchema.safeParse({ message: "a".repeat(2001) });
      expect(result.success).toBe(false);
    });
  });
});