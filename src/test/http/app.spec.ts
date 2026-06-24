import request from 'supertest';

import { app } from '../../app';

describe('app', () => {
  it('retorna o health check com CORS', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.body.data).toEqual({ status: 'ok' });
  });

  it('responde ao preflight CORS', async () => {
    const response = await request(app)
      .options('/api/v1/cadastradores')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });
});
