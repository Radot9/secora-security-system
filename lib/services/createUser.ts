import { supabaseAdmin } from "@/lib/supabase-admin";

interface CreateUserParams {
  email: string;
  password: string;
  role: "resident" | "security" | "admin";
  fullName: string;
}

export async function createUser({
  email,
  password,
  role,
  fullName,
}: CreateUserParams) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const user = data.user;

  if (!user) {
    throw new Error("User could not be created.");
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: user.id,
      role,
      full_name: fullName,
      email,
    });

  if (profileError) {
    throw new Error(profileError.message);
  }

  return user;
}