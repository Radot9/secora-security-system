export type WhatsAppConversationState =
 | "idle" | "visitor_name" | "visitor_phone" | "purpose" | "vehicle_choice"
 | "plate" | "duration" | "confirm" | "active_passes" | "revoke_select" | "revoke_confirm";

export type WhatsAppPassDraft = {
 visitorName?: string;
 visitorPhone?: string;
 purpose?: string;
 durationMinutes?: number;
 plateNumber?: string | null;
 selectedAccessCode?: string;
};

export type BotAction = "none" | "create_pass" | "list_passes" | "start_revoke" | "confirm_revoke" | "help" | "menu";

export type BotTransition = {
 state: WhatsAppConversationState;
 draft: WhatsAppPassDraft;
 response: string;
 action: BotAction;
 createPass: boolean;
};

const START_COMMANDS = new Set(["pass", "start", "code", "visitor", "generate", "generate_pass"]);
const MENU_COMMANDS = new Set(["hi", "hello", "menu", "home"]);
const CANCEL_COMMANDS = new Set(["cancel", "reset", "stop"]);
const BACK_COMMANDS = new Set(["back", "previous"]);
const VALIDITY_OPTIONS = new Map([["2", 120], ["2h", 120], ["6", 360], ["6h", 360], ["12", 720], ["12h", 720], ["24", 1440], ["24h", 1440]]);

export function normalizePhoneNumber(phone: string) {
 let digits = phone.trim().replace(/\D/g, "");
 if (digits.startsWith("00")) digits = digits.slice(2);
 if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
 return /^\d{10,15}$/.test(digits) ? digits : null;
}

export function parseValidityDuration(value: string) {
 return VALIDITY_OPTIONS.get(value.trim().toLowerCase()) ?? null;
}

