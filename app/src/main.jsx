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
const HelloWorld = lazy(() => import('./pages/HelloWorld.jsx'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <RouterProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<HelloWorld />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </RouterProvider>
    </BrowserRouter>
  </StrictMode>,
);
