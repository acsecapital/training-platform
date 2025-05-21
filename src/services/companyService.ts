import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import {firestore } from './firebase';
import {
  Company,
  Department,
  Employee,
  Team,
  CompanyStats,
  TeamStats
} from '@/types/company.types';

/**
 * Get all companies
 */
export const getCompanies = async (): Promise<Company[]> => {
  try {
    const companiesRef = collection(firestore, 'companies');
    const snapshot = await getDocs(companiesRef);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Company;
  });
} catch (error) {
    console.error('Error getting companies:', error);
    return [];
}
};

/**
 * Get company by ID
 */
export const getCompanyById = async (companyId: string): Promise<Company | null> => {
  try {
    const companyRef = doc(firestore, 'companies', companyId);
    const companyDoc = await getDoc(companyRef);

    if (!companyDoc.exists()) {
      return null;
  }

    const data = companyDoc.data();
    return {
      ...data,
      id: companyDoc.id,
      createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
  } as Company;
} catch (error) {
    console.error('Error getting company by ID:', error);
    return null;
}
};

/**
 * Create a new company
 */
export const createCompany = async (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> => {
  try {
    const timestamp = Timestamp.now();
    const companyRef = doc(collection(firestore, 'companies'));

    const newCompany = {
      ...companyData,
      id: companyRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
  };

    await setDoc(companyRef, newCompany);

    return {
      ...newCompany,
      createdAt: timestamp.toDate().toISOString(),
      updatedAt: timestamp.toDate().toISOString(),
  } as Company;
} catch (error) {
    console.error('Error creating company:', error);
    throw error;
}
};

/**
 * Update an existing company
 */
export const updateCompany = async (companyId: string, updates: Partial<Company>): Promise<void> => {
  try {
    const companyRef = doc(firestore, 'companies', companyId);
    const timestamp = Timestamp.now();

    await updateDoc(companyRef, {
      ...updates,
      updatedAt: timestamp,
  });
} catch (error) {
    console.error('Error updating company:', error);
    throw error;
}
};

/**
 * Delete a company
 */
export const deleteCompany = async (companyId: string): Promise<void> => {
  try {
    const companyRef = doc(firestore, 'companies', companyId);
    await deleteDoc(companyRef);
} catch (error) {
    console.error('Error deleting company:', error);
    throw error;
}
};

/**
 * Get company statistics
 */
export const getCompanyStats = (companyId: string, timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'): CompanyStats => {
  try {
    // This would typically fetch real data from Firestore based on the timeRange
    // For now, we'll return mock data
    console.log(`Fetching stats for company ${companyId} with time range: ${timeRange}`);
    return {
      totalEmployees: 25,
      activeUsers: 18,
      completedCourses: 42,
      inProgressCourses: 15,
      certificatesIssued: 38,
      averageCompletion: 78,
      departmentDistribution: [
        {name: 'Sales', value: 8 },
        {name: 'Marketing', value: 5 },
        {name: 'Engineering', value: 7 },
        {name: 'HR', value: 3 },
        {name: 'Finance', value: 2 },
      ],
      monthlyProgress: [
        {month: 'Jan', enrollments: 12, completions: 8 },
        {month: 'Feb', enrollments: 15, completions: 10 },
        {month: 'Mar', enrollments: 18, completions: 12 },
        {month: 'Apr', enrollments: 20, completions: 15 },
        {month: 'May', enrollments: 22, completions: 18 },
        {month: 'Jun', enrollments: 25, completions: 20 },
      ],
      coursePopularity: [
        {name: 'Sales Fundamentals', enrollments: 15 },
        {name: 'Leadership Skills', enrollments: 12 },
        {name: 'Digital Marketing', enrollments: 10 },
        {name: 'Project Management', enrollments: 8 },
        {name: 'Customer Service', enrollments: 7 },
      ],
      topPerformers: [
        {name: 'John Doe', department: 'Sales', score: 95 },
        {name: 'Jane Smith', department: 'Marketing', score: 92 },
        {name: 'Bob Johnson', department: 'Engineering', score: 90 },
        {name: 'Alice Williams', department: 'Sales', score: 88 },
        {name: 'Charlie Brown', department: 'HR', score: 85 },
      ],
  };
} catch (error) {
    console.error('Error getting company stats:', error);
    throw error;
}
};

/**
 * Get company employees
 */
export const getCompanyEmployees = async (companyId: string): Promise<Employee[]> => {
  try {
    const employeesRef = collection(firestore, 'companies', companyId, 'employees');
    const snapshot = await getDocs(employeesRef);

    const employees = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Employee;
  });

    // Fetch department details for each employee
    for (const employee of employees) {
      if (employee.departmentId) {
        const department = await getDepartmentById(companyId, employee.departmentId);
        if (department) {
          employee.department = department;
      }
    }
  }

    return employees;
} catch (error) {
    console.error('Error getting company employees:', error);
    return [];
}
};

