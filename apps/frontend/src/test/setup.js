import { expect } from 'vitest';
import '@testing-library/jest-dom';

// Mock URL.createObjectURL e revokeObjectURL
global.URL.createObjectURL = () => 'blob:mock-url';
global.URL.revokeObjectURL = () => {};
