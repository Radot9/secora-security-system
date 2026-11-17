import assert from "node:assert/strict";
import { test } from "node:test";
import { parseResidentCsv } from "../lib/resident-onboarding.ts";

test("parses quoted commas and escaped quotes from tester CSV rows", () => {
 const rows = parseResidentCsv('Full Name,Email,Address\r\n"Mr & Mrs Sorinolu",s@example.com,"Flat 5, Ofili close"\r\n"A \"\"quoted\"\" name",a@example.com,Plot 1');
 assert.deepEqual(rows, [
 { "full name": "Mr & Mrs Sorinolu", email: "s@example.com", address: "Flat 5, Ofili close" },
 { "full name": 'A "quoted" name', email: "a@example.com", address: "Plot 1" },
 ]);
});

test("parses the supplied early tester spreadsheet header and all non-empty rows", async () => {
 const { readFile } = await import("node:fs/promises");
 const csv = await readFile(new URL("../lib/Entriseq Early Tester Registration (Responses) - Form responses 1.csv", import.meta.url), "utf8");
 const rows = parseResidentCsv(csv);
 assert.equal(rows[0]["full name"], "Emmanuel Shotolu");
 assert.ok(rows.length > 20);
 assert.equal(rows[0]["do you consent to the use of your information as described in the privacy notice above?"], "Yes, I agree");
});
