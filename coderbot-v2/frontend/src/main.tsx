import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './Components/coderbot/app/i18n';

createRoot(document.getElementById("root")!).render(<App />);
