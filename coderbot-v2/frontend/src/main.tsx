import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './components/coderbot/app/i18n.ts';
import { ThemeProvider } from "@/context/ThemeContext";

// SurveyJS CSS
import 'survey-core/survey-core.min.css';
import 'survey-creator-core/survey-creator-core.min.css';

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