export function formatValidityDuration(minutes: number) {
 const hours = minutes / 60;
 return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function move(state: WhatsAppConversationState, draft: WhatsAppPassDraft, response: string, action: BotAction = "none"): BotTransition {
 return { state, draft, response, action, createPass: action === "create_pass" };
}

function confirmation(draft: WhatsAppPassDraft) {
 return [
  "Please confirm your visitor's details:",
  `Visitor: ${draft.visitorName}`,
  `Phone: +${draft.visitorPhone}`,
  `Purpose: ${draft.purpose}`,
  `Vehicle: ${draft.plateNumber || "None"}`,
  `Validity: ${formatValidityDuration(draft.durationMinutes ?? 0)}`,
  "",
  "Reply CONFIRM to generate, BACK to edit, or CANCEL.",
 ].join("\n");
}

function goBack(state: WhatsAppConversationState, draft: WhatsAppPassDraft) {
 const steps: Partial<Record<WhatsAppConversationState, [WhatsAppConversationState, string]>> = {
  visitor_phone: ["visitor_name", "Please enter your visitor's full name."],
  purpose: ["visitor_phone", "Please enter your visitor's phone number."],
  vehicle_choice: ["purpose", "Purpose: Personal Visit, Delivery, Maintenance, Business, or Other?"],
  plate: ["vehicle_choice", "Will your visitor arrive with a vehicle? Reply YES or NO."],
  duration: ["vehicle_choice", "Will your visitor arrive with a vehicle? Reply YES or NO."],
  confirm: ["duration", "How long should the pass remain valid? Reply 2, 6, 12, or 24 hours."],
 };
 const previous = steps[state];
 return previous ? move(previous[0], draft, previous[1]) : move("idle", {}, "Returned to the main menu.", "menu");
}

export function advanceBotConversation(state: WhatsAppConversationState, draft: WhatsAppPassDraft, incomingText: string, residentName: string): BotTransition {
 const text = incomingText.trim();
 const command = text.toLowerCase();

 if (CANCEL_COMMANDS.has(command)) return move("idle", {}, "Visitor-pass request cancelled. No pass was created.", "menu");
 if (MENU_COMMANDS.has(command)) return move("idle", {}, `Welcome to Entriseq, ${residentName}.`, "menu");
 if (BACK_COMMANDS.has(command)) return goBack(state, draft);

 if (state === "idle") {
  if (START_COMMANDS.has(command)) return move("visitor_name", {}, "Please enter your visitor's full name.");
  if (["active", "passes", "active_passes", "status"].includes(command)) return move("active_passes", {}, "", "list_passes");
  if (["revoke", "revoke_pass"].includes(command)) return move("revoke_select", {}, "", "start_revoke");
  if (["help", "security"].includes(command)) return move("idle", {}, "", "help");
  return move("idle", {}, `Welcome to Entriseq, ${residentName}.`, "menu");
 }

 if (state === "visitor_name") {
  if (text.length < 2 || text.length > 100) return move(state, draft, "Enter a visitor name between 2 and 100 characters.");
  return move("visitor_phone", { ...draft, visitorName: text }, "Please enter your visitor's phone number.");
 }

 if (state === "visitor_phone") {
  const visitorPhone = normalizePhoneNumber(text);
  if (!visitorPhone) return move(state, draft, "That phone number does not look valid. Example: 08031234567.");
  return move("purpose", { ...draft, visitorPhone }, "Purpose: Personal Visit, Delivery, Maintenance, Business, or Other?");
 }

 if (state === "purpose") {
  const purposeOptions: Record<string, string> = { personal: "Personal Visit", personal_visit: "Personal Visit", "personal visit": "Personal Visit", delivery: "Delivery", maintenance: "Maintenance", business: "Business" };
  const purpose = purposeOptions[command] ?? text;
  if (purpose.length < 2 || purpose.length > 100) return move(state, draft, "Enter a purpose between 2 and 100 characters.");
  return move("vehicle_choice", { ...draft, purpose }, "Will your visitor arrive with a vehicle? Reply YES or NO.");
 }

 if (state === "vehicle_choice") {
  if (["yes", "y"].includes(command)) return move("plate", draft, "Please enter the vehicle plate number.");
  if (["no", "n"].includes(command)) return move("duration", { ...draft, plateNumber: null }, "How long should the pass remain valid? Reply 2, 6, 12, or 24 hours.");
  return move(state, draft, "Please reply YES or NO.");
 }

 if (state === "plate") {
  const plateNumber = text.toUpperCase();
  if (!plateNumber || plateNumber.length > 20) return move(state, draft, "Enter a valid plate number with no more than 20 characters.");
  return move("duration", { ...draft, plateNumber }, "How long should the pass remain valid? Reply 2, 6, 12, or 24 hours.");
 }

 if (state === "duration") {
  const durationMinutes = parseValidityDuration(command);
  if (!durationMinutes) return move(state, draft, "Choose 2, 6, 12, or 24 hours.");
  const completed = { ...draft, durationMinutes };
  return move("confirm", completed, confirmation(completed));
 }

 if (state === "confirm") {
  if (["confirm", "yes", "generate"].includes(command)) return move("idle", draft, "", "create_pass");
  if (["edit", "no"].includes(command)) return move("visitor_name", {}, "Let's start again. Please enter your visitor's full name.");
  return move(state, draft, "Reply CONFIRM to generate, BACK to edit, or CANCEL.");
 }

 if (state === "revoke_select") {
  if (!/^\d{6}$/.test(command)) return move(state, draft, "Reply with the six-digit code you want to revoke, or CANCEL.");
  return move("revoke_confirm", { ...draft, selectedAccessCode: command }, `Revoke visitor pass ${command}? Reply REVOKE to confirm or CANCEL.`);
 }

 if (state === "revoke_confirm") {
  if (command === "revoke") return move("idle", draft, "", "confirm_revoke");
  return move(state, draft, "Reply REVOKE to confirm or CANCEL.");
 }

 return move("idle", {}, "Returned to the main menu.", "menu");
}
