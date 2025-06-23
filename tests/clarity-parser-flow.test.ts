import * as fs from "fs";
import { describe, expect, it } from "vitest";
import { extractTestAnnotationsAndCalls } from "../src/parser/clarity-parser-flow-tests";
import path from "path";

describe("verify clarity parser for flow tests", () => {
  it("should parse flow test with simple annotations", () => {
    const [annotations, callInfos] = extractTestAnnotationsAndCalls(
      fs.readFileSync(
        path.join(__dirname, "./contracts/parser-tests/simple-flow.clar"),
        "utf8"
      ),
      simnet
    );
    expect(annotations["test-simple-flow"]).toEqual({});
    // check the two function calls
    expect(callInfos["test-simple-flow"][0]).toEqual({
      callAnnotations: { caller: "wallet_1" },
      callInfo: {
        args: [],
        contractName: "",
        functionName: "my-test-function",
      },
    });
    expect(callInfos["test-simple-flow"][1]).toEqual({
      callAnnotations: { caller: "wallet_2" },
      callInfo: {
        args: [],
        contractName: "",
        functionName: "my-test-function2",
      },
    });
  });

  it("should parse flow test with bad annotations", () => {
    const [annotations, callInfos] = extractTestAnnotationsAndCalls(
      fs.readFileSync(
        path.join(__dirname, "./contracts/parser-tests/bad-flow.clar"),
        "utf8"
      ),
      simnet
    );
    expect(annotations["test-bad-flow"]).toEqual({});
    expect(callInfos["test-bad-flow"][0]).toEqual({
      callAnnotations: { caller: "wallet_1" },
      callInfo: {
        args: [],
        contractName: "",
        functionName: "my-test-function",
      },
    });
    expect(callInfos["test-bad-flow"].length).toEqual(1);
  });
});
