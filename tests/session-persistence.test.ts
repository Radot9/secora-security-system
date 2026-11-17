import test from "node:test";
import assert from "node:assert/strict";
import { sessionCookieOptions } from "../lib/auth/session-persistence.ts";

test("shared device sessions discard expiry while preserving cookie protections", () => {
 const options = { maxAge: 3600, expires: new Date("2030-01-01"), secure: true, sameSite: "lax" as const, path: "/" };
 assert.deepEqual(sessionCookieOptions(options, false), { secure: true, sameSite: "lax", path: "/" });
 assert.equal(options.maxAge, 3600);
});

test("remembered sessions retain expiry and sign-out still deletes session cookies", () => {
 assert.equal(sessionCookieOptions({ maxAge: 3600 }, true).maxAge, 3600);
 assert.equal(sessionCookieOptions({ maxAge: 0 }, false).maxAge, 0);
});
