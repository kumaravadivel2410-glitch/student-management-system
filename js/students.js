import { getStudents, saveStudents, addStudent, updateStudent, deleteStudent, getActiveSession, deleteStudentsBulk, calculateGrade, getSubjects } from './store.js';
import { showToast } from './app.js';

// Local State
let currentPage = 1;
const itemsPerPage = 10;
let filteredStudents = [];
let studentToDeleteId = null;

// DOM Elements
const searchInput = document.getElementById('student-search-input');
const filterClass = document.getElementById('student-filter-class');
const tableBody = document.getElementById('students-table-body');
const prevPageBtn = document.getElementById('student-prev-page');
const nextPageBtn = document.getElementById('student-next-page');
const paginationInfo = document.getElementById('student-pagination-info');

const studentModal = document.getElementById('student-modal');
const studentForm = document.getElementById('student-form');
const studentModalTitle = document.getElementById('student-modal-title');
const addStudentBtn = document.getElementById('add-student-btn');
const studentModalClose = document.getElementById('student-modal-close');
const studentModalCancel = document.getElementById('student-modal-cancel');

const deleteModal = document.getElementById('delete-modal');
const deleteStudentName = document.getElementById('delete-student-name');
const deleteConfirmBtn = document.getElementById('delete-modal-confirm');
const deleteCancelBtn = document.getElementById('delete-modal-cancel');

const profileDrawer = document.getElementById('profile-detail-drawer');
const profileDrawerClose = document.getElementById('profile-drawer-close');

export function initStudents() {
  // Set up listeners
  if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; renderStudentsTable(); });
  if (filterClass) filterClass.addEventListener('change', () => { currentPage = 1; renderStudentsTable(); });
  
  if (prevPageBtn) prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderStudentsTable(); } });
  if (nextPageBtn) nextPageBtn.addEventListener('click', () => { if (currentPage < Math.ceil(filteredStudents.length / itemsPerPage)) { currentPage++; renderStudentsTable(); } });

  // Modal actions
  if (addStudentBtn) addStudentBtn.addEventListener('click', () => openStudentModal());
  if (studentModalClose) studentModalClose.addEventListener('click', closeStudentModal);
  if (studentModalCancel) studentModalCancel.addEventListener('click', closeStudentModal);
  
  if (studentForm) {
    studentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit();
    });
  }

  // Delete modal actions
  if (deleteCancelBtn) deleteCancelBtn.addEventListener('click', closeDeleteModal);
  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener('click', () => {
      if (studentToDeleteId) {
        const success = deleteStudent(studentToDeleteId);
        if (success) {
          showToast('Student record deleted.', 'warning');
          closeDeleteModal();
          renderStudentsTable();
        }
      }
    });
  }

  // Profile drawer action
  if (profileDrawerClose) profileDrawerClose.addEventListener('click', closeProfileDrawer);

  // SPA Event hook to reload table when view is selected
  window.addEventListener('reload-students-view', (e) => {
    renderStudentsTable();
    if (e.detail && e.detail.openAddForm) {
      openStudentModal();
    }
  });

  // Bulk selection and bulk delete actions
  const selectAllCheckbox = document.getElementById('student-select-all');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      document.querySelectorAll('.student-select').forEach(cb => {
        cb.checked = isChecked;
      });
      updateBulkDeleteButtonState();
    });
  }

  const studentsTable = document.getElementById('students-table');
  if (studentsTable) {
    studentsTable.addEventListener('change', (e) => {
      if (e.target.classList.contains('student-select')) {
        updateBulkDeleteButtonState();
      }
    });
  }

  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', () => {
      const checkedCheckboxes = document.querySelectorAll('.student-select:checked');
      const ids = Array.from(checkedCheckboxes).map(cb => cb.getAttribute('data-id'));
      
      if (ids.length > 0) {
        if (confirm(`Are you sure you want to permanently delete the ${ids.length} selected student records?`)) {
          deleteStudentsBulk(ids);
          showToast(`Successfully deleted ${ids.length} student records.`, 'warning');
          
          if (selectAllCheckbox) selectAllCheckbox.checked = false;
          bulkDeleteBtn.style.display = 'none';
          
          const remainingCount = filteredStudents.length - ids.length;
          const totalPages = Math.ceil(remainingCount / itemsPerPage) || 1;
          if (currentPage > totalPages) {
            currentPage = totalPages;
          }
          
          renderStudentsTable();
        }
      }
    });
  }
}

