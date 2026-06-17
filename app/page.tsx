'use client';

import { supabase } from "@/lib/supabase";

export default function Home() {
  async function testSupabase() {
    const { data, error } = await supabase
      .from("visitors")
      .insert({
        visitor_name: "Test Visitor",
        visitor_phone: "08012345678",
        plate_number: "ABC123",
        resident_name: "Emmanuel",
        access_code: Math.floor(
        100000 + Math.random() * 900000
        ).toString(),
      });

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
      alert(error.message);
    }
  }

  return (
    <div className="p-10">
      <button
        onClick={testSupabase}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Test Supabase
      </button>
    </div>
  );
}