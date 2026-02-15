import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BannerZone from '@/components/BannerZone';

const Layout = () => {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Header />
      {/* Banner: Header zone — thin strip below nav */}
      <BannerZone zona="HEADER" className="w-full" layout="single" />
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Banner: Footer zone — above footer */}
      <BannerZone zona="FOOTER" className="container mx-auto px-4 mb-4" layout="carousel" />
      <Footer />
    </div>
  );
};

export default Layout;
