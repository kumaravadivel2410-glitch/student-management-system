// Frontend API client using fetch() to communicate with Express & MongoDB REST API

// Deployed Render backend REST API endpoint
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://student-management-system-b1la.onrender.com/api';

/**
 * Fetch all students from MongoDB
 * GET /api/students
 */
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

/**
 * Create a new student record in MongoDB
 * POST /api/students
 */
export async function createStudentAPI(studentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData)
    });
    if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating student via REST API:', error);
    throw error;
  }
}

/**
 * Update existing student in MongoDB
 * PUT /api/students/:id
 */
export async function updateStudentAPI(studentId, updatedData) {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });
    if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Error updating student ${studentId} via REST API:`, error);
    throw error;
  }
}

/**
 * Delete a student from MongoDB
 * DELETE /api/students/:id
 */
export async function deleteStudentAPI(studentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Error deleting student ${studentId} via REST API:`, error);
    throw error;
  }
}
