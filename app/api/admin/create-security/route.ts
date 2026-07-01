import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      fullName,
      email,
      password,
      phone,
      gate,
      team,
    } = body;

    // --------------------------------------------------
    // Create the authentication account
    // --------------------------------------------------
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      if (
        authError.message
          .toLowerCase()
          .includes("already")
      ) {
        return NextResponse.json(
          {
            error: "Security personnel already exists.",
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json(
        {
          error: authError.message,
        },
        {
          status: 400,
        }
      );
    }

    const user = authData.user;

    // --------------------------------------------------
    // Create profile
    // --------------------------------------------------
    const { error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .insert({
          id: user.id,
          email,
          full_name: fullName,
          role: "security",
          is_active: true,
        });

    if (profileError) {
      return NextResponse.json(
        {
          error: profileError.message,
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // Create security personnel record
    // --------------------------------------------------
    const { error: securityError } =
      await supabaseAdmin
        .from("security_personnel")
        .insert({
          user_id: user.id,
          full_name: fullName,
          email,
          phone,
          gate,
          team,
          is_active: true,
        });

    if (securityError) {
      return NextResponse.json(
        {
          error: securityError.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Security personnel created successfully.",
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}