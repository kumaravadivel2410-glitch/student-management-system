import { fetchStudentsFromAPI, createStudentAPI, updateStudentAPI, deleteStudentAPI } from './api.js';

const KEY_STUDENTS = 'sms_students';
const KEY_USERS = 'sms_users';
const KEY_SESSION = 'sms_session';
const KEY_CLASSES = 'sms_classes';
const KEY_ASSIGNMENTS = 'sms_assignments';
const KEY_SUBMISSIONS = 'sms_submissions';
const KEY_SUBJECTS = 'sms_subjects';



// Generate date strings for the past N school days (excluding Sundays)
function getPastSchoolDays(count) {
  const dates = [];
  let d = new Date();
  // Adjust to start from yesterday to not skew today's initial attendance
  d.setDate(d.getDate() - 1);
  
  while (dates.length < count) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0) { // Exclude Sunday
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    d.setDate(d.getDate() - 1);
  }
  return dates;
}

// Seed function to initialize the database
export function initializeDatabase() {
  // Migration: Clear old database containing legacy 183 seeded mock students
  if (!localStorage.getItem('sms_db_cleared_v3')) {
    localStorage.removeItem(KEY_STUDENTS);
    localStorage.setItem('sms_db_cleared_v3', 'true');
  }

  // Migration: Ensure users have the 'approved' property and updated email
  const existingUsers = localStorage.getItem(KEY_USERS);
  if (existingUsers) {
    try {
      const parsed = JSON.parse(existingUsers);
      if (parsed.admin && parsed.admin.email !== 'adminjpcoe@gmail.edu') {
        localStorage.removeItem(KEY_USERS);
      } else if (parsed.admin && !('approved' in parsed.admin)) {
        localStorage.removeItem(KEY_USERS);
      } else if (!parsed.student) {
        localStorage.removeItem(KEY_USERS);
      }
    } catch (e) {
      localStorage.removeItem(KEY_USERS);
    }
  }

  // 1. Initial Users Seeding
  if (!localStorage.getItem(KEY_USERS)) {
    const defaultUsers = {
      admin: {
        username: 'admin',
        password: 'admin123', // plain text for simple demo auth
        name: 'Administrator Profile',
        role: 'admin',
        email: 'adminjpcoe@gmail.edu',
        phone: '+1 (555) 0199',
        approved: true
      },
      faculty: {
        username: 'faculty',
        password: 'faculty123',
        name: 'Prof. Sarah Jenkins',
        role: 'faculty',
        email: 's.jenkins@school.edu',
        phone: '+1 (555) 0188',
        classAssigned: 'Class A',
        approved: true
      },
      student: {
        username: 'student',
        password: 'student123',
        name: 'Liam Johnson',
        role: 'student',
        email: 'liam@school.edu',
        phone: '+1 (555) 0101',
        approved: true
      }
    };
    localStorage.setItem(KEY_USERS, JSON.stringify(defaultUsers));
  }

  // 2. Initial Students Seeding (Initialize as empty list, but add Liam Johnson to class A if empty so student login works)
  if (!localStorage.getItem(KEY_STUDENTS)) {
    const defaultStudents = [
      {
        id: 'STU001',
        name: 'Liam Johnson',
        class: 'Class A',
        rollNo: 'A-01',
        email: 'liam@school.edu',
        phone: '+1 (555) 0101',
        department: 'Computer Science & Engineering',
        semester: 'Semester 1',
        dob: '2005-04-12',
        gender: 'Male',
        parentName: 'Robert Johnson',
        parentPhone: '+1 (555) 0102',
        address: '123 University Drive, Suite A, Stanford, CA',
        attendance: {},
        marks: {
          internal: { Mathematics: 32, Science: 35, English: 38, History: 30, 'Computer Science': 36 },
          semester: { Mathematics: 48, Science: 52, English: 55, History: 45, 'Computer Science': 50 }
        }
      }
    ];
    localStorage.setItem(KEY_STUDENTS, JSON.stringify(defaultStudents));
  }

  // 3. Initial Classes Seeding
  if (!localStorage.getItem(KEY_CLASSES)) {
    const defaultClasses = [
      { name: 'Class A', faculty: 'Prof. Sarah Jenkins' },
      { name: 'Class B', faculty: 'Prof. Michael Chang' },
      { name: 'Class C', faculty: 'Dr. Elena Rostova' }
    ];
    localStorage.setItem(KEY_CLASSES, JSON.stringify(defaultClasses));
  }

  // 4. Initial Homework Assignments Seeding
  if (!localStorage.getItem(KEY_ASSIGNMENTS)) {
    const defaultAssignments = [
      { id: 'HW001', class: 'Class A', subject: 'Mathematics', title: 'Calculus Problems 1-10', description: 'Solve problems on page 42 regarding derivatives.', dueDate: '2026-07-25' },
      { id: 'HW002', class: 'Class A', subject: 'Computer Science', title: 'Binary Search Implementation', description: 'Write a binary search algorithm in JavaScript.', dueDate: '2026-07-28' },
      { id: 'HW003', class: 'Class B', subject: 'Science', title: 'Chemical Bonding Report', description: 'Write a 2-page report on covalent vs ionic bonds.', dueDate: '2026-07-24' }
    ];
    localStorage.setItem(KEY_ASSIGNMENTS, JSON.stringify(defaultAssignments));
  }

  if (!localStorage.getItem(KEY_SUBMISSIONS)) {
    localStorage.setItem(KEY_SUBMISSIONS, JSON.stringify([]));
  }

  if (!localStorage.getItem(KEY_SUBJECTS)) {
    const defaultSubjects = [
      { code: 'MA101', name: 'Mathematics' },
      { code: 'SC102', name: 'Science' },
      { code: 'EN103', name: 'English' },
      { code: 'HI104', name: 'History' },
      { code: 'CS105', name: 'Computer Science' }
    ];
    localStorage.setItem(KEY_SUBJECTS, JSON.stringify(defaultSubjects));
  }
}

