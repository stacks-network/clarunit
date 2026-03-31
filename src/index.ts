import { generateUnitTests } from "./clarunit-generator";
import { generateFlowTests } from "./clarunit-flow-generator";
import { Simnet } from "@stacks/clarinet-sdk";

export function clarunit(simnet: Simnet) {
	generateUnitTests(simnet);
	generateFlowTests(simnet);
}
