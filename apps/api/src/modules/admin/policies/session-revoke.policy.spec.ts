import { ForbiddenException } from "@nestjs/common";

import { assertCanRevokeSessions } from "./session-revoke.policy";

describe("assertCanRevokeSessions", () => {
  it("allows revoking another user's sessions freely", () => {
    expect(() =>
      assertCanRevokeSessions({
        targetUserId: "user-2",
        callerUserId: "user-1",
        callerSessionId: "session-1",
      }),
    ).not.toThrow();
  });

  it("blocks revoking ALL of your own sessions (would include the current one)", () => {
    expect(() =>
      assertCanRevokeSessions({
        targetUserId: "user-1",
        callerUserId: "user-1",
        callerSessionId: "session-1",
      }),
    ).toThrow(ForbiddenException);
  });

  it("blocks revoking your own current session specifically", () => {
    expect(() =>
      assertCanRevokeSessions({
        targetUserId: "user-1",
        callerUserId: "user-1",
        callerSessionId: "session-1",
        sessionIdToRevoke: "session-1",
      }),
    ).toThrow(ForbiddenException);
  });

  it("allows revoking a DIFFERENT one of your own sessions (another device)", () => {
    expect(() =>
      assertCanRevokeSessions({
        targetUserId: "user-1",
        callerUserId: "user-1",
        callerSessionId: "session-1",
        sessionIdToRevoke: "session-2",
      }),
    ).not.toThrow();
  });
});
