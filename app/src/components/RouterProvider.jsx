import { RouterProvider as AriaRouterProvider } from 'react-aria-components';
import { useHref, useNavigate } from 'react-router';

// Lets HeroUI / React Aria links (e.g. <Link href="/register">) navigate with
// React Router instead of doing a full page reload.
export default function RouterProvider({ children }) {
  const navigate = useNavigate();
  return (
    <AriaRouterProvider navigate={navigate} useHref={useHref}>
      {children}
    </AriaRouterProvider>
  );
}
