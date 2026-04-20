import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["/__mocks__/"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^react-markdown$": "<rootDir>/__tests__/__mocks__/react-markdown.tsx",
  },
  setupFiles: ["<rootDir>/jest.setup.ts"],
};

export default config;
