import { describe, it, expect } from "vitest";
import { parseCsv, detectDelimiter } from "../../src/csv/reader";

describe("parseCsv", () => {
  it("parses simple CSV", () => {
    const doc = parseCsv("a,b,c\n1,2,3\n4,5,6");
    expect(doc.headers).toEqual(["a", "b", "c"]);
    expect(doc.rows).toEqual([["1", "2", "3"], ["4", "5", "6"]]);
  });

  it("handles quoted commas", () => {
    const doc = parseCsv('name,value\n"Smith, John",42');
    expect(doc.rows[0][0]).toBe("Smith, John");
    expect(doc.rows[0][1]).toBe("42");
  });

  it("handles escaped quotes (doubled)", () => {
    const doc = parseCsv('a,b\n"he said ""hello""",end');
    expect(doc.rows[0][0]).toBe('he said "hello"');
  });

  it("handles empty fields", () => {
    const doc = parseCsv("a,b,c\n1,,3");
    expect(doc.rows[0]).toEqual(["1", "", "3"]);
  });

  it("handles trailing comma", () => {
    const doc = parseCsv("a,b,c\n1,2,3,");
    expect(doc.rows[0].length).toBe(4);
    expect(doc.rows[0][3]).toBe("");
  });

  it("skips blank rows", () => {
    const doc = parseCsv("a,b\n1,2\n\n3,4\n");
    expect(doc.rows.length).toBe(2);
  });

  it("handles Windows line endings", () => {
    const doc = parseCsv("a,b\r\n1,2\r\n3,4");
    expect(doc.rows.length).toBe(2);
    expect(doc.rows[0]).toEqual(["1", "2"]);
  });

  it("strips BOM", () => {
    const doc = parseCsv("\uFEFFa,b\n1,2");
    expect(doc.headers[0]).toBe("a");
  });

  it("reports total lines", () => {
    const doc = parseCsv("a,b\n1,2\n3,4\n");
    expect(doc.totalLines).toBeGreaterThanOrEqual(3);
  });

  it("handles tab delimiter", () => {
    const doc = parseCsv("a\tb\tc\n1\t2\t3", "\t");
    expect(doc.headers).toEqual(["a", "b", "c"]);
  });
});

describe("detectDelimiter", () => {
  it("detects comma", () => {
    expect(detectDelimiter("a,b,c,d")).toBe(",");
  });

  it("detects tab", () => {
    expect(detectDelimiter("a\tb\tc\td")).toBe("\t");
  });

  it("detects semicolon", () => {
    expect(detectDelimiter("a;b;c;d")).toBe(";");
  });

  it("defaults to comma when ambiguous", () => {
    expect(detectDelimiter("abc")).toBe(",");
  });
});
