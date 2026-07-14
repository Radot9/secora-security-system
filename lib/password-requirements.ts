export const passwordRequirements = [
 { label: "At least 8 characters", test: (password: string) => password.length >= 8 },
 { label: "One uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
 { label: "One number", test: (password: string) => /\d/.test(password) },
 { label: "One symbol", test: (password: string) => /[^A-Za-z0-9]/.test(password) },
] as const;

export function isPasswordValid(password: string) {
 return passwordRequirements.every((requirement) => requirement.test(password));
}
