import { describe, it, expect } from 'vitest';
import { router } from '../index';

describe('Router Configuration', () => {
  it('deve exportar router corretamente', () => {
    expect(router).toBeDefined();
    expect(router).toHaveProperty('routes');
  });

  it('deve ter rotas configuradas', () => {
    expect(router.routes).toBeDefined();
    expect(Array.isArray(router.routes)).toBe(true);
  });

  it('deve ter rota de login', () => {
    const loginRoute = router.routes.find(route => route.path === '/login');
    expect(loginRoute).toBeDefined();
  });

  it('deve ter rota de dashboard', () => {
    const dashboardRoute = router.routes.find(route => route.path === '/dashboard');
    expect(dashboardRoute).toBeDefined();
  });

  it('deve ter rota catch-all (*)', () => {
    const catchAllRoute = router.routes.find(route => route.path === '*');
    expect(catchAllRoute).toBeDefined();
  });
});

