import React, {useState } from 'react';
import Button from '@/components/ui/Button';
import {revokeCertificate } from '@/services/certificateService';
import {toast } from 'react-hot-toast';

interface RevokeCertificateModalProps {
  certificateId: string;
  certificateCode: string;
  studentName: string;
  courseName: string;
  onClose: () => void;
  onRevoked: () => void;
}

const RevokeCertificateModal: React.FC<RevokeCertificateModalProps> = ({
  certificateId,
  certificateCode,
  studentName,
  courseName,
  onClose,
  onRevoked
}) => {
  const [reason, setReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle revocation
  const handleRevoke = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for revocation');
      return;
  }

    try {
      setIsRevoking(true);
      setError(null);

      // Revoke certificate
      const success = await revokeCertificate(certificateId, reason);

      if (success) {
        toast.success('Certificate revoked successfully');
        onRevoked();
    } else {
        throw new Error('Failed to revoke certificate');
    }
  } catch (err: any) {
      console.error('Error revoking certificate:', err);
      setError(err.message || 'Failed to revoke certificate');
      toast.error('Failed to revoke certificate');
  } finally {
      setIsRevoking(false);
  }
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
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-neutral-900">
                  Revoke Certificate
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-neutral-500">
                    You are about to revoke the certificate for <span className="font-medium">{studentName}</span> for the course <span className="font-medium">{courseName}</span>.
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Certificate ID: <span className="font-mono text-xs">{certificateCode}</span>
                  </p>
                  <p className="text-sm text-neutral-500 mt-4">
                    This action cannot be undone. The certificate will be marked as revoked and will no longer be valid.
                  </p>
                </div>

                <div className="mt-4">
                  <label htmlFor="reason" className="block text-sm font-medium text-neutral-700">
                    Reason for Revocation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Please provide a reason for revoking this certificate"
                  />
                </div>

                {error && (
                  <div className="mt-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-neutral-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              variant="danger"
              onClick={handleRevoke}
              disabled={isRevoking}
              className="w-full sm:w-auto sm:ml-3"
            >
              {isRevoking ? 'Revoking...' : 'Revoke Certificate'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isRevoking}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevokeCertificateModal;
