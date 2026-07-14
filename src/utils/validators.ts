export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidIvorianPhone(phone: string): boolean {
  return /^(\+225|00225)?[0-9]{10}$/.test(phone.replace(/\s/g, ""));
}
