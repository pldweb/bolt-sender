import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import App from './App.jsx';
import './assets/index.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);