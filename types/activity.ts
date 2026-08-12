export type ActivityStatus =
  | "pending"
  | "entered"
  | "exited"
  | "revoked"
  | "expired";

export interface ActivityItem {
  id: string;
  visitor_name: string;
  visitor_phone?: string | null;
  plate_number?: string | null;
  resident_name?: string | null;
  access_code: string;
  status: ActivityStatus | string;
  created_at: string;
  entry_time?: string | null;
  exit_time?: string | null;
  expires_at?: string | null;
  checked_in_by?: string | null;
  checked_in_by_name?: string | null;
  checked_out_by?: string | null;
  checked_out_by_name?: string | null;
}
