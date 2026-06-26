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