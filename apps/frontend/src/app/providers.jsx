import React from 'react';
import { ThemeProvider } from 'styled-components';
import GlobalStyle from '../styles/global';   // deve exportar default
import { theme } from '../styles/theme';      // pode ser default ou named, ajuste se preciso
import { AuthProvider } from '../shared/context/AuthContext.jsx';

export default function Providers({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <GlobalStyle />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
