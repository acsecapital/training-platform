import React, {useState, useEffect } from 'react';
import Link from 'next/link';
import {useRouter } from 'next/router';
import {motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import {useSettings } from '@/context/SettingsContext';
import {useAuth } from '@/context/AuthContext';
import NotificationCenterNew from '../notifications/NotificationCenterNew';

interface HeaderProps {
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({transparent = false }) => {
  // State variables
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeItem, setActiveItem] = useState('/');
  const {settings } = useSettings();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const {user, logout } = useAuth();
  const isAuthenticated = !!user;

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
  } catch (error) {
      console.error('Logout failed:', error);
  }
};

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
}, []);

  // Update logo URL when settings change
  useEffect(() => {
    if (settings.logo?.url) {
      setLogoUrl(settings.logo.url);
      setLogoError(false); // Reset error state when we get a new URL
  } else {
      // Fallback to a direct URL if no logo in settings
      const directUrl = 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-00697788-5c2c3.appspot.com/o/media%2Fc218e6e6-75a6-47c7-b101-df0470711db2.png?alt=media';
      setLogoUrl(directUrl);
  }
}, [settings]);

  // Handle scroll event to change header appearance
  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
  };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
}, [isClient]);

  // Update active item based on current route
  useEffect(() => {
    if (router.isReady) {
      // Set the active item based on the current path
      const path = router.pathname;
      setActiveItem(path);
  }
}, [router.isReady, router.pathname]);

  // Navigation items
  const navItems = [
    {name: 'Home', href: '/'},
    {name: 'Courses', href: '/courses'},
    {name: 'My Learning', href: '/my-learning'},
    {name: 'Certificates', href: '/certificates'},
  ];

  // Function to determine the background transparency
  const getHeaderBackground = () => {
    if (!isClient) return 'bg-white shadow-sm backdrop-blur-sm'; // Default to solid if not client
    if (transparent && !isScrolled) return 'transparent'; // Transparent only if allowed and at top
    return 'bg-white shadow-sm backdrop-blur-sm'; // Always solid on other pages
};

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-4 pt-6 ${getHeaderBackground()}`}
    >
      <div className="w-full px-6 sm:px-12 lg:px-24 xl:px-32 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="relative z-10 group">
          <motion.div
            className="flex items-center"
            whileHover={{scale: 1.02 }}
            transition={{type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="relative h-12 w-48 pt-2">
              {isClient && logoUrl && !logoError ? (
                <img
                  src={logoUrl}
                  alt="Closer College"
                  className="object-contain mx-auto"
                  onError={() => {
                    setLogoError(true);
                }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center">
                  <div className="overflow-hidden transition-all duration-300">
                    <span className="text-neutral-900 font-heading font-bold text-xl">
                      Closer College <span className="text-xs text-neutral-600 border-l border-neutral-300 pl-2">Training Platform</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <motion.div key={item.name} className="relative px-2">
              <Link
                href={item.href}
                className={`font-body py-2 px-3 inline-block transition-all duration-300 ${
                  activeItem === item.href ? 'text-secondary font-medium' : 'text-neutral-600 hover:text-primary'
              }`}
                onClick={() => setActiveItem(item.href)}
              >
                {item.name}
              </Link>
              {activeItem === item.href && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-primary rounded-full mx-3"
                  layoutId="navbar-indicator"
                  transition={{type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.div>
          ))}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center ml-4 space-x-4">
          {isAuthenticated ? (
            <>
              <NotificationCenterNew />
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="px-4 py-2"
              >
                Logout
              </Button>
              <Button
                href="/profile"
                variant="primary"
                size="sm"
                className="px-4 py-2"
              >
                Profile
              </Button>
            </>
          ) : (
            <>
              <motion.div
                whileHover={{scale: 1.05 }}
                whileTap={{scale: 0.95 }}
              >
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-[#0a1155] to-[#1e3bbd] hover:from-primary hover:to-primary-600 text-white hover:text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Login
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <motion.button
          className="md:hidden z-10 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          whileTap={{scale: 0.9 }}
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <motion.span
              className={`w-full h-0.5 bg-primary transform transition-all duration-300 origin-center`}
              animate={{
                rotate: isMobileMenuOpen ? 45 : 0,
                y: isMobileMenuOpen ? 9 : 0
            }}
            />
            <motion.span
              className={`w-full h-0.5 bg-primary transition-all duration-300`}
              animate={{
                opacity: isMobileMenuOpen ? 0 : 1,
                x: isMobileMenuOpen ? 20 : 0
            }}
            />
            <motion.span
              className={`w-full h-0.5 bg-primary transform transition-all duration-300 origin-center`}
              animate={{
                rotate: isMobileMenuOpen ? -45 : 0,
                y: isMobileMenuOpen ? -9 : 0
            }}
            />
          </div>
        </motion.button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-white/95 backdrop-blur-sm z-40 md:hidden overflow-hidden"
            initial={{opacity: 0, height: 0 }}
            animate={{opacity: 1, height: "100vh" }}
            exit={{opacity: 0, height: 0 }}
            transition={{duration: 0.4, ease: "easeInOut" }}
          >
            <div className="flex flex-col h-full pt-24 px-6">
              <motion.nav
                className="flex flex-col space-y-4 py-8"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                  }
                }
              }}
              >
                {navItems.map((item) => (
                  <motion.div
                    key={item.name}
                    variants={{
                      hidden: {opacity: 0, y: 20 },
                      visible: {opacity: 1, y: 0 }
                  }}
                  >
                    <Link
                      href={item.href}
                      className={`text-xl font-heading block py-3 px-4 rounded-lg transition-colors ${
                        activeItem === item.href ? 'text-white bg-gradient-primary font-medium' : 'text-primary hover:bg-primary-50'
                    }`}
                      onClick={() => {
                        setActiveItem(item.href);
                        setIsMobileMenuOpen(false);
                    }}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  variants={{
                    hidden: {opacity: 0, y: 20 },
                    visible: {opacity: 1, y: 0 }
                }}
                  className="pt-4"
                >
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/notifications"
                        className="block w-full text-center bg-white border border-primary text-primary hover:bg-primary-50 px-6 py-3 rounded-lg font-medium transition-all duration-300 mb-3"
                        onClick={() => {
                          setActiveItem('/notifications');
                          setIsMobileMenuOpen(false);
                      }}
                      >
                        Notifications
                      </Link>
                      <button
                        className="block w-full text-center bg-white border border-primary text-primary hover:bg-primary-50 px-6 py-3 rounded-lg font-medium transition-all duration-300 mb-3"
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                      }}
                      >
                        Logout
                      </button>
                      <Link
                        href="/profile"
                        className="block w-full text-center bg-gradient-to-r from-[#0a1155] to-[#1e3bbd] hover:from-primary hover:to-primary-600 text-white hover:text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                        onClick={() => {
                          setActiveItem('/profile');
                          setIsMobileMenuOpen(false);
                      }}
                      >
                        Profile
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="block w-full text-center bg-gradient-to-r from-[#0a1155] to-[#1e3bbd] hover:from-primary hover:to-primary-600 text-white hover:text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                      onClick={() => {
                        setActiveItem('/login');
                        setIsMobileMenuOpen(false);
                    }}
                    >
                      Login
                    </Link>
                  )}
                </motion.div>
              </motion.nav>

              {/* Decorative elements */}
              <div className="absolute bottom-0 left-0 w-full h-64 opacity-10 pointer-events-none">
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary-100 blur-3xl"></div>
                <div className="absolute bottom-20 right-0 w-64 h-64 rounded-full bg-secondary-100 blur-3xl"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;