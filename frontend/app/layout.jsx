import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Financial Anomaly System',
  description: 'Transaction anomaly detection and investigation dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="side">
            <div className="brand">◈ FinGuard<br /><span className="small muted">Anomaly & Investigation</span></div>
            <nav className="nav">
              <Link href="/">Dashboard</Link>
              <Link href="/transactions">Transactions</Link>
              <Link href="/alerts">Alerts</Link>
              <Link href="/cases">Investigation Cases</Link>
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
