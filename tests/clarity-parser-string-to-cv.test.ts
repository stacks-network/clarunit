import { Cl, ClarityType } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import {
  ContractInterfaceAtomType,
  stringToCV,
} from "../src/parser/string-to-cv";

describe("verify string to cv conversion", () => {
  it("should convert string to cv", () => {
    const result = stringToCV("hello", { "string-utf8": { length: 100 } });
    expect(result).toEqual({
      type: "string",
      value: Cl.stringUtf8("hello"),
    });
  });

  it("should convert uint to cv", () => {
    const result = stringToCV("u12345", "uint128");
    expect(result).toEqual({
      type: "uint",
      value: Cl.uint(12345),
    });
  });

  it("should convert tuple to cv", () => {
    const result = stringToCV("{a: 12345}", {
      tuple: [{ name: "a", type: "int128" }],
    });
    expect(result).toEqual({
      type: "tuple",
      value: { value: { a: Cl.int(12345) }, type: ClarityType.Tuple },
    });
  });

  it("should convert list of uints to cv", () => {
    const result = stringToCV("(list u1 u2 u3)", {
      list: { type: "uint128", length: 3 },
    });
    expect(result).toEqual({
      type: "list",
      value: {
        value: [Cl.uint(1), Cl.uint(2), Cl.uint(3)],
        type: ClarityType.List,
      },
    });
  });

  it("should convert list of tuples to cv", () => {
    const result = stringToCV("(list {a: u1} {a: u2} {a: u3})", {
      list: { type: { tuple: [{ name: "a", type: "uint128" }] }, length: 3 },
    });
    expect(result).toEqual({
      type: "list",
      value: {
        value: [
          { value: { a: Cl.uint(1) }, type: ClarityType.Tuple },
          { value: { a: Cl.uint(2) }, type: ClarityType.Tuple },
          { value: { a: Cl.uint(3) }, type: ClarityType.Tuple },
        ],
        type: ClarityType.List,
      },
    });
  });

  it("should parse list arguments", () => {
    // single-element buffer list
    const bufListType = {
      list: { type: { buffer: { length: 32 } }, length: 1 },
    };
    expect(
      stringToCV(
        "(list 0x43f51785937b153496e1bd092a4999405d697138273681aba55e841756043fe2)",
        bufListType,
      ).value,
    ).toEqual(Cl.list([Cl.bufferFromHex("43f51785937b153496e1bd092a4999405d697138273681aba55e841756043fe2")]));

    // boolean list
    const boolListType = {
      list: { type: "bool" as ContractInterfaceAtomType, length: 2 },
    };
    expect(stringToCV("(list true false)", boolListType).value).toEqual(
      Cl.list([Cl.bool(true), Cl.bool(false)]),
    );

    // empty list
    expect(stringToCV("(list)", boolListType).value).toEqual(Cl.list([]));
  });
});