export function renderStudentsTable() {
  const students = getStudents();
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterVal = filterClass ? filterClass.value : 'all';
  
  // Filter students
  filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchVal) || 
                          s.id.toLowerCase().includes(searchVal) || 
                          s.email.toLowerCase().includes(searchVal) ||
                          s.phone.toLowerCase().includes(searchVal) ||
                          s.rollNo.toLowerCase().includes(searchVal);
                          
    const matchesClass = filterVal === 'all' || s.class === filterVal;
    
    return matchesSearch && matchesClass;
  });

  // Sort by Roll Number
  filteredStudents.sort((a, b) => a.rollNo.localeCompare(b.rollNo));

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  // Slice pagination range
  const startIdx = (currentPage - 1) * itemsPerPage;
  const pageStudents = filteredStudents.slice(startIdx, startIdx + itemsPerPage);

  const session = getActiveSession();
  const isAdmin = session && session.role === 'admin';
  const isFaculty = session && session.role === 'faculty';

  // Toggle Add Student button visibility
  if (addStudentBtn) {
    addStudentBtn.style.display = isFaculty ? 'inline-flex' : 'none';
  }

  // Toggle checkbox header column visibility in HTML
  const selectAllTh = document.querySelector('#students-table th:first-child');
  if (selectAllTh) {
    selectAllTh.style.display = isAdmin ? 'table-cell' : 'none';
  }

  const colSpanVal = isAdmin ? 8 : 7;

  // Render rows
  if (students.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${colSpanVal}" style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
      <i class="fa-solid fa-users" style="font-size: 2rem; margin-bottom: 12px; display: block; color: var(--text-muted);"></i>
      No students found. ${isFaculty ? "Click 'Add Student' to create your first student." : ""}
    </td></tr>`;
  } else if (pageStudents.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${colSpanVal}" style="text-align: center; color: var(--text-muted); padding: 40px 20px;">No student records found matching parameters.</td></tr>`;
  } else {
    tableBody.innerHTML = pageStudents.map(s => `
      <tr>
        ${isAdmin ? `<td style="text-align: center;"><input type="checkbox" class="student-select" data-id="${s.id}" style="cursor: pointer; transform: scale(1.1);"></td>` : ''}
        <td><strong>${s.rollNo}</strong></td>
        <td><span class="badge info" style="font-size:0.7rem; font-family:'Courier New', monospace;">${s.id}</span></td>
        <td>
          <a href="javascript:void(0)" onclick="openStudentProfile('${s.id}')" style="font-weight:700; border-bottom: 1px dashed var(--primary); color: var(--text-main);">
            ${s.name}
          </a>
        </td>
        <td>${s.class}</td>
        <td><span style="font-size:0.85rem; color:var(--text-muted);">${s.email}</span></td>
        <td><span style="font-size:0.85rem;">${s.phone}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-icon-btn" onclick="openStudentProfile('${s.id}')" title="View Profile">
              <i class="fa-solid fa-eye"></i>
            </button>
            ${isFaculty ? `
            <button class="action-icon-btn" onclick="editStudentForm('${s.id}')" title="Edit Student">
              <i class="fa-solid fa-user-pen"></i>
            </button>` : ''}
            ${isAdmin ? `
            <button class="action-icon-btn delete-btn" onclick="confirmDeleteStudent('${s.id}', '${s.name.replace(/'/g, "\\'")}')" title="Erase Record">
              <i class="fa-solid fa-trash-can"></i>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Reset checkboxes states
  const selectAllCheckbox = document.getElementById('student-select-all');
  if (selectAllCheckbox) selectAllCheckbox.checked = false;
  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  if (bulkDeleteBtn) bulkDeleteBtn.style.display = 'none';

  // Update labels and paginator buttons state
  if (paginationInfo) {
    const showingStart = filteredStudents.length === 0 ? 0 : startIdx + 1;
    const showingEnd = Math.min(startIdx + itemsPerPage, filteredStudents.length);
    paginationInfo.textContent = `Showing ${showingStart} to ${showingEnd} of ${filteredStudents.length} students`;
  }

  if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
}

