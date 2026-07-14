import test from "node:test";
import assert from "node:assert/strict";
import { canAccessRole, validateAdministratorTransition } from "../lib/auth/roles.ts";

test("only explicitly allowed roles pass role authorization", () => {
 assert.equal(canAccessRole("super_admin", ["super_admin"]), true);
 assert.equal(canAccessRole("admin", ["super_admin"]), false);
 assert.equal(canAccessRole("resident", ["admin", "super_admin"]), false);
 assert.equal(canAccessRole("security", ["admin", "super_admin"]), false);
});

test("a Super Admin cannot change their own privileged access", () => {
 const error = validateAdministratorTransition({
 actorId: "same", targetId: "same", currentRole: "super_admin", nextRole: "admin",
 currentActive: true, nextActive: true, activeSuperAdminCount: 2,
 });
 assert.match(error ?? "", /own role/);
});

test("the final active Super Admin cannot be deactivated", () => {
 const error = validateAdministratorTransition({
 actorId: "actor", targetId: "target", currentRole: "super_admin", nextRole: "super_admin",
 currentActive: true, nextActive: false, activeSuperAdminCount: 1,
 });
 assert.match(error ?? "", /last active Super Admin/);
});

test("a different Super Admin may promote an Admin", () => {
 const error = validateAdministratorTransition({
 actorId: "actor", targetId: "target", currentRole: "admin", nextRole: "super_admin",
 currentActive: true, nextActive: true, activeSuperAdminCount: 1,
 });
 assert.equal(error, null);
});

test("resident and security accounts cannot be managed as administrators", () => {
 for (const role of ["resident", "security"] as const) {
 const error = validateAdministratorTransition({
 actorId: "actor", targetId: "target", currentRole: role, nextRole: "admin",
 currentActive: true, nextActive: true, activeSuperAdminCount: 1,
 });
 assert.match(error ?? "", /Only administrator accounts/);
 }
});
