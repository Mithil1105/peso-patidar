import { describe, expect, it } from "vitest";
import { parseBulkUsersCsv, resolveManagerUserId } from "@/lib/bulkUsersCsv";

describe("bulkUsersCsv", () => {
  it("parses csv and maps position aliases", () => {
    const csv = [
      "name,email,position,password",
      "John,john@example.com,manager,Pass@123",
      "Alice,alice@example.com,employee,Pass@123",
    ].join("\n");
    const parsed = parseBulkUsersCsv(csv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].role).toBe("engineer");
    expect(parsed.rows[1].role).toBe("employee");
  });

  it("resolves manager by email only", () => {
    const importedByEmail = new Map([["mgr@org.com", "u1"]]);
    const existingByEmail = new Map([["oldmgr@org.com", "u2"]]);

    expect(resolveManagerUserId("mgr@org.com", importedByEmail, existingByEmail)).toBe("u1");
    expect(resolveManagerUserId("oldmgr@org.com", importedByEmail, existingByEmail)).toBe("u2");
    expect(resolveManagerUserId("missing@org.com", importedByEmail, existingByEmail)).toBeUndefined();
  });
});
