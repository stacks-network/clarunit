export const getCaller = (annotations: any, accounts: Map<string, string>) => {
  return annotations.caller && typeof annotations.caller === "string"
    ? annotations.caller[0] === "'"
      ? `${(annotations.caller as string).substring(1)}`
      : accounts.get(annotations.caller)!
    : accounts.get("deployer")!;
};
