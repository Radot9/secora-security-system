import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { fullName, email, password, phone, houseNumber, street } = body;

    if (!fullName || !email || !password || !phone || !houseNumber || !street) {
      return NextResponse.json(
        {
          error: "All fields are required.",
        },
        {
          status: 400,
        },
      );
    }
    console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "SERVICE ROLE EXISTS:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
    // 1. Create Auth User
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = authData.user;

    // 2. Create Profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        email,
        full_name: fullName,
        role: "resident",
        is_active: true,
      });

    if (authError) {
      // Return a friendlier message for duplicate emails
      if (
        authError.message.toLowerCase().includes("already") ||
        authError.message.toLowerCase().includes("registered")
      ) {
        return NextResponse.json(
          {
            error: "Resident already exists.",
          },
          {
            status: 400,
          },
        );
      }

      return NextResponse.json(
        {
          error: authError.message,
        },
        {
          status: 400,
        },
      );
    }

    // 3. Create Resident Record
    const { error: residentError } = await supabaseAdmin
      .from("residents")
      .insert({
        user_id: user.id,
        full_name: fullName,
        email,
        phone,
        house_number: houseNumber,
        street,
        is_active: true,
      });

    if (residentError) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);

      return NextResponse.json(
        { error: residentError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Resident created successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        catch(error) {
          console.error(error);

          return NextResponse.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Something went wrong.",
            },
            {
              status: 500,
            },
          );
        },
      },
      {
        status: 500,
      },
    );
  }
}
