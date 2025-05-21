import React, {useState } from 'react';
import {motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import {countries } from '@/utils/countries';

const ContactForm: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    country: '',
    message: ''
});

  // Loading and success states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
  }));
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      console.log('Submitting form data:', formData);

      const response = await fetch('/api/enterprise-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
        body: JSON.stringify(formData),
    });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send message');
    }

      // Reset form and show success message
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        country: '',
        message: ''
      });
      setSubmitSuccess(true);
  } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
  } finally {
      setIsSubmitting(false);
  }
};

  return (
    <section className="relative py-24 overflow-hidden bg-white" id="contact-form">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-neutral-50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-6 sm:px-12 lg:px-24 xl:px-32">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{opacity: 0, y: 20 }}
              whileInView={{opacity: 1, y: 0 }}
              viewport={{once: true }}
              transition={{duration: 0.6 }}
            >
              <h2 className="text-2xl font-medium text-neutral-500 mb-4">Corporate Training</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
                Elevate Your Entire Sales Organization
              </h3>

              <p className="text-lg text-neutral-600 mb-8">
                Our enterprise solutions provide comprehensive training for your entire sales team.
                Get a customized implementation of the LIPS Sales System tailored to your industry and business model.
              </p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-neutral-900 mb-1">Email</h4>
                    <a href="mailto:info@closercollegett.com" className="text-primary hover:underline">sales@closercollegett.com</a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-neutral-900 mb-1">Phone</h4>
                    <a href="tel:+18687573570" className="text-primary hover:underline">+1 (868) 757-3570</a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{opacity: 0, y: 20 }}
              whileInView={{opacity: 1, y: 0 }}
              viewport={{once: true }}
              transition={{duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg p-8 shadow-sm border border-neutral-100"
            >
              <h4 className="text-2xl font-bold text-neutral-900 mb-6">Request Enterprise Information</h4>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Your first name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Your last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-neutral-700 mb-1">Company</label>
                    <input
                      type="text"
                      id="company"
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Your company"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-neutral-700 mb-1">Country</label>
                    <select
                      id="country"
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      value={formData.country}
                      onChange={handleChange}
                    >
                      <option value="">Select your country</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Request Enterprise Consultation'}
                  </Button>

                  {submitSuccess && (
                    <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg">
                      Thank you for your interest in our enterprise solutions! Our team will review your inquiry and contact you within 1-2 business days to discuss how we can help your organization.
                    </div>
                  )}

                  {submitError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-lg">
                      {submitError}
                    </div>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
