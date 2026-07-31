export interface Resident {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  house_number: string;
  street: string | null;
  close: string | null;
  is_active: boolean;
}
