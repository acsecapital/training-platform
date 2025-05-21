import React, {useState } from 'react';
import Button from '@/components/ui/Button';
import {toast } from 'react-hot-toast';

interface ShareCertificateModalProps {
  certificateId: string;
  certificateCode: string;
  studentName: string;
  courseName: string;
  pdfUrl: string;
  verificationUrl: string;
  onClose: () => void;
}

const ShareCertificateModal: React.FC<ShareCertificateModalProps> = ({
  certificateId,
  certificateCode,
  studentName,
  courseName,
  pdfUrl,
  verificationUrl,
  onClose
}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(`I'd like to share my certificate for completing ${courseName}.`);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'social' | 'link'>('email');

  // Generate sharing links
  const shareUrl = verificationUrl || `${window.location.origin}/verify-certificate/${certificateCode}`;
  
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`Certificate of Completion: ${courseName}`)}&summary=${encodeURIComponent(`${studentName} has successfully completed ${courseName}.`)}`;
  
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`I've completed ${courseName}! Check out my certificate.`)}`;
  
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(`I've completed ${courseName}! Check out my certificate.`)}`;

  // Handle email sharing
  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
  }
    
    try {
      setIsSending(true);
      setError(null);
      
      // Call API to send email
      const response = await fetch('/api/certificates/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          certificateId,
          email: email.trim(),
          message,
          pdfUrl,
          verificationUrl: shareUrl
      }),
    });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to share certificate');
    }
      
      toast.success('Certificate shared successfully');
      setEmail('');
      onClose();
  } catch (err: any) {
      console.error('Error sharing certificate:', err);
      setError(err.message || 'Failed to share certificate');
      toast.error('Failed to share certificate');
  } finally {
      setIsSending(false);
  }
};

  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success('Link copied to clipboard');
    })
      .catch((err) => {
        console.error('Error copying link:', err);
        toast.error('Failed to copy link');
    });
};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-neutral-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-neutral-900">
                  Share Certificate
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-neutral-500">
                    Share your certificate for <span className="font-medium">{courseName}</span> with others.
                  </p>
                </div>

                {/* Tabs */}
                <div className="mt-4">
                  <div className="border-b border-neutral-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'email'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                      }`}
                        onClick={() => setActiveTab('email')}
                      >
                        Email
                      </button>
                      <button
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'social'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                      }`}
                        onClick={() => setActiveTab('social')}
                      >
                        Social Media
                      </button>
                      <button
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'link'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                      }`}
                        onClick={() => setActiveTab('link')}
                      >
                        Copy Link
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="mt-4">
                    {activeTab === 'email' && (
                      <form onSubmit={handleEmailShare} className="space-y-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter recipient's email"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="message" className="block text-sm font-medium text-neutral-700">
                            Message
                          </label>
                          <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Add a personal message"
                          />
                        </div>
                        
                        {error && (
                          <div className="text-sm text-red-600">
                            {error}
                          </div>
                        )}
                        
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="primary"
                            type="submit"
                            disabled={isSending}
                          >
                            {isSending ? 'Sending...' : 'Send Email'}
                          </Button>
                        </div>
                      </form>
                    )}
                    
                    {activeTab === 'social' && (
                      <div className="space-y-4">
                        <p className="text-sm text-neutral-500">
                          Share your certificate on social media platforms.
                        </p>
                        
                        <div className="flex flex-col space-y-3">
                          <a
                            href={linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <svg className="h-5 w-5 mr-2 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                            Share on LinkedIn
                          </a>
                          
                          <a
                            href={twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <svg className="h-5 w-5 mr-2 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                            Share on Twitter
                          </a>
                          
                          <a
                            href={facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <svg className="h-5 w-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Share on Facebook
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'link' && (
                      <div className="space-y-4">
                        <p className="text-sm text-neutral-500">
                          Copy the verification link to share your certificate.
                        </p>
                        
                        <div className="flex">
                          <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="flex-1 px-3 py-2 border border-r-0 border-neutral-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          />
                          <Button
                            variant="primary"
                            onClick={handleCopyLink}
                            className="rounded-l-none"
                          >
                            Copy
                          </Button>
                        </div>
                        
                        <p className="text-xs text-neutral-500">
                          This link allows anyone to verify the authenticity of your certificate.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-neutral-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareCertificateModal;
