import assert from "node:assert/strict";
import { test } from "node:test";
import { isPasswordValid } from "../lib/password-requirements.ts";

test("requires at least eight characters", () => {
 assert.equal(isPasswordValid("Abcdef!"), false);
 assert.equal(isPasswordValid("Abcdefg!"), true);
});

test("requires uppercase and special characters independently", () => {
 assert.equal(isPasswordValid("abcdefg!"), false);
 assert.equal(isPasswordValid("Abcdefgh"), false);
 assert.equal(isPasswordValid("ABCDEFG!"), true);
});

test("numbers are optional and whitespace does not count as a special character", () => {
 assert.equal(isPasswordValid("Abcdefg!"), true);
 assert.equal(isPasswordValid("Abcdef1!"), true);
 assert.equal(isPasswordValid("Abcdefg "), false);
 assert.equal(isPasswordValid("Abcdefgé"), false);
 assert.equal(isPasswordValid("Abcdefg_"), true);
});