/**
 * Add a new employee to a company
 */
export const addEmployee = async (companyId: string, employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> => {
  try {
    const timestamp = Timestamp.now();
    const employeesRef = collection(firestore, 'companies', companyId, 'employees');

    const newEmployee = {
      ...employeeData,
      companyId,
      createdAt: timestamp,
      updatedAt: timestamp,
  };

    const docRef = await addDoc(employeesRef, newEmployee);

    return {
      ...newEmployee,
      id: docRef.id,
      createdAt: timestamp.toDate().toISOString(),
      updatedAt: timestamp.toDate().toISOString(),
  } as Employee;
} catch (error) {
    console.error('Error adding employee:', error);
    throw error;
}
};

/**
 * Update an existing employee
 */
export const updateEmployee = async (companyId: string, employeeId: string, updates: Partial<Employee>): Promise<void> => {
  try {
    const employeeRef = doc(firestore, 'companies', companyId, 'employees', employeeId);
    const timestamp = Timestamp.now();

    await updateDoc(employeeRef, {
      ...updates,
      updatedAt: timestamp,
  });
} catch (error) {
    console.error('Error updating employee:', error);
    throw error;
}
};

/**
 * Remove an employee from a company
 */
export const removeEmployee = async (companyId: string, employeeId: string): Promise<void> => {
  try {
    const employeeRef = doc(firestore, 'companies', companyId, 'employees', employeeId);
    await deleteDoc(employeeRef);
} catch (error) {
    console.error('Error removing employee:', error);
    throw error;
}
};

/**
 * Get company departments
 */
export const getCompanyDepartments = async (companyId: string): Promise<Department[]> => {
  try {
    const departmentsRef = collection(firestore, 'companies', companyId, 'departments');
    const snapshot = await getDocs(departmentsRef);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Department;
  });
} catch (error) {
    console.error('Error getting company departments:', error);
    return [];
}
};

/**
 * Get department by ID
 */
export const getDepartmentById = async (companyId: string, departmentId: string): Promise<Department | null> => {
  try {
    const departmentRef = doc(firestore, 'companies', companyId, 'departments', departmentId);
    const departmentDoc = await getDoc(departmentRef);

    if (!departmentDoc.exists()) {
      return null;
  }

    const data = departmentDoc.data();
    return {
      ...data,
      id: departmentDoc.id,
      createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
  } as Department;
} catch (error) {
    console.error('Error getting department by ID:', error);
    return null;
}
};

/**
 * Create a new department
 */
export const createDepartment = async (companyId: string, departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> => {
  try {
    const timestamp = Timestamp.now();
    const departmentsRef = collection(firestore, 'companies', companyId, 'departments');

    const newDepartment = {
      ...departmentData,
      companyId,
      createdAt: timestamp,
      updatedAt: timestamp,
  };

    const docRef = await addDoc(departmentsRef, newDepartment);

    return {
      ...newDepartment,
      id: docRef.id,
      createdAt: timestamp.toDate().toISOString(),
      updatedAt: timestamp.toDate().toISOString(),
  } as Department;
} catch (error) {
    console.error('Error creating department:', error);
    throw error;
}
};

/**
 * Update an existing department
 */
export const updateDepartment = async (companyId: string, departmentId: string, updates: Partial<Department>): Promise<void> => {
  try {
    const departmentRef = doc(firestore, 'companies', companyId, 'departments', departmentId);
    const timestamp = Timestamp.now();

    await updateDoc(departmentRef, {
      ...updates,
      updatedAt: timestamp,
  });
} catch (error) {
    console.error('Error updating department:', error);
    throw error;
}
};

/**
 * Delete a department
 */
export const deleteDepartment = async (companyId: string, departmentId: string): Promise<void> => {
  try {
    const departmentRef = doc(firestore, 'companies', companyId, 'departments', departmentId);
    await deleteDoc(departmentRef);
} catch (error) {
    console.error('Error deleting department:', error);
    throw error;
}
};

/**
 * Add a new department
 */
export const addDepartment = async (companyId: string, departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> => {
  return createDepartment(companyId, departmentData);
};

/**
 * Remove a department
 */
export const removeDepartment = async (companyId: string, departmentId: string): Promise<void> => {
  return deleteDepartment(companyId, departmentId);
};

/**
 * Get department by ID (alias for getDepartmentById)
 */
export const getDepartment = getDepartmentById;

/**
 * Get department employee count
 */
export const getDepartmentEmployeeCount = async (companyId: string, departmentId: string): Promise<number> => {
  try {
    const employeesRef = collection(firestore, 'companies', companyId, 'employees');
    const q = query(employeesRef, where('departmentId', '==', departmentId));
    const snapshot = await getDocs(q);
    return snapshot.size;
} catch (error) {
    console.error('Error getting department employee count:', error);
    return 0;
}
};

/**
 * Get company teams
 */
export const getCompanyTeams = async (companyId: string): Promise<Team[]> => {
  try {
    const teamsRef = collection(firestore, 'companies', companyId, 'teams');
    const snapshot = await getDocs(teamsRef);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Team;
  });
} catch (error) {
    console.error('Error getting company teams:', error);
    return [];
}
};