// Modal Form handling
function openStudentModal(studentId = null) {
  if (!studentModal) return;
  studentForm.reset();
  
  if (studentId) {
    // Edit Mode
    const students = getStudents();
    const student = students.find(s => s.id === studentId);
    if (student) {
      studentModalTitle.textContent = `Edit Record: ${student.name} (${student.rollNo})`;
      document.getElementById('student-modal-id').value = student.id;
      document.getElementById('student-modal-name').value = student.name;
      document.getElementById('student-modal-class').value = student.class;
      document.getElementById('student-modal-rollno').value = student.rollNo;
      document.getElementById('student-modal-email').value = student.email;
      document.getElementById('student-modal-phone').value = student.phone;
      
      document.getElementById('student-modal-department').value = student.department || '';
      document.getElementById('student-modal-semester').value = student.semester || 'Semester 1';
      document.getElementById('student-modal-year').value = student.year || '1st Year';
      document.getElementById('student-modal-dob').value = student.dob || '';
      document.getElementById('student-modal-gender').value = student.gender || 'Male';
      document.getElementById('student-modal-parent-name').value = student.parentName || '';
      document.getElementById('student-modal-parent-phone').value = student.parentPhone || '';
      document.getElementById('student-modal-address').value = student.address || '';
    }
  } else {
    // Add Mode
    studentModalTitle.textContent = 'Register New Student';
    document.getElementById('student-modal-id').value = '';
    document.getElementById('student-modal-rollno').value = '';
    document.getElementById('student-modal-department').value = '';
    document.getElementById('student-modal-semester').value = 'Semester 1';
    document.getElementById('student-modal-year').value = '1st Year';
    document.getElementById('student-modal-dob').value = '';
    document.getElementById('student-modal-gender').value = 'Male';
    document.getElementById('student-modal-parent-name').value = '';
    document.getElementById('student-modal-parent-phone').value = '';
    document.getElementById('student-modal-address').value = '';
  }
  
  studentModal.classList.add('active');
}

function closeStudentModal() {
  if (studentModal) studentModal.classList.remove('active');
}

function handleFormSubmit() {
  const session = getActiveSession();
  if (!session || session.role !== 'faculty') {
    showToast('Permission Denied: Only faculty members can edit student details.', 'danger');
    closeStudentModal();
    return;
  }

  const id = document.getElementById('student-modal-id').value;
  const name = document.getElementById('student-modal-name').value.trim();
  const cls = document.getElementById('student-modal-class').value;
  const rollNo = document.getElementById('student-modal-rollno').value.trim();
  const email = document.getElementById('student-modal-email').value.trim();
  const phone = document.getElementById('student-modal-phone').value.trim();
  
  const department = document.getElementById('student-modal-department').value.trim();
  const semester = document.getElementById('student-modal-semester').value;
  const year = document.getElementById('student-modal-year').value;
  const dob = document.getElementById('student-modal-dob').value;
  const gender = document.getElementById('student-modal-gender').value;
  const parentName = document.getElementById('student-modal-parent-name').value.trim();
  const parentPhone = document.getElementById('student-modal-parent-phone').value.trim();
  const address = document.getElementById('student-modal-address').value.trim();

  const data = { 
    name, 
    class: cls, 
    rollNo, 
    email, 
    phone, 
    department, 
    semester, 
    year,
    dob, 
    gender, 
    parentName, 
    parentPhone, 
    address 
  };

  if (id) {
    // Update
    updateStudent(id, data);
    showToast('Student record updated successfully.', 'success');
  } else {
    // Create
    addStudent(data);
    showToast('New student registered successfully.', 'success');
  }
  
  closeStudentModal();
  renderStudentsTable();
}

// Confirm Delete
function confirmDeleteStudent(id, name) {
  studentToDeleteId = id;
  if (deleteStudentName) deleteStudentName.textContent = name;
  if (deleteModal) deleteModal.classList.add('active');
}

function closeDeleteModal() {
  if (deleteModal) deleteModal.classList.remove('active');
  studentToDeleteId = null;
}

