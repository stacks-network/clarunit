import { principalCV, publicKeyToAddress } from "@stacks/transactions";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { stringToCV } from "../src/parser/string-to-cv";

describe("verify string to cv converter", () => {
  const generators = fc.record({
    hex: fc.stringMatching(/^[0-9a-fA-F]{64}$/),
    name: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{0,42}$/),
  });

  it("should convert principal", () => {
    fc.assert(
      fc.property(generators, (expected) => {
        const principal = publicKeyToAddress(expected.hex);

        const resultStandard = stringToCV(principal, "principal");
        expect(resultStandard.type).toEqual("principal");
        expect(resultStandard.value).toBePrincipal(principal);

        const contract = `${principal}.${expected.name}`;
        const resultContract = stringToCV(contract, "principal");
        expect(resultContract.type).toEqual("principal");
        expect(resultContract.value).toStrictEqual(principalCV(contract));
      })
    );
  });
});
