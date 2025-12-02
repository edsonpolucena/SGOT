import { expect, vi } from 'vitest';
import React from 'react';
import * as matchers from '@testing-library/jest-dom/matchers';

global.React = React;

expect.extend(matchers);

global.URL.createObjectURL = () => 'blob:mock-url';
global.URL.revokeObjectURL = () => {};
