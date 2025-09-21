import { render, screen, waitFor } from '@testing-library/react';
import Health from '../Health';

beforeAll(() => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ ok: true }),
  });
});

it('renderiza e mostra status', async () => {
  render(<Health />);
  expect(screen.getByText(/API:/)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText(/Status:/)).toBeInTheDocument());
});
