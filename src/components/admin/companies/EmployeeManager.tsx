import React, {useState, useEffect } from 'react';
import {Employee } from '@/types/company.types';
import {getCompanyEmployees, addEmployee, updateEmployee, removeEmployee } from '@/services/companyService';
import {formatDate } from '@/utils/formatters';
import {Search, Filter, UserPlus, MoreHorizontal, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';
import EmployeeForm from './EmployeeForm';

interface EmployeeManagerProps {
  companyId: string;
  onEmployeeSelect?: (employee: Employee) => void;
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({companyId, onEmployeeSelect }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
}, [companyId]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedEmployees = await getCompanyEmployees(companyId);
      setEmployees(fetchedEmployees);
      setFilteredEmployees(fetchedEmployees);
  } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please try again.');
  } finally {
      setLoading(false);
  }
};

  useEffect(() => {
    // Apply search and department filter
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(employee =>
        employee.department?.id === departmentFilter
      );
  }

    setFilteredEmployees(filtered);
}, [searchTerm, departmentFilter, employees]);

  // Get unique departments for filter
  const departments = React.useMemo(() => {
    const uniqueDepartments = new Map();
    employees.forEach(employee => {
      if (employee.department) {
        uniqueDepartments.set(employee.department.id, employee.department);
    }
  });
    return Array.from(uniqueDepartments.values());
}, [employees]);

  const handleAddEmployee = async (newEmployee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);

      await addEmployee(companyId, newEmployee);
      setShowAddModal(false);
      fetchEmployees();
  } catch (err) {
      console.error('Error adding employee:', err);
      setError('Failed to add employee. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleEditEmployee = async (employeeId: string, updates: Partial<Employee>) => {
    try {
      setLoading(true);
      setError(null);

      await updateEmployee(companyId, employeeId, updates);
      setShowEditModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
  } catch (err) {
      console.error('Error updating employee:', err);
      setError('Failed to update employee. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleRemoveEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this employee?')) {
      return;
  }

    try {
      setLoading(true);
      setError(null);

      await removeEmployee(companyId, employeeId);
      fetchEmployees();
  } catch (err) {
      console.error('Error removing employee:', err);
      setError('Failed to remove employee. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
};

  if (loading && employees.length === 0) {
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
            placeholder="Search employees..."
            className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <select
              className="appearance-none block w-full pl-3 pr-10 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-neutral-400" />
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
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

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Department
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Joined
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
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-neutral-500">
                  No employees found
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {employee.photoURL ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={employee.photoURL}
                            alt={`${employee.firstName} ${employee.lastName}`}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                            {employee.firstName[0].toUpperCase()}{employee.lastName[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {employee.jobTitle || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">{employee.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">{employee.department?.name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800 capitalize">
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {employee.status === 'active' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                          <span className="text-sm text-neutral-900 capitalize">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-yellow-500 mr-1.5" />
                          <span className="text-sm text-neutral-900 capitalize">{employee.status}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {formatDate(employee.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-2">
                      <button
                        onClick={() => openEditModal(employee)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveEmployee(employee.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {onEmployeeSelect && (
                        <button
                          onClick={() => onEmployeeSelect(employee)}
                          className="text-neutral-400 hover:text-neutral-500"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-neutral-900">Add New Employee</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-500"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <EmployeeForm
                companyId={companyId}
                onCancel={() => setShowAddModal(false)}
                onSave={handleAddEmployee}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-neutral-900">Edit Employee</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
              }}
                className="text-neutral-400 hover:text-neutral-500"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <EmployeeForm
                companyId={companyId}
                employee={selectedEmployee}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
              }}
                onSave={(employeeData) => {
                  if (selectedEmployee) {
                    // Convert to Partial<Employee> for the update
                    handleEditEmployee(selectedEmployee.id, employeeData as Partial<Employee>);
                }
              }}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
