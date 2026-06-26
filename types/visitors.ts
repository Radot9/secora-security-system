export interface Visitor {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  plate_number: string | null;
  resident_id: string;
  resident_name: string;
  access_code: string;
  status: string;
  entry_time: string | null;
  exit_time: string | null;
  expires_at: string;
  created_at: string;
}