// Core Data Accessors
export function getStudents() {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(KEY_STUDENTS)) || [];
}

export function saveStudents(students) {
  localStorage.setItem(KEY_STUDENTS, JSON.stringify(students));
  syncWithServer();
}

// Student CRUD Operations
export function addStudent(studentData) {
  const students = getStudents();
  const classes = studentData.class;
  
  // Use manual roll number if provided, otherwise auto-generate
  let rollNo = studentData.rollNo;
  if (!rollNo) {
    const count = students.filter(s => s.class === classes).length;
    const classCode = classes === 'Class A' ? 'A' : classes === 'Class B' ? 'B' : 'C';
    const newRollNum = count + 1;
    rollNo = `${classCode}-${String(newRollNum).padStart(2, '0')}`;
  }
  
  // Calculate next ID
  const maxId = students.reduce((max, s) => {
    const num = parseInt(s.id.replace('STU', ''), 10);
    return num > max ? num : max;
  }, 0);
  const id = `STU${String(maxId + 1).padStart(3, '0')}`;

  const newStudent = {
    id,
    name: studentData.name,
    class: classes,
    rollNo,
    email: studentData.email,
    phone: studentData.phone,
    department: studentData.department,
    semester: studentData.semester,
    dob: studentData.dob,
    gender: studentData.gender,
    parentName: studentData.parentName,
    parentPhone: studentData.parentPhone,
    address: studentData.address,
    attendance: {},
    marks: {
      internal: getSubjects().reduce((acc, s) => { acc[s.name] = 0; return acc; }, {}),
      semester: getSubjects().reduce((acc, s) => { acc[s.name] = 0; return acc; }, {})
    }
  };

  // Seed default history of past 30 days as present for new student
  const pastDates = getPastSchoolDays(30);
  pastDates.forEach(date => {
    newStudent.attendance[date] = 'present';
  });

  students.push(newStudent);
  saveStudents(students);
  createStudentAPI(newStudent).catch(err => console.warn('REST API sync notice:', err));
  addNotification(`Registered new student ${newStudent.name} in ${newStudent.class} (Roll No: ${newStudent.rollNo})`, 'info');
  return newStudent;
}

