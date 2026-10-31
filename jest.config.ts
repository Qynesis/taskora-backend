import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['apps/**/src/**/*.ts', '!apps/**/src/main.ts', '!**/*.module.ts'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/apps/api/test/jest-env-setup.ts'],
  roots: ['<rootDir>/apps/', '<rootDir>/packages/'],
  moduleNameMapper: {
    '^@app/shared-types(.*)$': '<rootDir>/packages/shared-types/src$1',
  },
};

export default config;
