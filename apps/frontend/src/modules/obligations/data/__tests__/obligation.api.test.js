import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as obligationApi from '../obligation.api';
import http from '../../../../shared/services/http.js';

vi.mock('../../../../shared/services/http.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

describe('Obligation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('deve fazer GET para /api/obligations com params', async () => {
      const mockResponse = { data: [{ id: '1', title: 'Test' }] };
      http.get.mockResolvedValue(mockResponse);

      const result = await obligationApi.list({ status: 'PENDING' });

      expect(http.get).toHaveBeenCalledWith('/api/obligations', {
        params: { status: 'PENDING' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getById', () => {
    it('deve fazer GET para /api/obligations/:id', async () => {
      const mockResponse = { data: { id: '1', title: 'Test' } };
      http.get.mockResolvedValue(mockResponse);

      const result = await obligationApi.getById('1');

      expect(http.get).toHaveBeenCalledWith('/api/obligations/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('create', () => {
    it('deve fazer POST para /api/obligations', async () => {
      const payload = { title: 'New Obligation', amount: 1000 };
      const mockResponse = { data: { id: '1', ...payload } };
      http.post.mockResolvedValue(mockResponse);

      const result = await obligationApi.create(payload);

      expect(http.post).toHaveBeenCalledWith('/api/obligations', payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('deve fazer PUT para /api/obligations/:id', async () => {
      const payload = { title: 'Updated Obligation' };
      const mockResponse = { data: { id: '1', ...payload } };
      http.put.mockResolvedValue(mockResponse);

      const result = await obligationApi.update('1', payload);

      expect(http.put).toHaveBeenCalledWith('/api/obligations/1', payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('remove_', () => {
    it('deve fazer DELETE para /api/obligations/:id', async () => {
      const mockResponse = { data: { success: true } };
      http.delete.mockResolvedValue(mockResponse);

      const result = await obligationApi.remove_('1');

      expect(http.delete).toHaveBeenCalledWith('/api/obligations/1');
      expect(result).toEqual(mockResponse);
    });
  });
});

