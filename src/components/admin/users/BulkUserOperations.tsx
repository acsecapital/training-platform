import React, {useState } from 'react';
import {UserProfile } from '@/types/user.types';
import {Upload, FileText, Check, AlertCircle, X, Download, Users } from 'lucide-react';

interface BulkUserOperationsProps {
  onBulkImport?: (users: Partial<UserProfile>[]) => Promise<void>;
  onBulkExport?: () => Promise<void>;
  onBulkUpdate?: (updates: Partial<UserProfile>, userIds: string[]) => Promise<void>;
}

const BulkUserOperations: React.FC<BulkUserOperationsProps> = ({
  onBulkImport,
  onBulkExport,
  onBulkUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'update'>('import');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [parsedUsers, setParsedUsers] = useState<Partial<UserProfile>[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkUpdates, setBulkUpdates] = useState<Partial<UserProfile>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setFileContent(content);

        // Try to parse the file content
        if (selectedFile.name.endsWith('.csv')) {
          // Parse CSV
          const lines = content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          const users = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const user: Record<string, any> = {};
            
            headers.forEach((header, index) => {
              if (values[index]) {
                user[header] = values[index];
            }
          });
            
            return user as Partial<UserProfile>;
        }).filter(user => user.email); // Filter out empty rows
          
          setParsedUsers(users);
      } else if (selectedFile.name.endsWith('.json')) {
          // Parse JSON
          const users = JSON.parse(content);
          setParsedUsers(Array.isArray(users) ? users : [users]);
      } else {
          setError('Unsupported file format. Please upload a CSV or JSON file.');
          setParsedUsers([]);
      }
    } catch (err) {
        console.error('Error parsing file:', err);
        setError('Failed to parse file. Please check the file format.');
        setParsedUsers([]);
    }
  };

    reader.onerror = () => {
      setError('Failed to read file.');
      setFileContent(null);
      setParsedUsers([]);
  };

    reader.readAsText(selectedFile);
};

  const handleImport = async () => {
    if (!parsedUsers.length) {
      setError('No valid users to import.');
      return;
  }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (onBulkImport) {
        await onBulkImport(parsedUsers);
        setSuccess(`Successfully imported ${parsedUsers.length} users.`);
        setFile(null);
        setFileContent(null);
        setParsedUsers([]);
    } else {
        setError('Bulk import functionality is not available.');
    }
  } catch (err) {
      console.error('Error importing users:', err);
      setError('Failed to import users. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (onBulkExport) {
        await onBulkExport();
        setSuccess('Users exported successfully.');
    } else {
        setError('Bulk export functionality is not available.');
    }
  } catch (err) {
      console.error('Error exporting users:', err);
      setError('Failed to export users. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleUpdate = async () => {
    if (!selectedUserIds.length) {
      setError('No users selected for update.');
      return;
  }

    if (Object.keys(bulkUpdates).length === 0) {
      setError('No updates specified.');
      return;
  }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (onBulkUpdate) {
        await onBulkUpdate(bulkUpdates, selectedUserIds);
        setSuccess(`Successfully updated ${selectedUserIds.length} users.`);
        setSelectedUserIds([]);
        setBulkUpdates({});
    } else {
        setError('Bulk update functionality is not available.');
    }
  } catch (err) {
      console.error('Error updating users:', err);
      setError('Failed to update users. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleBulkUpdateChange = (field: keyof UserProfile, value: any) => {
    setBulkUpdates(prev => ({
      ...prev,
      [field]: value,
  }));
};

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-lg font-medium text-neutral-900">Bulk User Operations</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Import, export, or update multiple users at once.
        </p>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="px-6 py-4 bg-green-50 border-b border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-4">
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
            >
              <Upload className="h-5 w-5 inline mr-2" />
              Import Users
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
            >
              <Download className="h-5 w-5 inline mr-2" />
              Export Users
            </button>
            <button
              onClick={() => setActiveTab('update')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'update'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
            >
              <Users className="h-5 w-5 inline mr-2" />
              Bulk Update
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'import' && (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Upload User Data
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <FileText className="mx-auto h-12 w-12 text-neutral-400" />
                    <div className="flex text-sm text-neutral-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv,.json"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-neutral-500">CSV or JSON up to 10MB</p>
                  </div>
                </div>
              </div>

              {file && (
                <div className="mb-6">
                  <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-neutral-400 mr-2" />
                      <span className="text-sm font-medium text-neutral-700">{file.name}</span>
                      <span className="ml-2 text-xs text-neutral-500">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setFileContent(null);
                        setParsedUsers([]);
                    }}
                      className="text-neutral-400 hover:text-neutral-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {parsedUsers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">
                    Preview ({parsedUsers.length} users)
                  </h3>
                  <div className="overflow-x-auto border border-neutral-200 rounded-md">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-neutral-50">
                        <tr>
                          {Object.keys(parsedUsers[0]).map((key) => (
                            <th
                              key={key}
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200">
                        {parsedUsers.slice(0, 5).map((user, index) => (
                          <tr key={index}>
                            {Object.keys(parsedUsers[0]).map((key) => (
                              <td
                                key={`${index}-${key}`}
                                className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500"
                              >
                                {user[key as keyof typeof user]?.toString() || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {parsedUsers.length > 5 && (
                          <tr>
                            <td
                              colSpan={Object.keys(parsedUsers[0]).length}
                              className="px-6 py-4 text-center text-sm text-neutral-500"
                            >
                              ... and {parsedUsers.length - 5} more users
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading || parsedUsers.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Import Users
                </button>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Export Options</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center">
                    <input
                      id="export-all"
                      name="export-option"
                      type="radio"
                      className="focus:ring-primary h-4 w-4 text-primary border-neutral-300"
                      defaultChecked
                    />
                    <label htmlFor="export-all" className="ml-3 block text-sm font-medium text-neutral-700">
                      All Users
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="export-active"
                      name="export-option"
                      type="radio"
                      className="focus:ring-primary h-4 w-4 text-primary border-neutral-300"
                    />
                    <label htmlFor="export-active" className="ml-3 block text-sm font-medium text-neutral-700">
                      Active Users Only
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="export-inactive"
                      name="export-option"
                      type="radio"
                      className="focus:ring-primary h-4 w-4 text-primary border-neutral-300"
                    />
                    <label htmlFor="export-inactive" className="ml-3 block text-sm font-medium text-neutral-700">
                      Inactive Users Only
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Export Format</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center">
                    <input
                      id="format-csv"
                      name="export-format"
                      type="radio"
                      className="focus:ring-primary h-4 w-4 text-primary border-neutral-300"
                      defaultChecked
                    />
                    <label htmlFor="format-csv" className="ml-3 block text-sm font-medium text-neutral-700">
                      CSV
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="format-json"
                      name="export-format"
                      type="radio"
                      className="focus:ring-primary h-4 w-4 text-primary border-neutral-300"
                    />
                    <label htmlFor="format-json" className="ml-3 block text-sm font-medium text-neutral-700">
                      JSON
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Users
                </button>
              </div>
            </div>
          )}

          {activeTab === 'update' && (
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Select Users to Update</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  This is a placeholder for user selection. In a real implementation, you would have a
                  searchable, filterable list of users with checkboxes.
                </p>
                <div className="flex items-center">
                  <input
                    id="select-all"
                    name="select-all"
                    type="checkbox"
                    className="focus:ring-primary h-4 w-4 text-primary border-neutral-300 rounded"
                  />
                  <label htmlFor="select-all" className="ml-3 block text-sm font-medium text-neutral-700">
                    Select All Users
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Update Fields</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  Select the fields you want to update for all selected users.
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-neutral-700">
                      Company
                    </label>
                    <input
                      type="text"
                      name="company"
                      id="company"
                      className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-md"
                      onChange={(e) => handleBulkUpdateChange('company', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-neutral-700">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      id="department"
                      className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-md"
                      onChange={(e) => handleBulkUpdateChange('department', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-neutral-700">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      onChange={(e) => {
                        const role = e.target.value;
                        handleBulkUpdateChange('roles', {
                          admin: role === 'admin',
                          instructor: role === 'instructor',
                          student: role === 'student',
                          manager: role === 'manager',
                      });
                    }}
                    >
                      <option value="">Select a role</option>
                      <option value="admin">Admin</option>
                      <option value="instructor">Instructor</option>
                      <option value="student">Student</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={loading || Object.keys(bulkUpdates).length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Update Users
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUserOperations;
