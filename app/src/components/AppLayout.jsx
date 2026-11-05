import { Outlet } from 'react-router';
import LateralDrawer from './lateralDrawer/LateralDrawer.jsx';

/**
 * Frame for every signed-in page: the lateral drawer on the left and the
 * current page on the right.
 */
export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <LateralDrawer />
      <main className="min-w-0 flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
