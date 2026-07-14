export const userRoles = ["super_admin", "admin", "resident", "security"] as const;

export type UserRole = (typeof userRoles)[number];

export type ProfileAccess = {
 id: string;
 email: string;
 full_name: string | null;
 phone: string | null;
 role: UserRole;
 is_active: boolean;
 must_change_password: boolean;
 onboarding_completed_at: string | null;
};

export const dashboardByRole: Record<UserRole, string> = {
 super_admin: "/admin/super-admin",
 admin: "/admin",
 resident: "/residents",
 security: "/security",
};

export function isUserRole(value: unknown): value is UserRole {
 return typeof value === "string" && userRoles.includes(value as UserRole);
}

export function canAccessRole(actualRole: UserRole, allowedRoles: readonly UserRole[]) {
 return allowedRoles.includes(actualRole);
}

export function validateAdministratorTransition(input: {
 actorId: string;
 targetId: string;
 currentRole: UserRole;
 nextRole: UserRole;
 currentActive: boolean;
 nextActive: boolean;
 activeSuperAdminCount: number;
}) {
 if (!(["admin", "super_admin"] as UserRole[]).includes(input.currentRole)) {
 return "Only administrator accounts can be managed here.";
 }
 if (!(["admin", "super_admin"] as UserRole[]).includes(input.nextRole)) {
 return "Administrators can only have the Admin or Super Admin role.";
 }
 if (input.actorId === input.targetId && (input.currentRole !== input.nextRole || input.currentActive !== input.nextActive)) {
 return "You cannot change your own role or active status.";
 }
 if (
 input.currentRole === "super_admin" &&
 (input.nextRole !== "super_admin" || !input.nextActive) &&
 input.activeSuperAdminCount <= 1
 ) {
 return "The last active Super Admin cannot be demoted or deactivated.";
 }
 return null;
}
