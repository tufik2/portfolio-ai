import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';

function HelloWorld() {
  return <h1 className="text-3xl font-bold">Hello World</h1>;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HelloWorld />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
