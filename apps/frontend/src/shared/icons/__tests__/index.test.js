import { describe, it, expect } from 'vitest';
import * as Icons from '../index';

describe('Icons', () => {
  it('deve exportar ícones do react-icons', () => {
    expect(Icons.FaEye).toBeDefined();
    expect(Icons.FaDownload).toBeDefined();
    expect(Icons.FaTrashAlt).toBeDefined();
  });

  it('deve ter múltiplos ícones exportados', () => {
    const exportedIcons = Object.keys(Icons);
    expect(exportedIcons.length).toBeGreaterThan(0);
  });
});

