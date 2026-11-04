import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import RequireAuth from './components/RequireAuth.jsx';
import PageLoader from './components/PageLoader.jsx';
import './index.css';

// Pages are lazy loaded: each one is split into its own chunk and only
// downloaded the first time its route renders.
const Login = lazy(() => import('./pages/Login.jsx'));
const HelloWorld = lazy(() => import('./pages/HelloWorld.jsx'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<HelloWorld />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
