import React, {useState } from 'react';
import {motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Button from '../ui/Button';
import {Certificate } from './CertificateCard';

type CertificateViewerProps = {
  certificate: Certificate;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (certificate: Certificate) => void;
  onShare?: (certificate: Certificate) => void;
};

const CertificateViewer: React.FC<CertificateViewerProps> = ({
  certificate,
  isOpen,
  onClose,
  onDownload,
  onShare,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });
};

  // Handle image load
  const handleImageLoad = () => {
    setIsLoading(false);
};

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{opacity: 0 }}
          animate={{opacity: 1 }}
          exit={{opacity: 0 }}
          transition={{duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
          onClick={onClose}
        >
          <motion.div
            initial={{scale: 0.9, opacity: 0 }}
            animate={{scale: 1, opacity: 1 }}
            exit={{scale: 0.9, opacity: 0 }}
            transition={{duration: 0.3 }}
            className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-800">{certificate.title}</h2>
              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-neutral-700 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Certificate Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}
              
              {/* Certificate Image */}
              <div className={`relative ${isLoading ? 'hidden' : 'block'}`}>
                <Image
                  src={certificate.thumbnailUrl}
                  alt={certificate.title}
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg shadow-md"
                  onLoad={handleImageLoad}
                />
              </div>
              
              {/* Certificate Details */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Course</h3>
                  <p className="text-neutral-800">{certificate.courseName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Issue Date</h3>
                  <p className="text-neutral-800">{formatDate(certificate.issueDate)}</p>
                </div>
                
                {certificate.expiryDate && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500">Expiry Date</h3>
                    <p className="text-neutral-800">{formatDate(certificate.expiryDate)}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Certificate ID</h3>
                  <p className="text-neutral-800">{certificate.id}</p>
                </div>
              </div>
              
              {/* Verification Note */}
              <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Certificate Verification</h3>
                <p className="text-sm text-neutral-600">
                  This certificate can be verified by sharing the Certificate ID with the issuing organization or by using the verification link provided in the PDF.
                </p>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t border-neutral-200 flex flex-col sm:flex-row gap-3 justify-end">
              {onShare && (
                <Button
                  onClick={() => onShare(certificate)}
                  variant="outline"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                }
                >
                  Share Certificate
                </Button>
              )}
              
              <Button
                onClick={() => onDownload(certificate)}
                variant="primary"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
              }
              >
                Download PDF
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CertificateViewer;
