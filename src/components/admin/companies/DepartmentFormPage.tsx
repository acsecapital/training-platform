import React, {useState, useEffect } from 'react';
import {Department, Employee } from '@/types/company.types';
import {getCompanyEmployees, addDepartment, updateDepartment, getDepartment } from '@/services/companyService';
import {Building, Users, Save, X, AlignLeft, ArrowLeft } from 'lucide-react';
import {useRouter } from 'next/router';
import Link from 'next/link';

interface DepartmentFormPageProps {
  companyId: string;
  departmentId?: string;
}

const DepartmentFormPage: React.FC<DepartmentFormPageProps> = ({companyId, departmentId }) => {
  const router = useRouter();
  const isEditing = Boolean(departmentId);
  
  const [formData, setFormData] = useState<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    companyId: companyId,
    managerId: '',
});
  
  const [managers, setManagers] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingDepartment, setLoadingDepartment] = useState(false);

  // Load managers on component mount
  useEffect(() => {
    fetchManagers();
}, [companyId]);

  // Load department data if editing
  useEffect(() => {
    if (isEditing && departmentId) {
      fetchDepartment(departmentId);
  }
}, [departmentId, isEditing]);

  const fetchDepartment = async (id: string) => {
    try {
      setLoadingDepartment(true);
      const department = await getDepartment(companyId, id);
      if (department) {
        setFormData({
          name: department.name,
          description: department.description || '',
          companyId: department.companyId,
          managerId: department.managerId || '',
      });
    }
  } catch (err) {
      console.error('Error fetching department:', err);
      setError('Failed to load department data. Please try again.');
  } finally {
      setLoadingDepartment(false);
  }
};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name) {
      setError('Department name is required.');
      return;
  }
    
    // Clear any previous errors
    setError(null);
    
    try {
      setLoading(true);
      
      if (isEditing && departmentId) {
        // Update existing department
        await updateDepartment(companyId, departmentId, formData);
    } else {
        // Create new department
        await addDepartment(companyId, formData);
    }
      
      // Navigate back to departments list
      router.push('/admin/departments');
  } catch (err) {
      console.error('Error saving department:', err);
      setError('Failed to save department. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleCancel = () => {
    router.push('/admin/departments');
};

  if (loadingDepartment) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-8 py-5 border-b border-neutral-200 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/admin/departments" className="mr-4 text-neutral-500 hover:text-neutral-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-xl font-medium text-neutral-900">
            {isEditing ? 'Edit Department' : 'Create New Department'}
          </h2>
        </div>
      </div>

      {error && (
        <div className="px-8 py-4 bg-red-50 border-b border-red-200">
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
      
      <form onSubmit={handleSubmit}>
        <div className="px-8 py-6 space-y-8">
          {/* Department Information Section */}
          <div>
            <h3 className="text-base font-medium text-neutral-800 mb-5">Department Information</h3>
            <div className="grid grid-cols-1 gap-8">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                  Department Name *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                    placeholder="Department Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <AlignLeft className="h-5 w-5 text-neutral-400" />
                  </div>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                    placeholder="Department Description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Department Management Section */}
          <div className="pt-2">
            <h3 className="text-base font-medium text-neutral-800 mb-5">Department Management</h3>
            <div className="grid grid-cols-1 gap-8 bg-neutral-50 p-6 rounded-lg">
              <div>
                <label htmlFor="managerId" className="block text-sm font-medium text-neutral-700 mb-2">
                  Department Manager
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-neutral-400" />
                  </div>
                  <select
                    name="managerId"
                    id="managerId"
                    className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
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
          </div>
        </div>
        
        <div className="px-8 py-5 bg-neutral-50 border-t border-neutral-200 flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center px-5 py-2.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            disabled={loading}
          >
            <X className="h-5 w-5 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            disabled={loading}
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Saving...' : isEditing ? 'Update Department' : 'Create Department'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DepartmentFormPage;
