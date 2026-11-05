import { useState } from 'react';
import { useNavigate } from 'react-router';
import AuthCtrl from '../../controllers/AuthCtrl.js';
import LogoutIcon from '../../media/icons/LogoutIcon.jsx';
import LateralDrawerButton from './LateralDrawerButton.jsx';

/**
 * Fixed 250px bar on the left of every signed-in page. Always visible.
 */
export default function LateralDrawer() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await AuthCtrl.logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside
      aria-label="Main navigation"
      className="sticky top-0 flex h-screen w-[250px] shrink-0 flex-col items-center justify-between border-r border-border bg-surface px-2 py-4"
    >
      <div>

      </div>

      <LateralDrawerButton
        text="Log out"
        pendingText="Logging out…"
        icon={<LogoutIcon />}
        isPending={isLoggingOut}
        onPress={handleLogout}
      />
    </aside>
  );
}
