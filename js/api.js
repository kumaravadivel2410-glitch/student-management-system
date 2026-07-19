// Full Stack Frontend REST API client for MongoDB Atlas Database

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://student-management-system-b1la.onrender.com/api';

// Helper for HTTP requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const config = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (data) config.body = JSON.stringify(data);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const errRes = await response.json().catch(() => ({}));
      throw new Error(errRes.message || `HTTP ${response.status}`);
    }
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  } catch (error) {
    console.warn(`API Error [${method} ${endpoint}]:`, error.message);
    throw error;
  }
}

// ---------------- STUDENTS ----------------
export const fetchStudentsFromAPI = () => apiRequest('/students');
export const createStudentAPI = (data) => apiRequest('/students', 'POST', data);
export const updateStudentAPI = (id, data) => apiRequest(`/students/${id}`, 'PUT', data);
export const deleteStudentAPI = (id) => apiRequest(`/students/${id}`, 'DELETE');

// ---------------- AUTH & USERS ----------------
export const loginUserAPI = (emailOrUsername, password) => apiRequest('/auth/login', 'POST', { emailOrUsername, password });
export const registerUserAPI = (data) => apiRequest('/auth/register', 'POST', data);
export const fetchUsersFromAPI = () => apiRequest('/users');
export const approveUserAPI = (id) => apiRequest(`/users/${id}/approve`, 'PUT');
export const rejectUserAPI = (id) => apiRequest(`/users/${id}`, 'DELETE');

// ---------------- CLASSES ----------------
export const fetchClassesFromAPI = () => apiRequest('/classes');
export const createClassAPI = (data) => apiRequest('/classes', 'POST', data);
export const deleteClassAPI = (id) => apiRequest(`/classes/${id}`, 'DELETE');

// ---------------- SUBJECTS ----------------
export const fetchSubjectsFromAPI = () => apiRequest('/subjects');
export const createSubjectAPI = (data) => apiRequest('/subjects', 'POST', data);
export const deleteSubjectAPI = (id) => apiRequest(`/subjects/${id}`, 'DELETE');

// ---------------- ASSIGNMENTS & SUBMISSIONS ----------------
export const fetchAssignmentsFromAPI = () => apiRequest('/assignments');
export const createAssignmentAPI = (data) => apiRequest('/assignments', 'POST', data);
export const submitHomeworkAPI = (id, data) => apiRequest(`/assignments/${id}/submit`, 'POST', data);

// ---------------- SETTINGS ----------------
export const fetchSettingsFromAPI = () => apiRequest('/settings');
export const saveSettingsAPI = (data) => apiRequest('/settings', 'PUT', data);
