import { hexToBytes } from "@stacks/common";
import { Cl, ClarityValue } from "@stacks/transactions";
import { buffer } from "@stacks/transactions/dist/cl";

export type ContractInterfaceTupleEntryType = {
  name: string;
  type: ContractInterfaceAtomType;
};

export type ContractInterfaceAtomType =
  | "none"
  | "int128"
  | "uint128"
  | "bool"
  | "principal"
  | {
      buffer: {
        length: number;
      };
    }
  | {
      "string-utf8": {
        length: number;
      };
    }
  | {
      "string-ascii": {
        length: number;
      };
    }
  | {
      tuple: ContractInterfaceTupleEntryType[];
    }
  | {
      optional: ContractInterfaceAtomType;
    }
  | {
      response: {
        ok: ContractInterfaceAtomType;
        error: ContractInterfaceAtomType;
      };
    }
  | {
      list: {
        type: ContractInterfaceAtomType;
        length: number;
      };
    }
  | "trait_reference";

/**
 * converts a string argument into a ClarityValue using the the type hint
 * @param arg argument value as string
 * @param type should be of type ContractInterfaceAtomType
 * @returns
 */
export function stringToCV(
  arg: string,
  type: ContractInterfaceAtomType
): { type: string; value: ClarityValue } {
  switch (type) {
    case "uint128":
      return { type: "uint", value: Cl.uint(arg.slice(1)) };
    case "int128":
      return { type: "int", value: Cl.int(arg) };
    case "bool":
      return { type: "bool", value: Cl.bool(arg === "true") };
    case "principal":
      const [address, name] = arg.split(".");
      return name
        ? address
          ? { type: "principal", value: Cl.contractPrincipal(address, name) }
          : {
              type: "principal",
              value: Cl.contractPrincipal(simnet.deployer, name),
            }
        : { type: "principal", value: Cl.standardPrincipal(address) };
    case "trait_reference":
      const [addressTrait, nameTrait] = arg.split(".");
      return {
        type: "trait_reference",
        value: Cl.contractPrincipal(
          // handle both fully qualified contract ids and .contract-name
          addressTrait.length > 1 ? addressTrait.substring(1) : simnet.deployer,
          nameTrait
        ),
      };
  }
  const typeDescriptor = Object.keys(type)[0];
  switch (typeDescriptor) {
    case "buffer":
      const hexValue = arg.toLowerCase().startsWith("0x") ? arg.slice(2) : arg;
      return { type: "buffer", value: buffer(hexToBytes(hexValue)) };
    case "string-utf8":
      return { type: "string", value: Cl.stringUtf8(arg) };
    case "string-ascii":
      return { type: "string", value: Cl.stringAscii(arg) };
    case "tuple":
      return {
        type: "tuple",
        value: parseTuple(
          arg,
          (type as { tuple: ContractInterfaceTupleEntryType[] }).tuple
        ),
      };
    case "optional":
      if (arg === "none") {
        return {
          type: "none",
          value: Cl.none(),
        };
      } else {
        return {
          type: "some",
          value: Cl.some(
            stringToCV(
              arg,
              (type as { optional: ContractInterfaceAtomType }).optional
            ).value
          ),
        };
      }
    case "list": {
      const listType = (type as { list: { type: ContractInterfaceAtomType; length: number } }).list;
      // strip outer (list ... )
      const inner = arg.replace(/^\(list\s*/, "").replace(/\)$/, "").trim();
      if (!inner) {
        return { type: "list", value: Cl.list([]) };
      }
      // split list elements respecting nested parens/braces
      const elements: string[] = [];
      let start = 0;
      let depth = 0;
      for (let i = 0; i < inner.length; i++) {
        if (inner[i] === "(" || inner[i] === "{") depth++;
        if (inner[i] === ")" || inner[i] === "}") depth--;
        if ((inner[i] === " " && depth === 0) || i === inner.length - 1) {
          const el = inner.slice(start, i + (i === inner.length - 1 ? 1 : 0)).trim();
          if (el) elements.push(el);
          start = i + 1;
        }
      }
      const values = elements.map(
        (el) => stringToCV(el, listType.type).value
      );
      return { type: "list", value: Cl.list(values) };
    }
    default:
      throw new Error(`Unsupported type ${arg}, ${typeDescriptor}`);
  }
}

function parseTuple(tupleString: string, tupleEntries: any): ClarityValue {
  const tupleItems: { [key: string]: ClarityValue } = {};
  tupleString
    .slice(1, -1)
    .split(",")
    .map((item, index) => {
      const [key, value] = item.split(":").map((s) => s.trim());
      const uintMatch = value.match(/u(\d+)/);
      if (uintMatch) {
        tupleItems[key] = Cl.uint(uintMatch[1]);
      } else {
        tupleItems[key] = stringToCV(value, tupleEntries[index].type).value;
      }
    });

  return Cl.tuple(tupleItems);
}
