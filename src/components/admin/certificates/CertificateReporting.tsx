import React, {useState } from 'react';
import Button from '@/components/ui/Button';
import {toast } from 'react-hot-toast';
import {collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {Certificate } from '@/types/certificate.types';
import {formatDate } from '@/utils/formatters';
import {saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface CertificateReportingProps {
  // Add any props if needed
}

const CertificateReporting: React.FC<CertificateReportingProps> = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    courseId: '',
    exportFormat: 'xlsx'
});

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
  }));
};

  // Generate report
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Build query
      let certificatesQuery = query(
        collection(firestore, 'certificates'),
        orderBy('issueDate', 'desc')
      );
      
      // Apply date filters
      if (filters.startDate && filters.endDate) {
        const startTimestamp = Timestamp.fromDate(new Date(filters.startDate));
        const endTimestamp = Timestamp.fromDate(new Date(filters.endDate));
        certificatesQuery = query(
          certificatesQuery,
          where('issueDate', '>=', startTimestamp),
          where('issueDate', '<=', endTimestamp)
        );
    } else if (filters.startDate) {
        const startTimestamp = Timestamp.fromDate(new Date(filters.startDate));
        certificatesQuery = query(
          certificatesQuery,
          where('issueDate', '>=', startTimestamp)
        );
    } else if (filters.endDate) {
        const endTimestamp = Timestamp.fromDate(new Date(filters.endDate));
        certificatesQuery = query(
          certificatesQuery,
          where('issueDate', '<=', endTimestamp)
        );
    }
      
      // Apply status filter
      if (filters.status) {
        certificatesQuery = query(
          certificatesQuery,
          where('status', '==', filters.status)
        );
    }
      
      // Apply course filter
      if (filters.courseId) {
        certificatesQuery = query(
          certificatesQuery,
          where('courseId', '==', filters.courseId)
        );
    }
      
      // Execute query
      const certificatesSnapshot = await getDocs(certificatesQuery);
      
      // Process certificates
      const certificates = certificatesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          certificateId: data.certificateId || '',
          studentName: data.userName || 'Unknown Student',
          studentId: data.userId || '',
          courseName: data.courseName || 'Unknown Course',
          courseId: data.courseId || '',
          issueDate: data.issueDate ? formatDate(data.issueDate) : 'Unknown',
          expiryDate: data.expiryDate ? formatDate(data.expiryDate) : 'N/A',
          status: data.status || 'Unknown',
          verificationCode: data.verificationCode || '',
          isPublic: data.isPublic ? 'Yes' : 'No',
          blockchainVerified: data.blockchainVerified ? 'Yes' : 'No'
      };
    });
      
      // Generate report based on format
      if (filters.exportFormat === 'xlsx') {
        generateExcelReport(certificates);
    } else if (filters.exportFormat === 'csv') {
        generateCsvReport(certificates);
    } else if (filters.exportFormat === 'json') {
        generateJsonReport(certificates);
    }
      
      toast.success(`Report generated with ${certificates.length} certificates`);
  } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
  } finally {
      setLoading(false);
  }
};

  // Generate Excel report
  const generateExcelReport = (certificates: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(certificates);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificates');
    
    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `certificates_report_${dateStr}.xlsx`;
    
    // Save file
    XLSX.writeFile(workbook, filename);
};

  // Generate CSV report
  const generateCsvReport = (certificates: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(certificates);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `certificates_report_${dateStr}.csv`;
    
    // Save file
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
    saveAs(blob, filename);
};

  // Generate JSON report
  const generateJsonReport = (certificates: any[]) => {
    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `certificates_report_${dateStr}.json`;
    
    // Save file
    const blob = new Blob([JSON.stringify(certificates, null, 2)], {type: 'application/json'});
    saveAs(blob, filename);
};

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-lg font-medium text-neutral-900">Certificate Reports</h2>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleGenerateReport} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-neutral-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-neutral-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
                Certificate Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="issued">Issued</option>
                <option value="revoked">Revoked</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-neutral-700 mb-1">
                Course ID
              </label>
              <input
                type="text"
                id="courseId"
                name="courseId"
                value={filters.courseId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Filter by course ID"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="exportFormat" className="block text-sm font-medium text-neutral-700 mb-1">
              Export Format
            </label>
            <select
              id="exportFormat"
              name="exportFormat"
              value={filters.exportFormat}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Generating Report...' : 'Generate Report'}
            </Button>
          </div>
        </form>
        
        <div className="mt-8 border-t border-neutral-200 pt-6">
          <h3 className="text-md font-medium text-neutral-900 mb-4">Available Reports</h3>
          
          <div className="space-y-4">
            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-neutral-900">All Certificates</h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    Export all certificates with complete details
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({
                      startDate: '',
                      endDate: '',
                      status: '',
                      courseId: '',
                      exportFormat: 'xlsx'
                  });
                    setTimeout(() => {
                      document.getElementById('exportFormat')?.focus();
                  }, 100);
                }}
                >
                  Configure
                </Button>
              </div>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-neutral-900">Certificates Issued This Month</h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    Export certificates issued in the current month
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    
                    setFilters({
                      startDate: firstDay.toISOString().split('T')[0],
                      endDate: lastDay.toISOString().split('T')[0],
                      status: 'active',
                      courseId: '',
                      exportFormat: 'xlsx'
                  });
                    
                    setTimeout(() => {
                      document.getElementById('exportFormat')?.focus();
                  }, 100);
                }}
                >
                  Configure
                </Button>
              </div>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-neutral-900">Revoked Certificates</h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    Export all revoked certificates
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({
                      startDate: '',
                      endDate: '',
                      status: 'revoked',
                      courseId: '',
                      exportFormat: 'xlsx'
                  });
                    
                    setTimeout(() => {
                      document.getElementById('exportFormat')?.focus();
                  }, 100);
                }}
                >
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateReporting;
