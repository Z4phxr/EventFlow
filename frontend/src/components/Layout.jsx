import Navbar from './Navbar';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {children}
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>EventFlow Event Management System</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
