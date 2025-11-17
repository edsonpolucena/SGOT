import { expect, vi } from 'vitest';
import React from 'react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Garantir que React esteja disponível globalmente para JSX nos testes
global.React = React;

// Estender expect do Vitest com matchers do jest-dom
expect.extend(matchers);

// Mock URL.createObjectURL e revokeObjectURL
global.URL.createObjectURL = () => 'blob:mock-url';
global.URL.revokeObjectURL = () => {};
