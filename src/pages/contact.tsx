import React from 'react';
import Head from 'next/head';
import MainLayout from '@/components/layout/MainLayout';
import ContactForm from '@/components/contact/ContactForm';

const Contact = () => {
  return (
    <MainLayout title="Contact Us | Training Platform">
      <Head>
        <meta
          name="description"
          content="Contact us for sales training and coaching services. Schedule a consultation with our experts."
        />
      </Head>

      {/* Hero section */}
      <div className="bg-gradient-primary py-20 text-white">
        <div className="w-full px-6 sm:px-12 lg:px-24 xl:px-32">
          <div className="max-w-[1920px] mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Enterprise Solutions</h1>
            <p className="text-lg max-w-3xl">
              Looking to implement the LIPS Sales System across your organization?
              Need a customized training solution for your sales team?
              Contact us to discuss how we can help your company achieve breakthrough sales results.
            </p>
          </div>
        </div>
      </div>

      {/* Contact form */}
      <ContactForm />
    </MainLayout>
  );
};

export default Contact;