export function updateStudent(studentId, updatedData) {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId || s.studentId === studentId || s._id === studentId);
  if (index !== -1) {
    // If class changes and no manual roll number is supplied, reassign roll number
    if (students[index].class !== updatedData.class && !updatedData.rollNo) {
      const cls = updatedData.class;
      const count = students.filter(s => s.class === cls).length;
      const classCode = cls === 'Class A' ? 'A' : cls === 'Class B' ? 'B' : 'C';
      updatedData.rollNo = `${classCode}-${String(count + 1).padStart(2, '0')}`;
    }
    
    students[index] = {
      ...students[index],
      ...updatedData
    };
    saveStudents(students);
    updateStudentAPI(studentId, updatedData).catch(err => console.warn('REST API update notice:', err));
    addNotification(`Updated student record for ${students[index].name} (${students[index].rollNo})`, 'success');
    return students[index];
  }
  return null;
}

export function deleteStudent(studentId) {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId || s.studentId === studentId || s._id === studentId);
  if (index !== -1) {
    const deletedName = students[index].name;
    const deletedClass = students[index].class;
    students.splice(index, 1);
    saveStudents(students);
    deleteStudentAPI(studentId).catch(err => console.warn('REST API delete notice:', err));
    addNotification(`Deleted student record for ${deletedName} from ${deletedClass}`, 'warning');
    return true;
  }
  return false;
}

export function deleteStudentsBulk(studentIds) {
  const students = getStudents();
  const remaining = students.filter(s => !studentIds.includes(s.id));
  const deletedCount = students.length - remaining.length;
  if (deletedCount > 0) {
    saveStudents(remaining);
    addNotification(`Bulk deleted ${deletedCount} student records`, 'warning');
    return true;
  }
  return false;
}

// User & Auth Management
export function getUsers() {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(KEY_USERS)) || {};
}

export function saveUsers(users) {
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
  syncWithServer();
}

export function loginUser(email, password) {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Permanent admin credentials bypass
  if (normalizedEmail === 'adminjpcoe@gmail.edu' && password === 'admin123') {
    const permAdmin = {
      username: 'admin',
      password: 'admin123',
      name: 'Permanent Administrator',
      role: 'admin',
      email: 'adminjpcoe@gmail.edu',
      phone: '+1 (555) 0199',
      approved: true
    };
    sessionStorage.setItem(KEY_SESSION, JSON.stringify(permAdmin));
    return { status: 'success', user: permAdmin };
  }

  const users = getUsers();
  const user = Object.values(users).find(u => u.email.toLowerCase() === normalizedEmail);
  if (user && user.password === password) {
    if (user.approved === false) {
      return { status: 'pending' };
    }
    sessionStorage.setItem(KEY_SESSION, JSON.stringify(user));
    return { status: 'success', user };
  }
  return { status: 'failed' };
}

export function getActiveSession() {
  return JSON.parse(sessionStorage.getItem(KEY_SESSION)) || null;
}

export function logoutUser() {
  sessionStorage.removeItem(KEY_SESSION);
}

export function registerUser(name, email, password, role) {
  const users = getUsers();
  const normalizedEmail = email.toLowerCase().trim();
  
  if (Object.values(users).some(u => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, message: 'Email address is already registered.' };
  }

  const username = normalizedEmail.split('@')[0];
  const newUser = {
    username,
    name: name.trim(),
    email: normalizedEmail,
    password,
    role,
    approved: false,
    phone: '+1 (555) 0000'
  };

  users[username] = newUser;
  saveUsers(users);
  addNotification(`New registration request from ${newUser.name} for role ${newUser.role}`, 'info');
  return { success: true };
}

export function approveUserRegistration(email) {
  const users = getUsers();
  const user = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (user) {
    user.approved = true;
    saveUsers(users);
    addNotification(`Approved user registration for ${user.name} (${user.role})`, 'success');
    return true;
  }
  return false;
}

