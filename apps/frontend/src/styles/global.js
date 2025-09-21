import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { height: 100%; margin: 0; padding: 0; }
  body {
    margin: 0;
    background: ${({ theme }) => theme.colors.pageBackground};
    color: ${({theme}) => theme.colors.contrast};
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }
  a { color: ${({theme}) => theme.colors.action}; text-decoration: none; }
  input, button { font-family: inherit; }
`;

