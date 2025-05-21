import React, {useState } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Button from '@/components/ui/Button';
import {verifyAllCourseModuleCounts } from '@/services/moduleService';
import {migrateCoursesSchema, verifyCoursesSchema, MigrationResult } from '@/utilities/migrations/courseModuleCountMigration';
import {toast } from 'sonner';

const FixModuleCountsPage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{fixed: number; total: number; errors: string[] } | null>(null);
  const [migrationResults, setMigrationResults] = useState<MigrationResult | null>(null);
  const [verificationResults, setVerificationResults] = useState<MigrationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'legacy' | 'migration' | 'verification'>('migration');

  // Legacy method using the old utility function
  const handleFixModuleCounts = async () => {
    try {
      setIsProcessing(true);
      setResults(null);

      toast.loading('Fixing module counts for all courses...', {id: 'fix-modules'});

      // Run the utility function to fix module counts
      const fixResults = await verifyAllCourseModuleCounts();

      setResults(fixResults);

      if (fixResults.fixed > 0) {
        toast.success(`Fixed module counts for ${fixResults.fixed} out of ${fixResults.total} courses.`, {id: 'fix-modules'});
    } else {
        toast.success(`All ${fixResults.total} courses already have correct module counts.`, {id: 'fix-modules'});
    }

      if (fixResults.errors.length > 0) {
        toast.error(`Encountered errors with ${fixResults.errors.length} courses. See console for details.`, {id: 'fix-modules-errors'});
    }
  } catch (error) {
      console.error('Error fixing module counts:', error);
      toast.error('Failed to fix module counts. See console for details.', {id: 'fix-modules'});
  } finally {
      setIsProcessing(false);
  }
};

  // New method using the migration script
  const handleMigrateCourses = async () => {
    try {
      setIsProcessing(true);
      setMigrationResults(null);

      toast.loading('Migrating course schema for all courses...', {id: 'migrate-courses'});

      // Run the migration script
      const results = await migrateCoursesSchema();

      setMigrationResults(results);

      if (results.fixed > 0) {
        toast.success(`Migrated ${results.fixed} out of ${results.processed} courses.`, {id: 'migrate-courses'});
    } else {
        toast.success(`All ${results.processed} courses already have correct schema.`, {id: 'migrate-courses'});
    }

      if (results.errors.length > 0) {
        toast.error(`Encountered errors with ${results.errors.length} courses. See details below.`, {id: 'migrate-courses-errors'});
    }
  } catch (error) {
      console.error('Error migrating courses:', error);
      toast.error('Failed to migrate courses. See console for details.', {id: 'migrate-courses'});
  } finally {
      setIsProcessing(false);
  }
};

  // Verification method to check without making changes
  const handleVerifyCourses = async () => {
    try {
      setIsProcessing(true);
      setVerificationResults(null);

      toast.loading('Verifying course schema for all courses...', {id: 'verify-courses'});

      // Run the verification script
      const results = await verifyCoursesSchema();

      setVerificationResults(results);

      if (results.fixed > 0) {
        toast.success(`Found ${results.fixed} out of ${results.processed} courses that need migration.`, {id: 'verify-courses'});
    } else {
        toast.success(`All ${results.processed} courses already have correct schema.`, {id: 'verify-courses'});
    }

      if (results.errors.length > 0) {
        toast.error(`Encountered errors with ${results.errors.length} courses. See details below.`, {id: 'verify-courses-errors'});
    }
  } catch (error) {
      console.error('Error verifying courses:', error);
      toast.error('Failed to verify courses. See console for details.', {id: 'verify-courses'});
  } finally {
      setIsProcessing(false);
  }
};

  return (
    <AdminLayout title="Course Module Count Utilities">
      <div className="bg-white rounded-lg shadow-sm p-6">

        {/* Tabs */}
        <div className="border-b border-neutral-200 mb-6">
          <div className="flex space-x-4">
            <button
              className={`py-2 px-4 border-b-2 ${
                activeTab === 'migration'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
              onClick={() => setActiveTab('migration')}
            >
              Migrate Courses
            </button>
            <button
              className={`py-2 px-4 border-b-2 ${
                activeTab === 'verification'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
              onClick={() => setActiveTab('verification')}
            >
              Verify Courses
            </button>
            <button
              className={`py-2 px-4 border-b-2 ${
                activeTab === 'legacy'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
              onClick={() => setActiveTab('legacy')}
            >
              Legacy Fix
            </button>
          </div>
        </div>

        {/* Migration Tab */}
        {activeTab === 'migration' && (
          <div>
            <p className="mb-4">
              This utility will migrate all courses to use <code>modulesList</code> as the single source of truth for module counts.
              It will remove the redundant <code>modules</code> field and ensure <code>modulesList</code> accurately reflects the modules in each course.
            </p>

            <div className="mb-6">
              <Button
                onClick={() => void handleMigrateCourses()}
                disabled={isProcessing}
                className="bg-primary text-white hover:bg-primary-dark"
              >
                {isProcessing ? 'Processing...' : 'Migrate Courses'}
              </Button>
            </div>

            {migrationResults && (
              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-semibold mb-2">Migration Results:</h3>
                <p>Total courses processed: {migrationResults.processed}</p>
                <p>Courses fixed: {migrationResults.fixed}</p>
                {migrationResults.errors.length > 0 && (
                  <div>
                    <p className="text-red-600">Errors encountered: {migrationResults.errors.length}</p>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      <ul className="list-disc pl-5 text-sm text-red-600">
                        {migrationResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Details Table */}
                {migrationResults.details.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Details:</h4>
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-neutral-200 text-sm">
                        <thead className="bg-neutral-100">
                          <tr>
                            <th className="px-3 py-2 text-left">Course</th>
                            <th className="px-3 py-2 text-left">Old Count</th>
                            <th className="px-3 py-2 text-left">New Count</th>
                            <th className="px-3 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {migrationResults.details.map((detail, index) => (
                            <tr key={index} className={detail.error ? 'bg-red-50' : index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                              <td className="px-3 py-2">{detail.title} ({detail.courseId})</td>
                              <td className="px-3 py-2">{detail.oldModuleCount !== undefined ? detail.oldModuleCount : 'N/A'}</td>
                              <td className="px-3 py-2">{detail.newModuleCount}</td>
                              <td className="px-3 py-2">
                                {detail.error ? (
                                  <span className="text-red-600">Error: {detail.error}</span>
                                ) : detail.oldModuleCount !== undefined || (detail.oldModulesList && detail.oldModulesList.length !== detail.newModulesList.length) ? (
                                  <span className="text-green-600">Fixed</span>
                                ) : (
                                  <span className="text-neutral-500">No Change</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div>
            <p className="mb-4">
              This utility will verify all courses to check if they need migration without making any changes.
              It will identify courses that still have the redundant <code>modules</code> field or where <code>modulesList</code> is inaccurate.
            </p>

            <div className="mb-6">
              <Button
                onClick={() => void handleVerifyCourses()}
                disabled={isProcessing}
                className="bg-primary text-white hover:bg-primary-dark"
              >
                {isProcessing ? 'Processing...' : 'Verify Courses'}
              </Button>
            </div>

            {verificationResults && (
              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-semibold mb-2">Verification Results:</h3>
                <p>Total courses processed: {verificationResults.processed}</p>
                <p>Courses needing migration: {verificationResults.fixed}</p>
                {verificationResults.errors.length > 0 && (
                  <div>
                    <p className="text-red-600">Errors encountered: {verificationResults.errors.length}</p>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      <ul className="list-disc pl-5 text-sm text-red-600">
                        {verificationResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Details Table */}
                {verificationResults.details.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Details:</h4>
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-neutral-200 text-sm">
                        <thead className="bg-neutral-100">
                          <tr>
                            <th className="px-3 py-2 text-left">Course</th>
                            <th className="px-3 py-2 text-left">Old Count</th>
                            <th className="px-3 py-2 text-left">New Count</th>
                            <th className="px-3 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {verificationResults.details.map((detail, index) => (
                            <tr key={index} className={detail.error ? 'bg-red-50' : index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                              <td className="px-3 py-2">{detail.title} ({detail.courseId})</td>
                              <td className="px-3 py-2">{detail.oldModuleCount !== undefined ? detail.oldModuleCount : 'N/A'}</td>
                              <td className="px-3 py-2">{detail.newModuleCount}</td>
                              <td className="px-3 py-2">
                                {detail.error ? (
                                  <span className="text-red-600">Error: {detail.error}</span>
                                ) : detail.oldModuleCount !== undefined || (detail.oldModulesList && detail.oldModulesList.length !== detail.newModulesList.length) ? (
                                  <span className="text-yellow-600">Needs Migration</span>
                                ) : (
                                  <span className="text-green-600">OK</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Legacy Tab */}
        {activeTab === 'legacy' && (
          <div>
            <p className="mb-4">
              This is the legacy utility that will check all courses and ensure that the module count in each course document
              matches the actual number of modules in the course's modules subcollection.
            </p>

            <div className="mb-6">
              <Button
                onClick={() => void handleFixModuleCounts()}
                disabled={isProcessing}
                className="bg-primary text-white hover:bg-primary-dark"
              >
                {isProcessing ? 'Processing...' : 'Fix Module Counts (Legacy)'}
              </Button>
            </div>

            {results && (
              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-semibold mb-2">Results:</h3>
                <p>Total courses checked: {results.total}</p>
                <p>Courses fixed: {results.fixed}</p>
                {results.errors.length > 0 && (
                  <p className="text-red-600">Errors encountered: {results.errors.length}</p>
                )}
                {results.fixed === 0 && results.errors.length === 0 ? (
                  <p className="text-green-600 mt-2">All courses already have correct module counts!</p>
                ) : (
                  <p className="text-green-600 mt-2">Successfully fixed module counts!</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FixModuleCountsPage;
