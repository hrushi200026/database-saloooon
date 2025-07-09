import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@/components/theme-provider'
import { initDatabase } from '@/lib/database'
import App from './App.tsx'
import './index.css'

// Initialize database when the app starts
initDatabase().then(() => {
  console.log('Database initialized successfully');
}).catch((error) => {
  console.error('Failed to initialize database:', error);
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);
