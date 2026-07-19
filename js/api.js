// Frontend API client using fetch() to communicate with Express & MongoDB REST API

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://student-management-system-b1la.onrender.com/api';

/* ================= STUDENTS API ================= */
export async function fetchStudentsFromAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/students`);
    if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching students via REST API:', error);
    throw error;
  }
}

export async function createStudentAPI(studentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
}

export async function updateStudentAPI(studentId, updatedData) {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Error updating student ${studentId}:`, error);
    throw error;
  }
}

export async function deleteStudentAPI(studentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Error deleting student ${studentId}:`, error);
    throw error;
  }
}

/* ================= AUTH & USERS API ================= */
export async function registerUserAPI(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Registration failed');
    return result.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

export async function loginUserAPI(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Login failed');
    return result.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

export async function fetchUsersAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/users`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function approveUserAPI(username) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/approve/${username}`, {
      method: 'PUT'
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error approving user:', error);
    throw error;
  }
}

export async function updateUserAPI(username, updatedData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/update/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUserAPI(username) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/delete/${username}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/* ================= CLASSES API ================= */
export async function fetchClassesAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/classes`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
}

export async function createClassAPI(classData) {
  try {
    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Create class failed');
    return result.data;
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
}

export async function deleteClassAPI(className) {
  try {
    const response = await fetch(`${API_BASE_URL}/classes/${className}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
}

/* ================= ASSIGNMENTS & SUBMISSIONS API ================= */
export async function fetchAssignmentsAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/assignments`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
}

export async function createAssignmentAPI(assignmentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignmentData)
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
}

export async function fetchSubmissionsAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
}

export async function createSubmissionAPI(submissionData) {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
}

/* ================= SUBJECTS API ================= */
export async function fetchSubjectsAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching subjects:', error);
    throw error;
  }
}

export async function createSubjectAPI(subjectData) {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subjectData)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Create subject failed');
    return result.data;
  } catch (error) {
    console.error('Error creating subject:', error);
    throw error;
  }
}
