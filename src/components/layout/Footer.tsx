import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {useSettings } from '@/context/SettingsContext';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const {settings } = useSettings();

  // Get the footer logo URL from settings, or use default
  const logoUrl = settings.footerLogo?.url || '/assets/logo.png';

  // Footer navigation sections
  const footerSections = [
    {
      title: 'Platform',
      links: [
        {name: 'Home', href: '/'},
        {name: 'Courses', href: '/courses'},
        {name: 'My Learning', href: '/my-learning'},
        {name: 'Verify Certificate', href: '/verify-certificate'},
      ],
  },
    {
      title: 'Legal',
      links: [
        {name: 'Contact', href: 'http://localhost:3000/#contact'},
        {name: 'Privacy Policy', href: 'http://localhost:3000/privacy-policy'},
        {name: 'Terms of Service', href: 'http://localhost:3000/terms-of-service'},
      ],
  },
    {
      title: 'Resources',
      links: [
        {name: 'Blog', href: '/blog'},
        {name: 'FAQ', href: '/faq'},
        {name: 'Support', href: '/support'},
      ],
  },
  ];

  // Social media links
  const socialLinks = [
    {name: 'Facebook', href: 'https://facebook.com', icon: '/assets/icons/facebook.svg'},
    {name: 'Twitter', href: 'https://twitter.com', icon: '/assets/icons/twitter.svg'},
    {name: 'LinkedIn', href: 'https://linkedin.com', icon: '/assets/icons/linkedin.svg'},
    {name: 'Instagram', href: 'https://instagram.com', icon: '/assets/icons/instagram.svg'},
  ];

  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <div className="w-full px-6 sm:px-12 lg:px-24 xl:px-32 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-[1920px] mx-auto">
          {/* Navigation Sections - Left Side */}
          {footerSections.map((section) => (
            <div key={section.title} className="md:col-span-2">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-neutral-600 hover:text-primary transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Logo and Description - Right Side */}
          <div className="md:col-span-6 flex flex-col items-end">
            <Link href="/" className="inline-block mb-4">
              <div className="relative h-10 w-40">
                {/* Use a fallback for the logo */}
                <div className="text-neutral-900 font-heading font-bold text-xl">
                  Closer College
                </div>
              </div>
            </Link>
            <p className="text-neutral-600 mb-6 max-w-md text-right">
              Closer College provides AI-powered sales training to help professionals close more deals and maximize every opportunity.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-neutral-200 mt-12 pt-8 flex flex-col items-center max-w-[1920px] mx-auto">
          <div className="flex space-x-6 mb-6">
            <Link href="/terms-of-service" className="text-neutral-500 hover:text-primary text-sm transition-colors duration-200">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="text-neutral-500 hover:text-primary text-sm transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-neutral-500 hover:text-primary text-sm transition-colors duration-200">
              Contact Us
            </Link>
          </div>
          <p className="text-neutral-500 text-sm text-center w-full">
            Closer College TT ©, The LIPS Sales System ©, LIPS © {currentYear}, Trinidad and Tobago and Internationally - All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
