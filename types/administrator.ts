import type { UserRole } from "@/lib/auth/roles";

export type Administrator = {
 id: string;
 email: string;
 full_name: string | null;
 phone: string | null;
 role: Extract<UserRole, "admin" | "super_admin">;
 is_active: boolean;
 created_at: string;
 invited_by: string | null;
 deactivated_at: string | null;
 onboarding_completed_at: string | null;
};

export type AdminInvitation = {
 id: string;
 auth_user_id: string | null;
 email: string;
 full_name: string | null;
 phone: string | null;
 intended_role: "admin" | "super_admin";
 status: "pending" | "accepted" | "revoked" | "expired";
 expires_at: string;
 created_at: string;
};