/**
 * Get team by ID
 */
export const getTeamById = async (companyId: string, teamId: string): Promise<Team | null> => {
  try {
    const teamRef = doc(firestore, 'companies', companyId, 'teams', teamId);
    const teamDoc = await getDoc(teamRef);

    if (!teamDoc.exists()) {
      return null;
  }

    const data = teamDoc.data();
    return {
      ...data,
      id: teamDoc.id,
      createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
  } as Team;
} catch (error) {
    console.error('Error getting team by ID:', error);
    return null;
}
};

/**
 * Create a new team
 */
export const createTeam = async (companyId: string, teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> => {
  try {
    const timestamp = Timestamp.now();
    const teamsRef = collection(firestore, 'companies', companyId, 'teams');

    const newTeam = {
      ...teamData,
      companyId,
      createdAt: timestamp,
      updatedAt: timestamp,
  };

    const docRef = await addDoc(teamsRef, newTeam);

    return {
      ...newTeam,
      id: docRef.id,
      createdAt: timestamp.toDate().toISOString(),
      updatedAt: timestamp.toDate().toISOString(),
  } as Team;
} catch (error) {
    console.error('Error creating team:', error);
    throw error;
}
};

/**
 * Update an existing team
 */
export const updateTeam = async (companyId: string, teamId: string, updates: Partial<Team>): Promise<void> => {
  try {
    const teamRef = doc(firestore, 'companies', companyId, 'teams', teamId);
    const timestamp = Timestamp.now();

    await updateDoc(teamRef, {
      ...updates,
      updatedAt: timestamp,
  });
} catch (error) {
    console.error('Error updating team:', error);
    throw error;
}
};

/**
 * Delete a team
 */
export const deleteTeam = async (companyId: string, teamId: string): Promise<void> => {
  try {
    const teamRef = doc(firestore, 'companies', companyId, 'teams', teamId);
    await deleteDoc(teamRef);
} catch (error) {
    console.error('Error deleting team:', error);
    throw error;
}
};

/**
 * Get team members
 */
export const getTeamMembers = async (companyId: string, teamId: string): Promise<Employee[]> => {
  try {
    const team = await getTeamById(companyId, teamId);

    if (!team || !team.memberIds || team.memberIds.length === 0) {
      return [];
  }

    const employees: Employee[] = [];

    for (const employeeId of team.memberIds) {
      const employeeRef = doc(firestore, 'companies', companyId, 'employees', employeeId);
      const employeeDoc = await getDoc(employeeRef);

      if (employeeDoc.exists()) {
        const data = employeeDoc.data();
        employees.push({
          ...data,
          id: employeeDoc.id,
          createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Employee);
    }
  }

    return employees;
} catch (error) {
    console.error('Error getting team members:', error);
    return [];
}
};

/**
 * Add member to team
 */
export const addTeamMember = async (companyId: string, teamId: string, employeeId: string): Promise<void> => {
  try {
    const teamRef = doc(firestore, 'companies', companyId, 'teams', teamId);
    const teamDoc = await getDoc(teamRef);

    if (!teamDoc.exists()) {
      throw new Error('Team not found');
  }

    const team = teamDoc.data() as Team;
    const memberIds = team.memberIds || [];

    if (!memberIds.includes(employeeId)) {
      memberIds.push(employeeId);

      await updateDoc(teamRef, {
        memberIds,
        updatedAt: Timestamp.now(),
    });
  }
} catch (error) {
    console.error('Error adding team member:', error);
    throw error;
}
};

/**
 * Remove member from team
 */
export const removeTeamMember = async (companyId: string, teamId: string, employeeId: string): Promise<void> => {
  try {
    const teamRef = doc(firestore, 'companies', companyId, 'teams', teamId);
    const teamDoc = await getDoc(teamRef);

    if (!teamDoc.exists()) {
      throw new Error('Team not found');
  }

    const team = teamDoc.data() as Team;
    const memberIds = team.memberIds || [];

    const updatedMemberIds = memberIds.filter(id => id !== employeeId);

    await updateDoc(teamRef, {
      memberIds: updatedMemberIds,
      updatedAt: Timestamp.now(),
  });
} catch (error) {
    console.error('Error removing team member:', error);
    throw error;
}
};

/**
 * Get all companies (alias for getCompanies)
 */
export const getAllCompanies = async (): Promise<Company[]> => {
  return getCompanies();
};

/**
 * Get departments for a company (alias for getCompanyDepartments)
 */
export const getDepartments = async (companyId: string): Promise<Department[]> => {
  return getCompanyDepartments(companyId);
};

/**
 * Get teams for a company (alias for getCompanyTeams)
 */
export const getTeams = async (companyId: string): Promise<Team[]> => {
  return getCompanyTeams(companyId);
};

/**
 * Get team statistics
 */
export const getTeamStats = async (companyId: string, teamId: string): Promise<TeamStats> => {
  try {
    // Get team members
    const members = await getTeamMembers(companyId, teamId);

    if (!members || members.length === 0) {
      return {
        totalMembers: 0,
        activeCourses: 0,
        completedCourses: 0,
        averageProgress: 0,
        certificatesEarned: 0,
        memberProgress: [],
    };
  }

    // Initialize counters
    let totalActiveCourses = 0;
    let totalCompletedCourses = 0;
    let totalCertificates = 0;
    let totalProgress = 0;
    let totalCourses = 0;

    // Track member progress
    const memberProgress: Array<{name: string; progress: number }> = [];

    // Process each team member
    for (const member of members) {
      // Get user enrollments
      const enrollmentsRef = collection(firestore, `users/${member.id}/enrollments`);
      const enrollmentsSnapshot = await getDocs(enrollmentsRef);

      if (enrollmentsSnapshot.empty) {
        // Add member with 0 progress if they have no enrollments
        memberProgress.push({
          name: `${member.firstName} ${member.lastName}`,
          progress: 0
      });
        continue;
    }

      // let memberActiveCourses = 0; // Unused variable
      // let memberCompletedCourses = 0; // Unused variable
      let memberTotalProgress = 0;
      let memberCourseCount = 0;

      // Process each enrollment
      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollmentDoc.data();
        memberCourseCount++;

        // Check if course is completed
        if (enrollment.status === 'completed') {
          // memberCompletedCourses++; // Unused variable
          totalCompletedCourses++;
          memberTotalProgress += 100; // 100% progress for completed courses

          // Check if certificate was issued
          if (enrollment.certificateId) {
            totalCertificates++;
        }
      } else {
          // memberActiveCourses++; // Unused variable
          totalActiveCourses++;

          // Add the current progress
          memberTotalProgress += enrollment.progress || 0;
      }
    }

      // Calculate average progress for this member
      const memberAverageProgress = memberCourseCount > 0
        ? Math.round(memberTotalProgress / memberCourseCount)
        : 0;

      // Add to total progress for team average calculation
      totalProgress += memberTotalProgress;
      totalCourses += memberCourseCount;

      // Add member progress to the list
      memberProgress.push({
        name: `${member.firstName} ${member.lastName}`,
        progress: memberAverageProgress
    });
  }

    // Calculate team average progress
    const averageProgress = totalCourses > 0
      ? Math.round(totalProgress / totalCourses)
      : 0;

    // Sort member progress by progress percentage (descending)
    memberProgress.sort((a, b) => b.progress - a.progress);

    return {
      totalMembers: members.length,
      activeCourses: totalActiveCourses,
      completedCourses: totalCompletedCourses,
      averageProgress,
      certificatesEarned: totalCertificates,
      memberProgress,
  };
} catch (error) {
    console.error('Error getting team stats:', error);
    throw error;
}
};
