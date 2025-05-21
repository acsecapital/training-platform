import React, {useState } from 'react';
import Button from '@/components/ui/Button';
import {toast } from 'react-hot-toast';
import {verifyCertificatesInBatch } from '@/services/batchCertificateService';
import {formatDate } from '@/utils/formatters';
import {CertificateVerificationResult } from '@/types/certificate.types';

interface BatchCertificateVerificationProps {
  onComplete?: () => void;
}

const BatchCertificateVerification: React.FC<BatchCertificateVerificationProps> = ({onComplete }) => {
  const [verificationCodes, setVerificationCodes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<CertificateVerificationResult[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<{
    total: number;
    processed: number;
    valid: number;
    invalid: number;
} | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCodes.trim()) {
      toast.error('Please enter at least one verification code');
      return;
  }
    
    try {
      setLoading(true);
      setResults([]);
      
      // Parse verification codes
      const codes = verificationCodes
        .split(/[\n,;]/)
        .map(code => code.trim())
        .filter(code => code.length > 0);
      
      if (codes.length === 0) {
        toast.error('No valid verification codes found');
        setLoading(false);
        return;
    }
      
      setVerificationStatus({
        total: codes.length,
        processed: 0,
        valid: 0,
        invalid: 0
    });
      
      // Verify certificates in batch
      const {results: verificationResults, summary } = await verifyCertificatesInBatch({
        verificationCodes: codes,
        onProgress: (processed, valid, invalid) => {
          setVerificationStatus({
            total: codes.length,
            processed,
            valid,
            invalid
        });
      }
    });
      
      setResults(verificationResults);
      
      toast.success(`Verification complete: ${summary.valid} valid, ${summary.invalid} invalid`);
      
      if (onComplete) {
        onComplete();
    }
  } catch (error) {
      console.error('Error verifying certificates:', error);
      toast.error('Failed to verify certificates');
  } finally {
      setLoading(false);
  }
};

  // Handle clear
  const handleClear = () => {
    setVerificationCodes('');
    setResults([]);
    setVerificationStatus(null);
};

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-lg font-medium text-neutral-900">Batch Certificate Verification</h2>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="verificationCodes" className="block text-sm font-medium text-neutral-700 mb-1">
              Verification Codes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="verificationCodes"
              value={verificationCodes}
              onChange={(e) => setVerificationCodes(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter verification codes, one per line or separated by commas"
              disabled={loading}
              required
            />
            <p className="mt-1 text-sm text-neutral-500">
              Enter multiple verification codes separated by line breaks, commas, or semicolons.
            </p>
          </div>
          
          {/* Verification Status */}
          {verificationStatus && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-neutral-900 mb-2">Verification Progress</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>{verificationStatus.processed} of {verificationStatus.total} processed</span>
                </div>
                
                <div className="w-full bg-neutral-200 rounded-full h-2.5">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full"
                    style={{width: `${(verificationStatus.processed / verificationStatus.total) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">{verificationStatus.valid} valid</span>
                  <span className="text-red-600">{verificationStatus.invalid} invalid</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={loading || (!verificationCodes && results.length === 0)}
            >
              Clear
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !verificationCodes.trim()}
            >
              {loading ? 'Verifying...' : 'Verify Certificates'}
            </Button>
          </div>
        </form>
        
        {/* Results */}
        {results.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Verification Results</h3>
            
            <div className="border border-neutral-300 rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Verification Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Issue Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {results.map((result, index) => (
                      <tr key={index} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-neutral-900">{result.verificationCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.isValid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                            {result.isValid ? 'Valid' : 'Invalid'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {result.certificate ? (
                            <div className="text-sm text-neutral-900">{result.certificate.userName}</div>
                          ) : (
                            <div className="text-sm text-neutral-500">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {result.certificate ? (
                            <div className="text-sm text-neutral-900">{result.certificate.courseName}</div>
                          ) : (
                            <div className="text-sm text-neutral-500">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {result.certificate ? (
                            <div className="text-sm text-neutral-500">{formatDate(result.certificate.issueDate)}</div>
                          ) : (
                            <div className="text-sm text-neutral-500">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-500">{result.message}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchCertificateVerification;
