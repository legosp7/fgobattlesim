import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './routes/AppRouter';

/**
 * App root wraps the route table in BrowserRouter.
 */
export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
