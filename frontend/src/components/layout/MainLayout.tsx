import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  transparentHeader?: boolean;
  hideFooter?: boolean;
}

export function MainLayout({
  children,
  transparentHeader = false,
  hideFooter = false
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header transparent={transparentHeader} />
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default MainLayout;
