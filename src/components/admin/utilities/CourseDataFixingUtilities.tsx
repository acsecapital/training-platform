import React, {useState } from 'react';
import {fixAllCategoryCounts, fixCategoryCount } from '@/utilities/fixCategoryCounts';
import {fixAllDataIssues, fixCoursePriceDataTypes } from '@/utilities/fixDataTypes';
import Button from '@/components/ui/Button';

interface FixResult {
  name: string;
  success: boolean;
  message: string;
  timestamp: string;
  details?: any;
}

const CourseDataFixingUtilities: React.FC = () => {
  const [isFixingAllData, setIsFixingAllData] = useState(false);
  const [isFixingCategoryCounts, setIsFixingCategoryCounts] = useState(false);
  const [isFixingPrices, setIsFixingPrices] = useState(false);
  const [results, setResults] = useState<FixResult[]>([]);

  // Add a result to the results list
  const addResult = (name: string, success: boolean, message: string, details?: any) => {
    setResults(prev => [
      {
        name,
        success,
        message,
        timestamp: new Date().toLocaleTimeString(),
        details
    },
      ...prev
    ]);
};

  // Handle fixing all data issues
  const handleFixAllData = async () => {
    try {
      setIsFixingAllData(true);
      const result = await fixAllDataIssues();
      addResult('Fix Course Data Consistency', result.success, result.message, result.details);
  } catch (err: any) {
      addResult('Fix Course Data Consistency', false, `Error: ${err.message || 'Unknown error'}`);
  } finally {
      setIsFixingAllData(false);
  }
};

  // Handle fixing category counts
  const handleFixCategoryCounts = async () => {
    try {
      setIsFixingCategoryCounts(true);
      const result = await fixAllCategoryCounts();
      addResult('Fix Category Counts', result.success, result.message, result.details);
  } catch (err: any) {
      addResult('Fix Category Counts', false, `Error: ${err.message || 'Unknown error'}`);
  } finally {
      setIsFixingCategoryCounts(false);
  }
};

  // Handle fixing price data types
  const handleFixPriceDataTypes = async () => {
    try {
      setIsFixingPrices(true);
      const result = await fixCoursePriceDataTypes();
      addResult('Fix Price Data Types', result.success, result.message, {fixed: result.fixed });
  } catch (err: any) {
      addResult('Fix Price Data Types', false, `Error: ${err.message || 'Unknown error'}`);
  } finally {
      setIsFixingPrices(false);
  }
};

  // Clear results
  const clearResults = () => {
    setResults([]);
};

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900">Course Data Fixing Utilities</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Use these utilities to fix data inconsistencies in course-related data.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-md font-medium text-neutral-900 mb-2">Fix Course Data Consistency</h4>
              <p className="text-sm text-neutral-500 mb-4">
                Fixes course-related data issues: category counts and price data types.
              </p>
              <Button
                variant="primary"
                onClick={handleFixAllData}
                disabled={isFixingAllData || isFixingCategoryCounts || isFixingPrices}
                className="w-full"
              >
                {isFixingAllData ? 'Fixing...' : 'Fix Course Data Consistency'}
              </Button>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-md font-medium text-neutral-900 mb-2">Fix Category Counts</h4>
              <p className="text-sm text-neutral-500 mb-4">
                Updates category counts to match the actual number of courses in each category.
              </p>
              <Button
                variant="outline"
                onClick={handleFixCategoryCounts}
                disabled={isFixingAllData || isFixingCategoryCounts || isFixingPrices}
                className="w-full"
              >
                {isFixingCategoryCounts ? 'Fixing...' : 'Fix Category Counts'}
              </Button>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-md font-medium text-neutral-900 mb-2">Fix Price Data Types</h4>
              <p className="text-sm text-neutral-500 mb-4">
                Converts string price values to numbers for consistent data handling.
              </p>
              <Button
                variant="outline"
                onClick={handleFixPriceDataTypes}
                disabled={isFixingAllData || isFixingCategoryCounts || isFixingPrices}
                className="w-full"
              >
                {isFixingPrices ? 'Fixing...' : 'Fix Price Data Types'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-neutral-900">Results</h3>
            <Button variant="ghost" onClick={clearResults} size="sm">
              Clear
            </Button>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Operation
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {results.map((result, index) => (
                    <tr key={index} className={result.success ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {result.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {result.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {result.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">
                        {result.message}
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
  );
};

export default CourseDataFixingUtilities;

