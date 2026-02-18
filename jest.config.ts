import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "tsconfig.spec.json" }],
  },
  collectCoverageFrom: [
    "**/*.ts",
    "!**/*.spec.ts",
    "!**/*.interface.ts",
    "!**/index.ts",
    "!main.ts",
    "!app.module.ts",
    "!app.controller.ts",
    "!**/*.entity.ts",
  ],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
};

export default config;