export function rejectUserRegistration(email) {
  const users = getUsers();
  const key = Object.keys(users).find(k => users[k].email.toLowerCase() === email.toLowerCase().trim());
  if (key) {
    const userName = users[key].name;
    const userRole = users[key].role;
    delete users[key];
    saveUsers(users);
    addNotification(`Rejected user registration for ${userName} (${userRole})`, 'warning');
    return true;
  }
  return false;
}

export function updatePassword(username, oldPassword, newPassword) {
  const users = getUsers();
  const user = users[username.toLowerCase()];
  if (user && user.password === oldPassword) {
    user.password = newPassword;
    users[username.toLowerCase()] = user;
    saveUsers(users);
    
    // update current session
    const currentSession = getActiveSession();
    if (currentSession && currentSession.username === username) {
      currentSession.password = newPassword;
      sessionStorage.setItem(KEY_SESSION, JSON.stringify(currentSession));
    }
    addNotification(`Password changed successfully for user ${username}`, 'success');
    return { success: true };
  }
  return { success: false, message: 'Incorrect old password.' };
}

// Attendance updates
export function saveClassAttendance(cls, dateString, attendanceMap) {
  const students = getStudents();
  let updatedCount = 0;
  
  students.forEach(student => {
    if (student.class === cls) {
      student.attendance[dateString] = attendanceMap[student.id] || 'absent';
      updatedCount++;
    }
  });
  
  saveStudents(students);
  addNotification(`Logged daily attendance for ${cls} on ${dateString} (${updatedCount} records)`, 'success');
}

// Marks updates
export function saveStudentMarks(studentId, marksType, subjectMarks) {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    if (!students[index].marks) {
      students[index].marks = { internal: {}, semester: {} };
    }
    students[index].marks[marksType] = {
      ...students[index].marks[marksType],
      ...subjectMarks
    };
    saveStudents(students);
    addNotification(`Updated ${marksType} marks for ${students[index].name} (${students[index].rollNo})`, 'success');
    return students[index];
  }
  return null;
}

// Grade calculation helper
export function calculateGrade(internal, semester) {
  const total = Number(internal) + Number(semester); // Total out of 100
  if (total >= 90) return { grade: 'O', status: 'Pass', points: 10, total };
  if (total >= 80) return { grade: 'A+', status: 'Pass', points: 9, total };
  if (total >= 70) return { grade: 'A', status: 'Pass', points: 8, total };
  if (total >= 60) return { grade: 'B', status: 'Pass', points: 7, total };
  if (total >= 50) return { grade: 'C', status: 'Pass', points: 6, total };
  return { grade: 'F', status: 'Fail', points: 0, total };
}

// System Logs/Notifications Store
export function getNotifications() {
  return JSON.parse(localStorage.getItem('sms_notifications')) || [
    { text: 'System initialized successfully.', type: 'info', time: new Date().toLocaleTimeString() },
    { text: 'Database seed loaded: 183 students registered.', type: 'success', time: new Date().toLocaleTimeString() }
  ];
}

export function addNotification(text, type = 'info') {
  const list = getNotifications();
  list.unshift({
    text,
    type,
    time: new Date().toLocaleTimeString()
  });
  // Keep last 30 notifications
  localStorage.setItem('sms_notifications', JSON.stringify(list.slice(0, 30)));
  
  // Trigger custom event so active dashboard can live reload lists
  const event = new CustomEvent('notification-added', { detail: { text, type } });
  window.dispatchEvent(event);
}

// Classes CRUD Operations
export function getClasses() {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(KEY_CLASSES)) || [];
}

export function saveClasses(classes) {
  localStorage.setItem(KEY_CLASSES, JSON.stringify(classes));
  
  // Trigger dropdown updates and card updates
  const event = new CustomEvent('classes-updated');
  window.dispatchEvent(event);
  syncWithServer();
}

export function addClass(classData) {
  const classes = getClasses();
  if (classes.some(c => c.name.toLowerCase() === classData.name.toLowerCase().trim())) {
    return { success: false, error: 'Class name already exists.' };
  }

  const newClass = {
    name: classData.name.trim(),
    faculty: classData.faculty.trim()
  };

  classes.push(newClass);
  saveClasses(classes);
  addNotification(`Registered new class ${newClass.name} assigned to ${newClass.faculty}`, 'success');
  return { success: true, class: newClass };
}

