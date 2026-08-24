/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
type TestDb = ReturnType<typeof convexTest>;

function identityFor(clerkId: string) {
  return {
    subject: clerkId,
    tokenIdentifier: `test|${clerkId}`,
  };
}

async function insertUser(t: TestDb, clerkId: string, username: string) {
  return await t.run(async (ctx) =>
    ctx.db.insert("users", {
      clerkId,
      tokenIdentifier: `test|${clerkId}`,
      name: username,
      username,
      email: `${clerkId}@example.com`,
      searchText: username,
      isPublic: true,
      allowMessages: true,
      role: "user",
    })
  );
}

describe("social identity checks", () => {
  test("blocks client-supplied user id spoofing across social, messages, and friends", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await insertUser(t, "clerk-social-owner", "owner");
    const otherId = await insertUser(t, "clerk-social-other", "other");
    const owner = t.withIdentity(identityFor("clerk-social-owner"));
    const other = t.withIdentity(identityFor("clerk-social-other"));

    await expect(
      owner.mutation(api.social.createPost, {
        authorId: ownerId,
        body: "Leg day logged",
      })
    ).resolves.toBeTruthy();

    await expect(
      other.mutation(api.social.createPost, {
        authorId: ownerId,
        body: "Spoofed post",
      })
    ).rejects.toThrow("Not allowed.");

    await expect(
      other.mutation(api.messages.send, {
        senderId: ownerId,
        recipientId: otherId,
        body: "Spoofed message",
      })
    ).rejects.toThrow("Not allowed.");

    await expect(
      other.mutation(api.friends.addByUsername, {
        userId: ownerId,
        username: "other",
      })
    ).rejects.toThrow("Not allowed.");
  });
});
