import React from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import FeedbackButton from '../feedback/FeedbackButton';

type MainLayoutProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  transparentHeader?: boolean;
};

const MainLayout: React.FC<MainLayoutProps> = ({
  transparentHeader = false,
  children,
  title = 'Closer College Training Platform',
  description = 'AI-powered sales training to help professionals close more deals and maximize every opportunity.',
  keywords = 'sales training, AI sales, sales coaching, closer college, sales management',
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header transparent={transparentHeader} />

        {/* Main content with conditional top margin */}
        <main className={`flex-grow ${transparentHeader ? '' : 'mt-20'}`}>
          {children}
        </main>

        <Footer />
        <FeedbackButton source="main_layout" />
      </div>
    </>
  );
};

export default MainLayout;
