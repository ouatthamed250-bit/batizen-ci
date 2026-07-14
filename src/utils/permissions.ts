export function canShareProject(role: string): boolean {
  return ["client", "architecte", "admin"].includes(role);
}

export function canValidateQuote(role: string): boolean {
  return ["client", "admin"].includes(role);
}
