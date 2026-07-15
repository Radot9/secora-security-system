export interface Visitor {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  purpose_of_visit: string | null;
  plate_number: string | null;
  resident_id: string;
  resident_name: string;
  access_code: string;
  status: string;
  validity_duration_minutes: number | null;
  entry_time: string | null;
  exit_time: string | null;
  expires_at: string;
  created_at: string;
}
