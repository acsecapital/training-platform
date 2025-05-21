import React, {useState, useEffect } from 'react';
import {Department } from '@/types/company.types';
import {getCompanyDepartments, removeDepartment } from '@/services/companyService';
import {formatDate } from '@/utils/formatters';
import {Search, Filter, FolderPlus, MoreHorizontal, XCircle, Trash2, Edit, Users, X } from 'lucide-react';
import Link from 'next/link';

interface DepartmentManagerProps {
  companyId: string;
}

const DepartmentManager: React.FC<DepartmentManagerProps> = ({companyId }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
}, [companyId]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedDepartments = await getCompanyDepartments(companyId);
      setDepartments(fetchedDepartments);
  } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments. Please try again.');
  } finally {
      setLoading(false);
  }
};



  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      setLoading(true);
      setError(null);
      await removeDepartment(companyId, selectedDepartment.id);
      setShowDeleteModal(false);
      setSelectedDepartment(null);
      await fetchDepartments();
  } catch (err) {
      console.error('Error deleting department:', err);
      setError('Failed to delete department. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const toggleDropdown = (departmentId: string) => {
    if (activeDropdown === departmentId) {
      setActiveDropdown(null);
  } else {
      setActiveDropdown(departmentId);
  }
};

  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-8 py-5 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="text-xl font-medium text-neutral-900">Departments</h3>
        <Link
          href="/admin/departments/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <FolderPlus className="h-5 w-5 mr-2" />
          Add Department
        </Link>
      </div>

      {error && (
        <div className="px-8 py-4 bg-red-50 border-b border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-8 py-4 border-b border-neutral-200 bg-neutral-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center px-4 py-3 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {loading && departments.length === 0 ? (
        <div className="px-8 py-16 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : departments.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <Users className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-neutral-900 mb-2">No departments found</h3>
          <p className="text-neutral-500 mb-6">
            Get started by creating a new department.
          </p>
          <Link
            href="/admin/departments/new"
            className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <FolderPlus className="h-5 w-5 mr-2" />
            Add Department
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Manager
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Employees
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredDepartments.map((department) => (
                <tr key={department.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">{department.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-500 max-w-xs truncate">
                      {department.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-500">
                      {department.managerId ? 'Assigned' : 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-500">
                      {department.employeeCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {formatDate(department.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button
                      onClick={() => toggleDropdown(department.id)}
                      className="text-neutral-400 hover:text-neutral-500"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>

                    {activeDropdown === department.id && (
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          <Link
                            href={`/admin/departments/${department.id}/edit`}
                            className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center"
                            role="menuitem"
                            onClick={() => setActiveDropdown(null)}
                          >
                            <Edit className="h-5 w-5 mr-2" />
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedDepartment(department);
                              setShowDeleteModal(true);
                              setActiveDropdown(null);
                          }}
                            className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-neutral-100 flex items-center"
                            role="menuitem"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {/* Delete Department Modal */}
      {showDeleteModal && selectedDepartment && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-8 py-5 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="text-xl font-medium text-neutral-900">Delete Department</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedDepartment(null);
              }}
                className="text-neutral-400 hover:text-neutral-500"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="px-8 py-6">
              <div className="mb-6">
                <p className="text-sm text-neutral-500">
                  Are you sure you want to delete the department <span className="font-medium text-neutral-900">{selectedDepartment.name}</span>? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedDepartment(null);
                }}
                  className="inline-flex items-center px-5 py-2.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  disabled={loading}
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDepartment}
                  className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Trash2 className="h-5 w-5 mr-2" />
                  )}
                  Delete Department
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManager;