export function updateClass(oldName, classData) {
  const classes = getClasses();
  const index = classes.findIndex(c => c.name.toLowerCase() === oldName.toLowerCase());
  
  if (index !== -1) {
    const newName = classData.name.trim();
    const newFaculty = classData.faculty.trim();
    
    // Check duplication if name changed
    if (oldName.toLowerCase() !== newName.toLowerCase() && 
        classes.some(c => c.name.toLowerCase() === newName.toLowerCase())) {
      return { success: false, error: 'Class name already exists.' };
    }

    classes[index].name = newName;
    classes[index].faculty = newFaculty;
    saveClasses(classes);
    
    // Cascade class renaming to students!
    if (oldName !== newName) {
      const students = getStudents();
      let updatedCount = 0;
      students.forEach(s => {
        if (s.class === oldName) {
          s.class = newName;
          
          const prefix = newName.replace('Class ', '').substring(0, 3).toUpperCase();
          const suffixNum = s.rollNo.split('-')[1] || '01';
          s.rollNo = `${prefix}-${suffixNum}`;
          
          updatedCount++;
        }
      });
      if (updatedCount > 0) {
        saveStudents(students);
      }
      addNotification(`Renamed class ${oldName} to ${newName} (cascaded to ${updatedCount} students)`, 'info');
    } else {
      addNotification(`Updated class details for ${newName}`, 'success');
    }
    
    return { success: true };
  }
  return { success: false, error: 'Class not found.' };
}

export function deleteClass(className) {
  const classes = getClasses();
  const index = classes.findIndex(c => c.name.toLowerCase() === className.toLowerCase());
  
  if (index !== -1) {
    classes.splice(index, 1);
    saveClasses(classes);
    
    // Cascade to students
    const students = getStudents();
    let affectedCount = 0;
    students.forEach(s => {
      if (s.class === className) {
        s.class = '';
        affectedCount++;
      }
    });
    if (affectedCount > 0) {
      saveStudents(students);
    }
    
    addNotification(`Deleted class ${className} (cleared assignments for ${affectedCount} students)`, 'warning');
    return true;
  }
  return false;
}

// Assignments & Submissions Operations
export function getAssignments() {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(KEY_ASSIGNMENTS)) || [];
}

export function getSubmissions() {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(KEY_SUBMISSIONS)) || [];
}

export function saveSubmissions(submissions) {
  localStorage.setItem(KEY_SUBMISSIONS, JSON.stringify(submissions));
  syncWithServer();
}

export function getStudentByEmail(email) {
  const students = getStudents();
  return students.find(s => s.email.toLowerCase() === email.toLowerCase().trim()) || null;
}

export function getStudentAssignments(className) {
  const assignments = getAssignments();
  return assignments.filter(a => a.class === className);
}

export function submitAssignment(studentId, assignmentId, text) {
  const submissions = getSubmissions();
  
  // Clear any existing submission for the same student & assignment
  const filtered = submissions.filter(sub => !(sub.studentId === studentId && sub.assignmentId === assignmentId));
  
  const newSubmission = {
    studentId,
    assignmentId,
    submissionText: text.trim(),
    submittedAt: new Date().toLocaleDateString()
  };

  filtered.push(newSubmission);
  saveSubmissions(filtered);
  
  const student = getStudents().find(s => s.id === studentId);
  const assignment = getAssignments().find(a => a.id === assignmentId);
  const studentName = student ? student.name : studentId;
  const assignmentTitle = assignment ? assignment.title : assignmentId;
  
  addNotification(`Student ${studentName} submitted assignment: "${assignmentTitle}"`, 'success');
  
  const event = new CustomEvent('assignment-submitted');
  window.dispatchEvent(event);
  
  return true;
}

export function getStudentSubmissions(studentId) {
  const submissions = getSubmissions();
  return submissions.filter(sub => sub.studentId === studentId);
}

