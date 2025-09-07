import type { Config } from 'jest';
const config: Config = {
  preset: 'ts-jest',                 // transpila TS nos testes
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],          // onde vivem os testes
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverage: true,             // gera cobertura
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/','/dist/','/prisma/']
};
export default config;
