import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export const metadata = {
  title: 'FinGuard · Financial Transaction Anomaly Detection',
  description: 'Real-time financial anomaly detection, risk analysis, and fraud investigation dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <div className="main-wrapper">
            <TopBar />
            <main className="main">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
