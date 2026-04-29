import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app loading shell', () => {
  render(<App />);
  const appTitle = screen.getByText(/grimguff tracker/i);
  expect(appTitle).toBeInTheDocument();
});
