/**
 * Comparaison de chaînes à temps constant (constant-time comparison).
 *
 * 🔒 SÉCURITÉ : `a === b` sur des secrets (tokens, mots de passe, clés API)
 * s'arrête dès le premier caractère différent. Un attaquant peut mesurer le
 * temps de réponse du serveur pour deviner le secret caractère par caractère
 * ("timing attack"). Cette fonction compare TOUJOURS l'intégralité des deux
 * chaînes, quel que soit l'endroit où elles diffèrent, pour que le temps
 * d'exécution ne dépende jamais du contenu du secret.
 *
 * Implémentée sans dépendre du module Node `crypto` (timingSafeEqual) car
 * certaines routes (ex: routes CRON) tournent en runtime Edge, où ce module
 * n'est pas disponible.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;

  const lenA = a.length;
  const lenB = b.length;
  const maxLen = Math.max(lenA, lenB);

  // On accumule les différences sur toute la longueur maximale, y compris si
  // les tailles diffèrent, afin de ne pas fuiter la longueur du secret ni son
  // contenu via le temps d'exécution.
  let diff = lenA === lenB ? 0 : 1;
  for (let i = 0; i < maxLen; i++) {
    const codeA = i < lenA ? a.charCodeAt(i) : 0;
    const codeB = i < lenB ? b.charCodeAt(i) : 0;
    diff |= codeA ^ codeB;
  }

  return diff === 0;
}
