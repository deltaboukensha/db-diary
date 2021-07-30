import type { Config } from "@jest/types"

export default async (): Promise<Config.InitialOptions> => {
  return {
    verbose: true,
    transform: { "^.+\\.ts?$": "ts-jest" },
    testEnvironment: "node",
    testRegex: ".+.test.ts$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  }
}
