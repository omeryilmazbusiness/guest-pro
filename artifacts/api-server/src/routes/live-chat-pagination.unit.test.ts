import assert from "node:assert/strict";
import { describe, it } from "node:test";

const INBOX_PAGE_SIZE_DEFAULT = 50;
const INBOX_PAGE_SIZE_MAX = 50;

function parseInboxPagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(
    INBOX_PAGE_SIZE_MAX,
    Math.max(1, Number(query.limit) || INBOX_PAGE_SIZE_DEFAULT),
  );
  return { page, limit, offset: (page - 1) * limit };
}

describe("parseInboxPagination", () => {
  it("defaults to page 1 and 50 items", () => {
    assert.deepEqual(parseInboxPagination({}), { page: 1, limit: 50, offset: 0 });
  });

  it("computes offset for page 2", () => {
    assert.deepEqual(parseInboxPagination({ page: "2" }), { page: 2, limit: 50, offset: 50 });
  });

  it("caps limit at 50", () => {
    assert.equal(parseInboxPagination({ limit: "200" }).limit, 50);
  });
});
