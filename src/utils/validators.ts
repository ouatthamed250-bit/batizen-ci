// src/utils/validators.ts

/**
 * Valide et nettoie un numéro de téléphone (format Côte d'Ivoire et international basique)
 * @param phone Le numéro saisi par l'utilisateur
 * @returns Un objet de validation avec l'email Firebase prêt à l'emploi
 */
export function validateAndFormatPhone(phone: string) {
  // Supprime tous les espaces, tirets et plus
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  
  // Validation : entre 8 et 15 chiffres uniquement
  // Accepte les formats CI (01, 05, 07, 27) et internationaux
  const phoneRegex = /^[0-9]{8,15}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return { 
      isValid: false, 
      cleanPhone: '', 
      firebaseEmail: '', 
      error: "Le numéro doit contenir entre 8 et 15 chiffres (ex: 07 07 07 07 07)." 
    };
  }

  return {
    isValid: true,
    cleanPhone,
    firebaseEmail: `${cleanPhone}@batizen.ci`,
    error: ""
  };
}

/**
 * Valide la force d'un mot de passe
 */
export function checkPasswordStrength(password: string) {
  let score = 0;
  const feedback: string[] = [];
  
  if (password.length >= 8) score++; else feedback.push("Au moins 8 caractères");
  if (/[A-Z]/.test(password)) score++; else feedback.push("Au moins une majuscule");
  if (/[0-9]/.test(password)) score++; else feedback.push("Au moins un chiffre");
  if (/[^A-Za-z0-9]/.test(password)) score++; else feedback.push("Au moins un caractère spécial");

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 3) strength = 'strong';
  else if (score === 2) strength = 'medium';

  return { strength, score, feedback };
}