export function updateUserProfile(username, profileData) {
  const users = getUsers();
  const user = users[username.toLowerCase()];
  if (user) {
    user.name = profileData.name.trim();
    user.phone = profileData.phone.trim();
    user.duty = profileData.duty.trim();
    
    users[username.toLowerCase()] = user;
    saveUsers(users);
    sessionStorage.setItem(KEY_SESSION, JSON.stringify(user));
    
    // If student, also update student profile record matching their email!
    if (user.role === 'student') {
      const students = getStudents();
      const index = students.findIndex(s => s.email.toLowerCase() === user.email.toLowerCase());
      if (index !== -1) {
        students[index].name = user.name;
        students[index].phone = user.phone;
        saveStudents(students);
      }
    }
    
    addNotification(`User ${user.email} updated profile details.`, 'success');
    return { success: true, user };
  }
  return { success: false, message: 'User not found.' };
}

// Dynamic Subjects CRUD helpers
export function getSubjects() {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(KEY_SUBJECTS)) || [];
}

export function saveSubjects(subjects) {
  localStorage.setItem(KEY_SUBJECTS, JSON.stringify(subjects));
  const event = new CustomEvent('subjects-updated');
  window.dispatchEvent(event);
  syncWithServer();
}

export function addSubject(subjectData) {
  const subjects = getSubjects();
  const code = subjectData.code.toUpperCase().trim();
  const name = subjectData.name.trim();

  if (subjects.some(s => s.code === code)) {
    return { success: false, error: 'Subject Code already exists.' };
  }
  if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
    return { success: false, error: 'Subject Name already exists.' };
  }

  const newSubject = { code, name };
  subjects.push(newSubject);
  saveSubjects(subjects);
  addNotification(`Created new subject: ${name} (${code})`, 'success');
  return { success: true, subject: newSubject };
}

export function deleteSubject(code) {
  const subjects = getSubjects();
  const index = subjects.findIndex(s => s.code === code);
  if (index !== -1) {
    const deletedName = subjects[index].name;
    subjects.splice(index, 1);
    saveSubjects(subjects);
    addNotification(`Deleted subject: ${deletedName} (${code})`, 'warning');
    return true;
  }
  return false;
}

// Remote server database synchronizations
export async function syncWithServer() {
  const payload = {
    students: localStorage.getItem(KEY_STUDENTS),
    users: localStorage.getItem(KEY_USERS),
    classes: localStorage.getItem(KEY_CLASSES),
    assignments: localStorage.getItem(KEY_ASSIGNMENTS),
    submissions: localStorage.getItem(KEY_SUBMISSIONS),
    subjects: localStorage.getItem(KEY_SUBJECTS)
  };
  try {
    await fetch('/api/save-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn('Network offline: saved to local browser cache only.', e);
  }
}

export async function initRemoteDatabaseSync() {
  try {
    const apiStudents = await fetchStudentsFromAPI();
    if (apiStudents && Array.isArray(apiStudents)) {
      const normalized = apiStudents.map(s => ({
        ...s,
        id: s.studentId || s.id || s._id
      }));
      localStorage.setItem(KEY_STUDENTS, JSON.stringify(normalized));
      
      window.dispatchEvent(new CustomEvent('reload-students-view'));
      window.dispatchEvent(new CustomEvent('reload-attendance-view'));
      window.dispatchEvent(new CustomEvent('reload-marks-view'));
      window.dispatchEvent(new CustomEvent('reload-approvals-view'));
      window.dispatchEvent(new CustomEvent('reload-subjects-view'));
      window.dispatchEvent(new CustomEvent('reload-student-academic-view'));
      window.dispatchEvent(new CustomEvent('reload-student-homework-view'));
      window.dispatchEvent(new CustomEvent('classes-updated'));
      window.dispatchEvent(new CustomEvent('subjects-updated'));
      window.dispatchEvent(new CustomEvent('database-synced'));
    }
  } catch (e) {
    console.warn('API sync fallback: using cached/local store.', e);
  }
}
