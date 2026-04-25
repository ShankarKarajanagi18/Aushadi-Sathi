import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home page actions', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /aushadhisaathi/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /scan prescription/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /verify medicine/i })).toBeInTheDocument();
});