// Profile drawer methods
export function openProfileDrawer(studentId) {
  if (!profileDrawer) return;
  
  const students = getStudents();
  const student = students.find(s => s.id === studentId);
  if (!student) return;

  // Set Profile drawer content
  document.getElementById('drawer-avatar').textContent = student.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('drawer-name').textContent = student.name;
  document.getElementById('drawer-id-roll').textContent = `${student.id} | Roll No: ${student.rollNo}`;
  document.getElementById('drawer-class').textContent = student.class;
  document.getElementById('drawer-department').textContent = student.department || 'N/A';
  document.getElementById('drawer-semester').textContent = student.semester || 'N/A';
  document.getElementById('drawer-year').textContent = student.year || 'N/A';
  document.getElementById('drawer-email').textContent = student.email;
  document.getElementById('drawer-phone').textContent = student.phone;
  document.getElementById('drawer-dob').textContent = student.dob || 'N/A';
  document.getElementById('drawer-gender').textContent = student.gender || 'N/A';
  document.getElementById('drawer-parent-name').textContent = student.parentName || 'N/A';
  document.getElementById('drawer-parent-phone').textContent = student.parentPhone || 'N/A';
  document.getElementById('drawer-address').textContent = student.address || 'N/A';

  // Calculate stats
  let totalLogs = 0;
  let presentLogs = 0;
  if (student.attendance) {
    Object.values(student.attendance).forEach(status => {
      totalLogs++;
      if (status === 'present' || status === 'late') presentLogs++;
    });
  }
  const attendanceRate = totalLogs > 0 ? ((presentLogs / totalLogs) * 100).toFixed(1) : '100.0';
  const attendanceText = document.getElementById('drawer-attendance-rate');
  attendanceText.textContent = `${attendanceRate}%`;
  
  // Color code attendance stats
  if (parseFloat(attendanceRate) < 75) {
    attendanceText.className = 'value badge absent';
  } else if (parseFloat(attendanceRate) < 85) {
    attendanceText.className = 'value badge warning';
  } else {
    attendanceText.className = 'value badge present';
  }

  // Calculate GPA & Render subjects marks breakdown
  const marksTbody = document.getElementById('drawer-marks-tbody');
  let subjectRows = '';
  let sumGradePoints = 0;
  let subCount = 0;
  let passStatus = 'Pass';

  if (student.marks && student.marks.internal && student.marks.semester) {
    const activeSubjectNames = getSubjects().map(s => s.name);
    const subjects = Object.keys(student.marks.internal).filter(sub => activeSubjectNames.includes(sub));
    subjects.forEach(sub => {
      subCount++;
      const intMark = student.marks.internal[sub] || 0;
      const semMark = student.marks.semester[sub] || 0;
      
      const grading = calculateGrade(intMark, semMark);
      sumGradePoints += grading.points;
      
      if (grading.status === 'Fail') {
        passStatus = 'Fail';
      }

      subjectRows += `
        <tr>
          <td style="padding: 8px; font-weight:600;">${sub}</td>
          <td style="padding: 8px; text-align:center;">${intMark}</td>
          <td style="padding: 8px; text-align:center;">${semMark}</td>
          <td style="padding: 8px;">
            <span class="grade-box ${grading.grade.replace('+', 'p')}">${grading.grade}</span>
          </td>
        </tr>
      `;
    });
  }

  marksTbody.innerHTML = subjectRows || `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No evaluation records.</td></tr>`;

  const avgGpa = subCount > 0 ? (sumGradePoints / subCount).toFixed(2) : '0.00';
  document.getElementById('drawer-gpa-val').textContent = `${avgGpa} / 10.00`;
  
  const passEl = document.getElementById('drawer-pass-status');
  passEl.textContent = passStatus;
  passEl.className = `value badge ${passStatus === 'Pass' ? 'present' : 'absent'}`;

  // Slide drawer open
  profileDrawer.classList.add('active');
}

function closeProfileDrawer() {
  if (profileDrawer) profileDrawer.classList.remove('active');
}

function updateBulkDeleteButtonState() {
  const selectAllCheckbox = document.getElementById('student-select-all');
  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  const bulkDeleteCount = document.getElementById('bulk-delete-count');
  
  if (!bulkDeleteBtn || !bulkDeleteCount) return;
  
  const checkboxes = document.querySelectorAll('.student-select');
  const checkedCheckboxes = document.querySelectorAll('.student-select:checked');
  
  const selectedCount = checkedCheckboxes.length;
  bulkDeleteCount.textContent = selectedCount;
  
  if (selectedCount > 0) {
    bulkDeleteBtn.style.display = 'inline-flex';
  } else {
    bulkDeleteBtn.style.display = 'none';
  }
  
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = checkboxes.length > 0 && selectedCount === checkboxes.length;
  }
}

// Expose functions globally for dynamic row HTML events
window.openStudentProfile = openProfileDrawer;
window.editStudentForm = openStudentModal;
window.confirmDeleteStudent = confirmDeleteStudent;
