/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/entities/**/lib/**/*.ts',
    'src/features/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          strict: true,
          esModuleInterop: true,
          resolveJsonModule: true,
          jsx: 'react-jsx',
          types: ['jest'],
          paths: {
            '@/app/*': ['src/app/*'],
            '@/screens/*': ['src/screens/*'],
            '@/widgets/*': ['src/widgets/*'],
            '@/features/*': ['src/features/*'],
            '@/entities/*': ['src/entities/*'],
            '@/shared/*': ['src/shared/*'],
            '@/*': ['src/*'],
          },
          baseUrl: '.',
        },
      },
    ],
  },
};
