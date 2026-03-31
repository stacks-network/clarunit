import { ClarityValue } from "@stacks/transactions";
import { stringToCV } from "./string-to-cv";
import { Simnet } from "@hirosystems/clarinet-sdk";
export type FunctionAnnotations = { [key: string]: string | boolean };
export type FunctionBody = {
  callAnnotations: FunctionAnnotations[];
  callInfo: CallInfo;
}[];

export type ContractCall = {
  callAnnotations: FunctionAnnotations;
  callInfo: CallInfo;
};

export type CallInfo = {
  contractName: string;
  functionName: string;
  args: { type: string; value: ClarityValue }[];
};

const functionRegex =
  /^([ \t]{0,};;[ \t]{0,}@[^()]+?)\n[ \t]{0,}\(define-public[\s]+\((.+?)[ \t|)]/gm;
const annotationsRegex = /^;;[ \t]{1,}@([a-z-]+)(?:$|[ \t]+?(.+?))$/;

const callRegex =
  /\n*^([ \t]{0,};;[ \t]{0,}@[\s\S]+?)\n[ \t]{0,}(\((?:[^()]*|\((?:[^()]*|\([^()]*\))*\))*\))/gm;

/**
 * Parser function for flow unit tests.
 *
 * Flow unit tests can be used for tx calls where
 * the tx-sender should be equal to the contract-caller.
 *
 * Takes the whole contract source and returns an object containing
 * the function annotations and function bodies for each function.
 * @param contractSource
 * @returns
 */
export function extractTestAnnotationsAndCalls(
  contractSource: string,
  simnet: Simnet
) {
  const functionAnnotations: any = {};
  const functionBodies: any = {};
  contractSource = contractSource.replace(/\r/g, "");
  const matches1 = contractSource.matchAll(functionRegex);

  let indexStart: number = -1;
  let headerLength: number = 0;
  let indexEnd: number = -1;
  let lastFunctionName: string = "";
  let contractCalls: {
    callAnnotations: FunctionAnnotations;
    callInfo: CallInfo;
  }[];
  for (const [functionHeader, comments, functionName] of matches1) {
    if (functionName.substring(0, 5) !== "test-") continue;
    functionAnnotations[functionName] = {};
    const lines = comments.split("\n");
    for (const line of lines) {
      const [, prop, value] = line.match(annotationsRegex) || [];
      if (prop) functionAnnotations[functionName][prop] = value ?? true;
    }
    if (indexStart < 0) {
      indexStart = contractSource.indexOf(functionHeader);
      headerLength = functionHeader.length;
      lastFunctionName = functionName;
    } else {
      indexEnd = contractSource.indexOf(functionHeader);
      const lastFunctionBody = contractSource.substring(
        indexStart + headerLength,
        indexEnd
      );

      // add contracts calls in functions body for last function
      contractCalls = extractContractCalls(lastFunctionBody, simnet);

      functionBodies[lastFunctionName] = contractCalls;
      indexStart = indexEnd;
      headerLength = functionHeader.length;
      lastFunctionName = functionName;
    }
  }
  const lastFunctionBody = contractSource.substring(indexStart + headerLength);
  contractCalls = extractContractCalls(lastFunctionBody, simnet);
  functionBodies[lastFunctionName] = contractCalls;

  return [functionAnnotations, functionBodies];
}

/**
 * Takes a string and returns an array of objects containing
 * the call annotations and call info within the function body.
 *
 * The function body should look like this
 * (begin
 *   ... lines of code..
 *   (ok true))
 *
 * Only two lines of code are accepted:
 * 1. (unwrap! (contract-call? .contract-name function-name args))
 * 2. (try! (function-name))
 * @param lastFunctionBody
 * @returns
 */
export function extractContractCalls(lastFunctionBody: string, simnet: Simnet) {
  const calls = lastFunctionBody.matchAll(callRegex);
  const contractCalls: ContractCall[] = [];
  for (const [, comments, call] of calls) {
    const callAnnotations: FunctionAnnotations = {};
    const lines = comments.split("\n");
    for (const line of lines) {
      const [, prop, value] = line.trim().match(annotationsRegex) || [];
      if (prop) callAnnotations[prop] = value ?? true;
    }
    // try to extract call info from (unwrap! (contract-call? ...))
    let callInfo = extractUnwrapInfo(call, simnet, callAnnotations);
    if (!callInfo) {
      // try to extract call info from (try! (my-function))
      callInfo = extractTryInfo(call);
    }
    if (callInfo) {
      contractCalls.push({ callAnnotations, callInfo });
    } else {
      throw new Error(`Could not extract call info from ${call}`);
    }
  }
  return contractCalls;
}

/**
 * handle (unwrap! (contract-call? ...)) statements
 * @param statement
 * @returns
 */
function extractUnwrapInfo(
  statement: string,
  simnet: Simnet,
  callAnnotations: FunctionAnnotations
): CallInfo | null {
  // Match contract-call header only (contract + function name).
  // Args are extracted separately using balanced-paren counting
  // to avoid catastrophic backtracking with nested list/tuple args.
  const match = statement.match(
    /\(unwrap!\s+\(contract-call\?\s+(?:\.(\S+)|'(\S+))\s+(\S+)/m
  );
  if (!match) return null;

  // Find args: everything between the function name and the balanced
  // closing paren of (contract-call? ...)
  const headerEnd = match.index! + match[0].length;
  let depth = 2; // we're inside (unwrap! (contract-call? ...
  let contractCallClose = -1;
  for (let i = headerEnd; i < statement.length; i++) {
    if (statement[i] === "(") depth++;
    if (statement[i] === ")") depth--;
    if (depth === 1) {
      // found closing ) of (contract-call? ...)
      contractCallClose = i;
      break;
    }
  }
  if (contractCallClose === -1) return null;
  const argsRaw = statement.slice(headerEnd, contractCallClose);

  // match[1] is the contract address,
  const [contractAddress, contractName] = match[2]
    ? match[2].split(".")
    : [simnet.deployer, match[1]];
  const functionName = match[3];
  const argStrings = splitArgs(argsRaw);
  let fn: any;
  simnet.getContractsInterfaces().forEach((contract, contractFQN) => {
    const [ctrAddress, ctrName] = contractFQN.split(".");
    if (contractAddress === ctrAddress && ctrName === contractName) {
      fn = contract.functions.find((f) => f.name === functionName);
      if (!fn) {
        throw `function ${functionName} not found in contract ${contractName}`;
      }
    }
  });
  if (!fn) {
    if (callAnnotations["type-hints"]) {
      fn = {
        args: (callAnnotations["type-hints"] as string)
          .split(",")
          .map((s) => ({ type: parseTypeHint(s.trim()) })),
      };
    } else {
      throw `function ${functionName} of ${contractName} not found in Clarinet toml and no type-hints provided`;
    }
  }
  const args = fn.args.map((arg: any, index: number) =>
    stringToCV(argStrings[index], arg.type)
  );

  return {
    contractName: contractAddress
      ? `${contractAddress}.${contractName}`
      : contractName,
    functionName,
    args,
  };
}

function extractTryInfo(statement: string) {
  const match = statement.match(/\(try! \((.+?)\)\)/);
  if (!match) return null;
  return {
    contractName: "",
    functionName: match[1],
    args: [],
  };
}

// take a string containing function arguments and
// split them correctly into an array of argument strings
function splitArgs(argString: string): string[] {
  const splitArgs: string[] = [];
  let argStart = 0;
  let brackets = 0; // curly brackets
  let rbrackets = 0; // round brackets

  for (let i = 0; i < argString.length; i++) {
    const char = argString[i];

    if (char === "{") brackets++;
    if (char === "}") brackets--;
    if (char === "(") rbrackets++;
    if (char === ")") rbrackets--;

    const isWhitespace = char === " " || char === "\n" || char === "\t" || char === "\r";
    const atLastChar = i === argString.length - 1;
    if ((isWhitespace && brackets === 0 && rbrackets === 0) || atLastChar) {
      const newArg = argString.slice(argStart, i + (atLastChar ? 1 : 0));
      if (newArg.trim()) {
        splitArgs.push(newArg.trim());
      }
      argStart = i + 1;
    }
  }

  return splitArgs;
}

/**
 * Parse type hint string into ContractInterfaceAtomType
 * @param typeHint string like "uint128", "(optional uint128)", etc.
 * @returns ContractInterfaceAtomType
 */
function parseTypeHint(typeHint: string): any {
  typeHint = typeHint.trim();

  // Handle parentheses wrapped types like (optional uint128)
  if (typeHint.startsWith("(") && typeHint.endsWith(")")) {
    const inner = typeHint.slice(1, -1).trim();
    const parts = inner.split(" ");

    if (parts[0] === "optional") {
      return {
        optional: parseTypeHint(parts.slice(1).join(" ")),
      };
    }

    // Add other complex type handling as needed
  }

  // Handle simple types
  switch (typeHint) {
    case "uint":
    case "uint128":
      return "uint128";
    case "int":
    case "int128":
      return "int128";
    case "bool":
      return "bool";
    case "principal":
      return "principal";
    case "trait_reference":
      return "trait_reference";
    case "none":
      return "none";
    default:
      throw new Error(`Unsupported type hint: ${typeHint}`);
  }
}
