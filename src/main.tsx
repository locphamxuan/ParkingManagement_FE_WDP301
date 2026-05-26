import React from 'react';
import ReactDOM from 'react-dom/client';
// Seed demo session early before other imports when mock mode enabled
const USE_MOCK = (import.meta.env.VITE_USE_MOCK_DATA as string | undefined) !== 'false';
if (USE_MOCK) {
  try {
    if (!localStorage.getItem('pbms.token')) {
      localStorage.setItem('pbms.token', 'demo-token');
      localStorage.setItem(
        'pbms.user',
        JSON.stringify({
          _id: 'demo-user',
          email: 'staff.test@example.com',
          role: 'staff',
          fullName: 'Staff Demo',
          phone: '+84901234567',
          assignedBuildings: ['bldg-demo-1'],
        })
      );
    }
  } catch (e) {
    // ignore
  }
}

import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@/styles/globals.css';

document.documentElement.classList.add('dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
