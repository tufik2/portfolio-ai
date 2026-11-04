import { Navigate, Outlet } from 'react-router';
import AuthCtrl from '../controllers/AuthCtrl.js';

export default function RequireAuth() {
  if (!AuthCtrl.getToken()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
