export const passwordRequirements = [
 { label: "At least 12 characters", test: (password: string) => password.length >= 12 },
] as const;

export function isPasswordValid(password: string) {
 return passwordRequirements.every((requirement) => requirement.test(password));
}
