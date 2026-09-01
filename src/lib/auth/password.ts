export const MIN_ACCOUNT_PASSWORD_LENGTH = 8;

export function validateNewPassword(password: string, confirmation: string): string | null {
  if (password.length < MIN_ACCOUNT_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_ACCOUNT_PASSWORD_LENGTH} caractères.`;
  }

  if (password !== confirmation) {
    return "Les deux mots de passe ne correspondent pas.";
  }

  return null;
}

export function passwordRecoveryRedirect(origin: string): string {
  return `${origin.replace(/\/$/, "")}/auth/reset-password`;
}
