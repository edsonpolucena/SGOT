import request from 'supertest';
import { app } from '../server';

describe('GET /health', () => {
  it('retorna ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
