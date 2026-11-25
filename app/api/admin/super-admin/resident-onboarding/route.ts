import { authorizationResponse, requireApiRole } from "@/lib/auth/api-authorization";
import { supabaseAdmin } from "@/lib/supabase-admin";

type AuditEvent = {
 action: string;
 created_at: string;
 actor_id: string | null;
 target_profile_id: string | null;
 metadata: Record<string, unknown> | null;
};

export async function GET() {
 try {
 await requireApiRole(["super_admin"]);

 const { data: residents, error: residentsError } = await supabaseAdmin
 .from("residents")
 .select("id, user_id, full_name, email, phone, house_number, street, close, is_active, created_at")
 .order("full_name", { ascending: true });

 if (residentsError) throw residentsError;
 const userIds = [...new Set((residents ?? []).map((resident) => resident.user_id).filter((id): id is string => Boolean(id)))];
 const [{ data: profiles, error: profilesError }, { data: auditEvents, error: auditError }] = await Promise.all([
 userIds.length
 ? supabaseAdmin.from("profiles").select("id, email, role, is_active, must_change_password").in("id", userIds)
 : Promise.resolve({ data: [], error: null }),
 userIds.length
 ? supabaseAdmin.from("admin_audit_logs").select("action, created_at, actor_id, target_profile_id, metadata")
 .in("target_profile_id", userIds)
 .in("action", ["resident_invitation_generated", "resident_invitation_marked_sent", "resident_account_activated"])
 .order("created_at", { ascending: false }).limit(2000)
 : Promise.resolve({ data: [], error: null }),
 ]);
 if (profilesError) throw profilesError;
 if (auditError) throw auditError;

 const actorIds = [...new Set(((auditEvents ?? []) as AuditEvent[]).map((event) => event.actor_id).filter((id): id is string => Boolean(id)))];
 const { data: actors, error: actorsError } = actorIds.length
 ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", actorIds)
 : { data: [], error: null };
 if (actorsError) throw actorsError;

 const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
 const actorsById = new Map((actors ?? []).map((actor) => [actor.id, actor.full_name]));
 const eventsById = new Map<string, AuditEvent[]>();
 for (const event of (auditEvents ?? []) as AuditEvent[]) {
 if (!event.target_profile_id) continue;
 eventsById.set(event.target_profile_id, [...(eventsById.get(event.target_profile_id) ?? []), event]);
 }

 const payload = await Promise.all((residents ?? []).map(async (resident) => {
 const profile = resident.user_id ? profilesById.get(resident.user_id) : null;
 const events = resident.user_id ? eventsById.get(resident.user_id) ?? [] : [];
 const generated = events.find((event) => event.action === "resident_invitation_generated");
 const sent = events.find((event) => event.action === "resident_invitation_marked_sent");
 const activatedEvent = events.find((event) => event.action === "resident_account_activated");
 const expiry = typeof generated?.metadata?.expires_at === "string" ? generated.metadata.expires_at : null;
 const expired = Boolean(expiry && Date.parse(expiry) <= Date.now());
 const sentForCurrentLink = Boolean(generated && sent && Date.parse(sent.created_at) >= Date.parse(generated.created_at));
 let lastLogin: string | null = null;
 if (profile?.id) {
 const { data } = await supabaseAdmin.auth.admin.getUserById(profile.id);
 lastLogin = data.user?.last_sign_in_at ?? null;
 }
 return {
 ...resident,
 email: profile?.email ?? resident.email,
 account_active: profile?.is_active ?? resident.is_active,
 activated: profile?.role === "resident" ? !profile.must_change_password : false,
 activated_at: activatedEvent?.created_at ?? null,
 has_account: Boolean(profile && profile.role === "resident"),
 last_login: lastLogin,
 invitation_status: expired ? "Expired" : sentForCurrentLink ? "Sent" : "Not Sent",
 invitation_expires_at: expiry,
 invitation_link_valid: Boolean(generated && !expired),
 sent_at: sent?.created_at ?? null,
 sent_by: sent?.actor_id ?? null,
 sent_by_name: sent?.actor_id ? actorsById.get(sent.actor_id) ?? null : null,
 };
 }));

 return Response.json({ residents: payload }, { headers: { "Cache-Control": "no-store" } });
 } catch (error) {
 return authorizationResponse(error) ?? Response.json({ error: "Unable to load resident onboarding." }, { status: 500 });
 }
}
