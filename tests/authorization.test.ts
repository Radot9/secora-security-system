import test from "node:test";
import assert from "node:assert/strict";
import { canAccessRole, validateAdministratorTransition } from "../lib/auth/roles.ts";
import {
 getDisplayVisitorStatus,
 validateVisitorCheckIn,
 validateVisitorCheckOut,
 validateVisitorRevocation,
} from "../lib/visitor-status.ts";

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

test("visitor display status treats expired pending passes as expired", () => {
 const now = new Date("2026-07-15T12:00:00.000Z");
 assert.equal(getDisplayVisitorStatus({ status: "pending", expiresAt: "2026-07-15T11:59:00.000Z", now }), "expired");
 assert.equal(getDisplayVisitorStatus({ status: "pending", expiresAt: "2026-07-15T12:30:00.000Z", now }), "pending");
});

test("visitor check-in is only valid for active pending passes", () => {
 const now = new Date("2026-07-15T12:00:00.000Z");
 assert.equal(validateVisitorCheckIn({ status: "pending", expiresAt: "2026-07-15T12:30:00.000Z", now }), null);
 assert.match(validateVisitorCheckIn({ status: "pending", expiresAt: "2026-07-15T11:59:00.000Z", now }) ?? "", /expired/);
 assert.match(validateVisitorCheckIn({ status: "entered" }) ?? "", /already checked in/);
 assert.match(validateVisitorCheckIn({ status: "revoked" }) ?? "", /revoked/);
 assert.match(validateVisitorCheckIn({ status: "exited" }) ?? "", /already checked out/);
});

test("visitor check-out is only valid after check-in", () => {
 assert.equal(validateVisitorCheckOut("entered"), null);
 assert.match(validateVisitorCheckOut("pending") ?? "", /not been checked in/);
 assert.match(validateVisitorCheckOut("exited") ?? "", /already checked out/);
});

test("visitor revocation is only valid before entry", () => {
 assert.equal(validateVisitorRevocation("pending"), null);
 assert.match(validateVisitorRevocation("entered") ?? "", /already inside/);
 assert.match(validateVisitorRevocation("exited") ?? "", /already checked out/);
 assert.match(validateVisitorRevocation("revoked") ?? "", /already revoked/);
});
