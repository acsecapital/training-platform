import React, {useState, useEffect } from 'react';
import {Department } from '@/types/company.types';
import {
  getCompanyDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} from '@/services/companyService';
import {formatDate } from '@/utils/formatters';
import {
  Search,
  Building,
  MoreHorizontal,
  Trash2,
  Edit,
  Plus,
  X,
  Check,
  Users
} from 'lucide-react';
import Link from 'next/link';

interface DepartmentEditorProps {
  companyId: string;
  onDepartmentSelect?: (department: Department) => void;
}

const DepartmentEditor: React.FC<DepartmentEditorProps> = ({companyId, onDepartmentSelect }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // No longer using modal for department creation
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({
    name: '',
    description: '',
    companyId: '',
    managerId: '',
});

  useEffect(() => {
    fetchDepartments();
}, [companyId]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedDepartments = await getCompanyDepartments(companyId);
      setDepartments(fetchedDepartments);
      setFilteredDepartments(fetchedDepartments);
  } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments. Please try again.');
  } finally {
      setLoading(false);
  }
};

  useEffect(() => {
    // Apply search filter
    if (searchTerm) {
      const filtered = departments.filter(department =>
        department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        department.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDepartments(filtered);
  } else {
      setFilteredDepartments(departments);
  }
}, [searchTerm, departments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
  }));
};

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      companyId,
      managerId: '',
  });
};

  // Department creation is now handled by the dedicated page

  const handleEditDepartment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedDepartment) {
        setError('No department selected');
        setLoading(false);
        return;
    }

      if (!formData.name) {
        setError('Department name is required');
        setLoading(false);
        return;
    }

      await updateDepartment(companyId, selectedDepartment.id, {
        name: formData.name,
        description: formData.description,
        managerId: formData.managerId,
    });

      setShowEditModal(false);
      setSelectedDepartment(null);
      resetForm();
      fetchDepartments();
  } catch (err) {
      console.error('Error updating department:', err);
      setError('Failed to update department. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department?')) {
      return;
  }

    try {
      setLoading(true);
      setError(null);

      await deleteDepartment(companyId, departmentId);
      fetchDepartments();
  } catch (err) {
      console.error('Error deleting department:', err);
      setError('Failed to delete department. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      description: department.description,
      companyId: department.companyId,
      managerId: department.managerId,
  });
    setShowEditModal(true);
};

  if (loading && departments.length === 0) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search departments..."
            className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Link
          href="/admin/departments/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Building className="h-4 w-4 mr-2" />
          Add Department
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
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

      {filteredDepartments.length === 0 ? (
        <div className="p-8 text-center">
          <Building className="h-12 w-12 text-neutral-400 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-neutral-900">No Departments Found</h3>
          <p className="mt-1 text-neutral-500">
            {departments.length === 0
              ? 'Get started by creating your first department.'
              : 'No departments match your search criteria.'}
          </p>
          <div className="mt-6">
            <Link
              href="/admin/departments/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Department Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Employees
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredDepartments.map((department) => (
                <tr key={department.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">
                          {department.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-500 max-w-xs truncate">
                      {department.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {department.employeeCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {formatDate(department.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-2">
                      <button
                        onClick={() => openEditModal(department)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(department.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {onDepartmentSelect && (
                        <button
                          onClick={() => onDepartmentSelect(department)}
                          className="text-neutral-400 hover:text-neutral-500"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Department creation is now handled by the dedicated page */}

      {/* Edit Department Modal */}
      {showEditModal && selectedDepartment && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-neutral-900">Edit Department</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDepartment(null);
              }}
                className="text-neutral-400 hover:text-neutral-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-neutral-700">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="edit-name"
                    className="mt-1 block w-full border border-neutral-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-neutral-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="edit-description"
                    rows={3}
                    className="mt-1 block w-full border border-neutral-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="edit-managerId" className="block text-sm font-medium text-neutral-700">
                    Manager ID
                  </label>
                  <input
                    type="text"
                    name="managerId"
                    id="edit-managerId"
                    className="mt-1 block w-full border border-neutral-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.managerId || ''}
                    onChange={handleInputChange}
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Optional: Assign a manager to this department
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDepartment(null);
                }}
                  className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditDepartment}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentEditor;
