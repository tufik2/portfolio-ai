import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import RequireAuth from './components/RequireAuth.jsx';
import PageLoader from './components/PageLoader.jsx';
import RouterProvider from './components/RouterProvider.jsx';
import './index.css';

// Pages are lazy loaded: each one is split into its own chunk and only
// downloaded the first time its route renders.
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
const AppLayout = lazy(() => import('./components/AppLayout.jsx'));
const Home = lazy(() => import('./pages/Home.jsx'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <RouterProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </RouterProvider>
    </BrowserRouter>
  </StrictMode>,
);
