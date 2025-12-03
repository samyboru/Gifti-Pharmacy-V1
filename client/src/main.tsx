// File Location: client/src/main.tsx
import { createRoot } from 'react-dom/client';
import { Suspense } from 'react';
import './index.css';
import 'react-datepicker/dist/react-datepicker.css'
import App from './App.tsx';
import './i18n'; // This line correctly imports the configuration

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

root.render(
  <Suspense fallback="Loading...">
    <App />
  </Suspense>
);