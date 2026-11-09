import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/app.css';
import './lib/prefs'; // applies the saved theme and language before the first paint
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
