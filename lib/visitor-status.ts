export const visitorStatusConfig = {
  entered: {
    title: "Valid Pass",
    message: "Visitor is authorised",
    severity: "success",
    state: "entered",
  },

  exited: {
    title: "Visitor Checked Out",
    message: "Visitor has left the estate",
    severity: "neutral",
    state: "exited",
  },

  revoked: {
    title: "Access Revoked",
    message: "Visitor access has been cancelled",
    severity: "danger",
    state: "revoked",
  },

  pending: {
    title: "Pending Entry",
    message: "Visitor has not entered yet",
    severity: "warning",
    state: "pending",
  },

  expired: {
    title: "Pass Expired",
    message: "Visitor pass has expired",
    severity: "danger",
    state: "expired",
  },
} as const;

export type VisitorStatus = keyof typeof visitorStatusConfig;

type VisitorTransitionInput = {
 status: string | null;
 expiresAt?: string | null;
 now?: Date;
};

export function getDisplayVisitorStatus({
 status,
 expiresAt,
 now = new Date(),
}: VisitorTransitionInput): VisitorStatus {
 if (status === "pending" && expiresAt && new Date(expiresAt).getTime() <= now.getTime()) {
 return "expired";
 }

 if (status && status in visitorStatusConfig) {
 return status as VisitorStatus;
 }

 return "pending";
}

export function validateVisitorCheckIn(input: VisitorTransitionInput) {
 const displayStatus = getDisplayVisitorStatus(input);

 switch (displayStatus) {
 case "pending":
 return null;
 case "expired":
 return "This visitor pass has expired.";
 case "revoked":
 return "This visitor pass has been revoked.";
 case "entered":
 return "This visitor is already checked in.";
 case "exited":
 return "This visitor has already checked out.";
 default:
 return "This visitor pass cannot be checked in.";
 }
}

export function validateVisitorCheckOut(status: string | null) {
 switch (status) {
 case "entered":
 return null;
 case "pending":
 return "This visitor has not been checked in yet.";
 case "revoked":
 return "This visitor pass has been revoked.";
 case "exited":
 return "This visitor has already checked out.";
 default:
 return "This visitor pass cannot be checked out.";
 }
}

export function validateVisitorRevocation(status: string | null) {
 switch (status) {
 case "pending":
 return null;
 case "entered":
 return "This visitor is already inside and cannot be revoked from here.";
 case "exited":
 return "This visitor has already checked out.";
 case "revoked":
 return "This access code is already revoked.";
 default:
 return "This access code cannot be revoked.";
 }
}

export function displayVisitorStatus(status: string | null) {
 const normalizedStatus = status && status in visitorStatusConfig ? status : "pending";
 if (normalizedStatus === "revoked") return "Revoked";
 return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
}

export function visitorStatusClassName(status: string | null) {
 switch (status) {
 case "entered":
 return "bg-emerald-100 text-emerald-700";
 case "exited":
 return "bg-primary/15 text-primary";
 case "revoked":
 return "bg-destructive/15 text-destructive";
 case "expired":
 return "bg-secondary text-secondary-foreground";
 case "pending":
 return "bg-primary/15 text-primary";
 default:
 return "bg-muted text-muted-foreground";
 }
}
