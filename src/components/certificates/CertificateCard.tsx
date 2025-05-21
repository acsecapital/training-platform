import React from 'react';
import Image from 'next/image';
import {motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';

export type Certificate = {
  id: string;
  title: string;
  courseName: string;
  issueDate: string;
  expiryDate?: string;
  thumbnailUrl: string;
  pdfUrl: string;
};

type CertificateCardProps = {
  certificate: Certificate;
  onView: (certificate: Certificate) => void;
  onDownload: (certificate: Certificate) => void;
  onShare?: (certificate: Certificate) => void;
  className?: string;
};

const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  onView,
  onDownload,
  onShare,
  className = '',
}) => {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
  });
};

  return (
    <Card
      className={`h-full flex flex-col ${className}`}
      hover={true}
      elevation="medium"
      padding="none"
    >
      {/* Certificate Thumbnail */}
      <div
        className="relative w-full h-48 overflow-hidden rounded-t-xl cursor-pointer"
        onClick={() => onView(certificate)}
      >
        <Image
          src={certificate.thumbnailUrl}
          alt={certificate.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
        />

        {/* Expiry Badge */}
        {certificate.expiryDate && (
          <div className="absolute top-3 right-3 bg-white bg-opacity-90 text-xs px-2 py-1 rounded shadow-sm">
            Expires: {formatDate(certificate.expiryDate)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5">
        <h3
          className="text-lg font-semibold mb-1 cursor-pointer hover:text-primary transition-colors duration-200"
          onClick={() => onView(certificate)}
        >
          {certificate.title}
        </h3>

        <p className="text-neutral-600 text-sm mb-4">
          {certificate.courseName}
        </p>

        <div className="text-sm text-neutral-500 mb-4">
          Issued on {formatDate(certificate.issueDate)}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <Button
            onClick={() => onDownload(certificate)}
            variant="primary"
            size="sm"
            fullWidth
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
          }
          >
            Download
          </Button>

          {onShare && (
            <Button
              onClick={() => onShare(certificate)}
              variant="outline"
              size="sm"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
            }
            >
              Share
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CertificateCard;
