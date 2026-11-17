const specialCharacterPattern = new RegExp("[\\p{P}\\p{S}]", "u");

export const passwordRequirementsMessage = "Use at least 8 characters, including one uppercase letter and one special character.";

export const passwordRequirements = [
 { label: "At least 8 characters", test: (password: string) => password.length >= 8 },
 { label: "One uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
 { label: "One special character", test: (password: string) => specialCharacterPattern.test(password) },
] as const;

export function isPasswordValid(password: string) {
 return passwordRequirements.every((requirement) => requirement.test(password));
}
