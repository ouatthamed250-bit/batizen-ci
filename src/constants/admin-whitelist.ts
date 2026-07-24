/**
 * Liste blanche des UID admin — sécurité supplémentaire.
 * Un UID présent dans cette liste sera reconnu comme admin
 * même sans custom claim Firebase ni rôle dans la DB.
 *
 * ⚠️ SÉCURITÉ : Ce fichier est côté client. Tout utilisateur
 * peut voir les UID listés. Il ne faut PAS s'appuyer uniquement
 * sur cette whitelist — c'est un filet de sécurité supplémentaire.
 */
export const ADMIN_UIDS: string[] = [
  'p0dGVFkLRAOrWfGmq9hSBoZKXb22', // Hamed — ouatthamed250@gmail.com
  'aaGhSvV60KTntvVaZxIT6AKfTD43', // admin@batizen.ci
];