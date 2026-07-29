// Test unitaire de la logique de vérification admin
// La route API utilise next/server (Request) qui n'est pas disponible dans jsdom.
// On teste donc la logique métier via des fonctions mockées.

import { registerSchema, makeAdminSchema } from "@/lib/validation";

// Simuler la whitelist d'UIDs (copiée depuis check-admin/route.ts)
const ADMIN_UIDS = new Set([
  "p0dGVFkLRAOrWfGmq9hSBoZKXb22",
  "aaGhSvV60KTntvVaZxIT6AKfTD43",
]);

function simulateCheckAdmin(idToken: string | null): { isAdmin: boolean; source?: string } {
  if (!idToken) {
    return { isAdmin: false };
  }

  // Simule verifyIdToken
  const decoded = {
    uid: idToken === "whitelist-token" ? "p0dGVFkLRAOrWfGmq9hSBoZKXb22" : "random-uid",
    role: idToken === "admin-claim-token" ? "admin" : "client",
  };

  if (decoded.role === "admin") {
    return { isAdmin: true, source: "claims" };
  }

  if (ADMIN_UIDS.has(decoded.uid)) {
    return { isAdmin: true, source: "whitelist" };
  }

  return { isAdmin: false };
}

describe("POST /api/auth/check-admin (logique métier)", () => {
  it("retourne isAdmin=true pour un UID whitelisté", () => {
    const result = simulateCheckAdmin("whitelist-token");
    expect(result.isAdmin).toBe(true);
    expect(result.source).toBe("whitelist");
  });

  it("retourne isAdmin=true pour un custom claim admin", () => {
    const result = simulateCheckAdmin("admin-claim-token");
    expect(result.isAdmin).toBe(true);
    expect(result.source).toBe("claims");
  });

  it("retourne isAdmin=false pour un utilisateur normal", () => {
    const result = simulateCheckAdmin("normal-token");
    expect(result.isAdmin).toBe(false);
  });

  it("retourne isAdmin=false si pas de idToken", () => {
    const result = simulateCheckAdmin(null);
    expect(result.isAdmin).toBe(false);
  });
});

describe("Validation Zod (schémas communs avec l'API)", () => {
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
});