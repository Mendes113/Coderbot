import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './components/coderbot/app/i18n.ts';

createRoot(document.getElementById("root")!).render(<App />);
