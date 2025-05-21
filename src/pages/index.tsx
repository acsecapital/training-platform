import React from 'react';
import {motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import TidyCalEmbed from '@/components/booking/TidyCalEmbed';
import ParallaxTrianglesBackground from '@/components/home/ParallaxTrianglesBackground';

export default function Home() {
  return (
    <MainLayout transparentHeader={true}>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Subtle backdrop filter for the entire section */}
        <div className="absolute inset-0 backdrop-blur-[1px] bg-white/5 z-10"></div>
        {/* Parallax Triangles Background */}
        <ParallaxTrianglesBackground />

        {/* Content - Mobile-only top padding added here */}
        <div className="relative z-20 w-full px-6 sm:px-12 lg:px-24 xl:px-32 pt-20 sm:pt-0">
          <div className="max-w-[1920px] w-full flex flex-col md:flex-row items-start justify-between">
            {/* Text Content */}
            <motion.div
              className="w-full max-w-4xl relative p-6"
              initial={{opacity: 0, y: 20 }}
              animate={{opacity: 1, y: 0 }}
              transition={{duration: 0.6 }}
            >
              {/* Removed white shield in favor of container background */}
              <motion.div
                className="mb-6 relative z-10"
                initial={{opacity: 0 }}
                animate={{opacity: 1 }}
                transition={{duration: 0.5 }}
              >
                <h2 className="text-lg md:text-xl font-semibold text-primary mb-3 font-heading tracking-wide uppercase">AI-Powered Sales Training</h2>
              </motion.div>

              <motion.h1
                className="mb-5 text-3xl md:text-5xl lg:text-5xl font-extrabold tracking-wide font-heading leading-[1.15] md:leading-[1.10] text-left relative z-10"
                initial={{opacity: 0 }}
                animate={{opacity: 1, y: 0 }}
                transition={{duration: 0.6, delay: 0.2 }}
              >
                <span className="bg-gradient-to-r from-primary to-primary-600 text-transparent bg-clip-text tracking-wide text-[100%]">Master the LIPS Sales System</span>
                <br className="block" />
                <span className="tracking-wide text-[100%]">Close More Deals</span>
                <br className="block" />
                <span className="tracking-wide text-[95%]">Maximize Every Opportunity</span>
              </motion.h1>

              <motion.div
                className="mb-6 relative z-10"
                initial={{opacity: 0 }}
                animate={{opacity: 1 }}
                transition={{duration: 0.6, delay: 0.3 }}
              >
                <p className="text-lg md:text-xl text-neutral-700 font-body font-normal leading-relaxed tracking-normal text-left">
                  Comprehensive training platform with on-demand videos, interactive quizzes, and AI-powered coaching to help you master the art of sales.
                </p>
              </motion.div>

              <motion.p
                className="text-xl md:text-2xl mb-8 text-neutral-800 font-body font-medium leading-relaxed tracking-normal text-left relative z-10"
                initial={{opacity: 0 }}
                animate={{opacity: 1 }}
                transition={{duration: 0.6, delay: 0.6 }}
              >
                Learn how to{' '}
                <strong className="bg-gradient-to-r from-[#9a1a1a] to-[#c83838] text-transparent bg-clip-text font-semibold">
                  {' '}
                  close more deals and maximize every opportunity
                </strong>{' '}
                with our proven sales methodology.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 relative z-10"
                initial={{opacity: 0, y: 20 }}
                animate={{opacity: 1, y: 0 }}
                transition={{duration: 0.6, delay: 0.4 }}
              >
                <Button
                  href="/courses"
                  variant="primary"
                  size="lg"
                  className="px-8 py-4 text-base text-white font-semibold shadow-lg hover:shadow-xl bg-gradient-to-r from-[#0a1155] to-[#1e3bbd] hover:from-primary hover:to-primary-600 hover:text-white transition-all duration-300"
                >
                  Explore Courses
                </Button>

                <Button
                  href="/signup"
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-base font-semibold shadow-md hover:shadow-lg border border-primary text-primary hover:bg-primary-50 hover:text-[#0a1155] transition-all duration-300"
                >
                  Sign Up Free
                </Button>
              </motion.div>

              <motion.p
                className="mt-8 text-base md:text-lg text-neutral-600 border-t border-neutral-200 pt-6 font-body font-normal tracking-normal relative z-10"
                initial={{opacity: 0 }}
                animate={{opacity: 1 }}
                transition={{duration: 0.6, delay: 0.8 }}
              >
                <strong className="bg-gradient-to-r from-primary to-primary-600 text-transparent bg-clip-text font-semibold">Free trial</strong> available, then just{' '}
                <strong className="bg-gradient-to-r from-[#9a1a1a] to-[#c83838] text-transparent bg-clip-text font-semibold">$49.99/month</strong> for complete AI sales management
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="container-custom mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Courses</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Start your journey to sales mastery with our most popular courses designed to help you close more deals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Course Card 1 */}
            <Card className="h-full flex flex-col">
              <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
                <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  4 hours
                </div>
              </div>

              <div className="flex-1 p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold line-clamp-2">LIPS Sales System Fundamentals</h3>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                    Beginner
                  </span>
                </div>

                <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                  Master the fundamentals of the LIPS Sales System to secure attention, investigate problems, present solutions, and state the benefits.
                </p>

                <div className="flex justify-between items-center text-sm text-neutral-500">
                  <span>5 modules</span>
                </div>
              </div>
            </Card>

            {/* Course Card 2 */}
            <Card className="h-full flex flex-col">
              <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
                <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  3 hours
                </div>
              </div>

              <div className="flex-1 p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold line-clamp-2">Effective Sales Communication</h3>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                    Intermediate
                  </span>
                </div>

                <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                  Learn how to communicate effectively with prospects and customers to build trust and close more deals.
                </p>

                <div className="flex justify-between items-center text-sm text-neutral-500">
                  <span>4 modules</span>
                </div>
              </div>
            </Card>

            {/* Course Card 3 */}
            <Card className="h-full flex flex-col">
              <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
                <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  2.5 hours
                </div>
              </div>

              <div className="flex-1 p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold line-clamp-2">Sales Investigation Techniques</h3>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                    Intermediate
                  </span>
                </div>

                <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                  Discover powerful questioning techniques to uncover customer needs and pain points.
                </p>

                <div className="flex justify-between items-center text-sm text-neutral-500">
                  <span>3 modules</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Button href="/courses" variant="outline" size="lg">
              View All Courses
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="bg-gradient-primary py-20 text-white">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Sales Career?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of sales professionals who have already boosted their closing rates and commissions with our training platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              href="/signup"
              variant="success"
              size="lg"
              className="shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]"
            >
              Start Free Trial
            </Button>
            <Button
              href="/courses"
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:bg-opacity-10"
            >
              Explore Courses
            </Button>
          </div>
        </div>
      </div>

  {/* Booking Section */}
  <section className="py-24 relative overflow-hidden border-b border-neutral-100" id="calendar">
    {/* Subtle backdrop */}
    <div className="absolute inset-0 backdrop-blur-[1px] bg-white/5 z-10"></div>

    {/* Parallax Background */}
    <ParallaxTrianglesBackground />

    {/* Content Wrapper */}
    <div className="w-full px-6 sm:px-12 lg:px-24 xl:px-32 relative z-20">
      <div className="max-w-[1920px] mx-auto">
        <div className="mb-16 relative p-6">
          <h2 className="text-xl font-medium text-neutral-500 mb-4">Book a Session</h2>
          <h3 className="text-4xl md:text-3xl font-bold text-neutral-900 mb-6">
            Schedule Your Sales Training Consultation
          </h3>
          <p className="text-lg text-neutral-600 max-w-3xl">
            Take the first step towards transforming your sales approach. Book a consultation with our sales experts to discuss how our LIPS Sales System can help you achieve your goals.
          </p>
        </div>

        {/* Embed Container */}
        <div className="relative z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-neutral-100 p-8 mb-16">
            <TidyCalEmbed path="closercollegett" />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button
            href="/contact"
            variant="primary"
            size="lg"
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-primary-600 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300"
          >
            Contact Us for Custom Training Options
          </Button>
        </div>
      </div>
    </div>
  </section>

      {/* Footer */}
    </MainLayout>
  );
}
