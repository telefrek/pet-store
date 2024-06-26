module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/**/*.test.tsx"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["<rootDir>/packages/*.{tsx,ts,jsx}"],
  coveragePathIgnorePatterns: ["jest.*.config.js", "/node_modules/", "/dist/"],
  moduleNameMapper: {
    "^@telefrek/(.*)$": "<rootDir>/packages/$1/",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
};
