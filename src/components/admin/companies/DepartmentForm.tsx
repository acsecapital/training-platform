import React, {useState, useEffect } from 'react';
import {Department, Employee } from '@/types/company.types';
import {getCompanyEmployees } from '@/services/companyService';
import {Building, Users, Save, X, AlignLeft } from 'lucide-react';

interface DepartmentFormProps {
  companyId: string;
  department?: Department;
  onCancel: () => void;
  onSave: (departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => void;
  isLoading?: boolean;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({
  companyId,
  department,
  onCancel,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    companyId: companyId,
    managerId: '',
});
  
  const [managers, setManagers] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Load managers on component mount
  useEffect(() => {
    fetchManagers();
}, [companyId]);

  // Populate form with department data if editing
  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description || '',
        companyId: department.companyId,
        managerId: department.managerId || '',
    });
  }
}, [department]);

  const fetchManagers = async () => {
    try {
      setLoadingManagers(true);
      const employees = await getCompanyEmployees(companyId);
      // Filter employees to only include those with manager roles
      const managerEmployees = employees.filter(emp => 
        ['admin', 'hr_manager', 'manager'].includes(emp.role)
      );
      setManagers(managerEmployees);
  } catch (err) {
      console.error('Error fetching managers:', err);
      setError('Failed to load managers. Please try again.');
  } finally {
      setLoadingManagers(false);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
  }));
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name) {
      setError('Department name is required.');
      return;
  }
    
    // Clear any previous errors
    setError(null);
    
    // Submit the form
    onSave(formData);
};

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        {/* Department Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
            Department Name *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              name="name"
              id="name"
              className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-neutral-300 rounded-md"
              placeholder="Department Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        {/* Department Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
            Description
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <AlignLeft className="h-5 w-5 text-neutral-400" />
            </div>
            <textarea
              name="description"
              id="description"
              rows={3}
              className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-neutral-300 rounded-md"
              placeholder="Department Description"
              value={formData.description || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        {/* Department Manager */}
        <div>
          <label htmlFor="managerId" className="block text-sm font-medium text-neutral-700">
            Department Manager
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-neutral-400" />
            </div>
            <select
              name="managerId"
              id="managerId"
              className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-neutral-300 rounded-md"
              value={formData.managerId || ''}
              onChange={handleInputChange}
            >
              <option value="">Select Manager</option>
              {loadingManagers ? (
                <option disabled>Loading managers...</option>
              ) : (
                managers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName} ({manager.role})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          disabled={isLoading}
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : department ? 'Update Department' : 'Create Department'}
        </button>
      </div>
    </form>
  );
};

export default DepartmentForm;
