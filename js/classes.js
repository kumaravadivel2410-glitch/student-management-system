import { getStudents, calculateGrade, getClasses, addClass, updateClass, deleteClass, getActiveSession } from './store.js';

// Class modal DOM references
const classModal = document.getElementById('class-modal');
const classForm = document.getElementById('class-form');
const classModalTitle = document.getElementById('class-modal-title');
const classModalOldName = document.getElementById('class-modal-old-name');
const classModalName = document.getElementById('class-modal-name');
const classModalFaculty = document.getElementById('class-modal-faculty');

export function initClasses() {
  const addClassBtn = document.getElementById('add-class-btn');
  const classModalClose = document.getElementById('class-modal-close');
  const classModalCancel = document.getElementById('class-modal-cancel');
  
  if (addClassBtn) addClassBtn.addEventListener('click', () => openClassModal());
  if (classModalClose) classModalClose.addEventListener('click', closeClassModal);
  if (classModalCancel) classModalCancel.addEventListener('click', closeClassModal);
  
  if (classForm) {
    classForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleClassFormSubmit();
    });
  }

  // Live updates trigger
  window.addEventListener('reload-classes-view', () => {
    renderClassesView();
  });
  window.addEventListener('classes-updated', () => {
    renderClassesView();
  });

  renderClassesView();
}

export function renderClassesView() {
  const students = getStudents();
  const classes = getClasses();
  const container = document.getElementById('classes-grid-container');
  if (!container) return;
  
  const session = getActiveSession();
  const isAdmin = session && session.role === 'admin';
  
  if (classes.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px 20px;">
        <i class="fa-solid fa-graduation-cap" style="font-size: 2.5rem; margin-bottom: 12px; display: block; color: var(--text-muted);"></i>
        No classes registered. Click 'Add Class' to create your first class.
      </div>
    `;
    return;
  }
  
  container.innerHTML = classes.map(clsObj => {
    const clsName = clsObj.name;
    const classStudents = students.filter(s => s.class === clsName);
    const count = classStudents.length;
    
    let totalPresent = 0;
    let totalLogs = 0;
    let sumGpa = 0;
    
    classStudents.forEach(s => {
      // Attendance
      if (s.attendance) {
        Object.values(s.attendance).forEach(status => {
          totalLogs++;
          if (status === 'present' || status === 'late') totalPresent++;
        });
      }
      
      // GPA
      let studentGpaSum = 0;
      let subjectCount = 0;
      if (s.marks && s.marks.internal && s.marks.semester) {
        Object.keys(s.marks.internal).forEach(sub => {
          const intMark = s.marks.internal[sub] || 0;
          const semMark = s.marks.semester[sub] || 0;
          const grading = calculateGrade(intMark, semMark);
          studentGpaSum += grading.points;
          subjectCount++;
        });
      }
      sumGpa += subjectCount > 0 ? studentGpaSum / subjectCount : 10;
    });

    const classAvgAttendance = totalLogs > 0 
      ? ((totalPresent / totalLogs) * 100).toFixed(1)
      : '0.0';
      
    const classAvgGpa = count > 0
      ? (sumGpa / count).toFixed(2)
      : '0.00';
      
    return `
      <div class="class-card glass-panel" onclick="viewClassRoster('${clsName.replace(/'/g, "\\'")}')">
        <div class="class-card-header">
          <h3>${clsName}</h3>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge info">${count} Student${count === 1 ? '' : 's'}</span>
            ${isAdmin ? `
            <button class="action-icon-btn" onclick="event.stopPropagation(); editClassForm('${clsName.replace(/'/g, "\\'")}', '${clsObj.faculty.replace(/'/g, "\\'")}')" title="Edit Class Details">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="action-icon-btn delete-btn" onclick="event.stopPropagation(); confirmDeleteClass('${clsName.replace(/'/g, "\\'")}')" title="Erase Class">
              <i class="fa-solid fa-trash-can"></i>
            </button>
            ` : ''}
          </div>
        </div>
        <p style="font-size: 0.9rem; color: var(--text-muted);">Assigned Faculty: ${clsObj.faculty}</p>
        <div class="class-stats">
          <div class="class-stat-item">
            <span>Avg Attendance</span>
            <h4>${classAvgAttendance}%</h4>
          </div>
          <div class="class-stat-item">
            <span>Avg GPA</span>
            <h4>${classAvgGpa} / 10</h4>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openClassModal(oldName = null, currentFaculty = null) {
  if (!classModal) return;
  classForm.reset();
  
  if (oldName) {
    classModalTitle.textContent = `Edit Class Details`;
    classModalOldName.value = oldName;
    classModalName.value = oldName;
    classModalFaculty.value = currentFaculty || '';
  } else {
    classModalTitle.textContent = 'Register New Class';
    classModalOldName.value = '';
  }
  
  classModal.classList.add('active');
}

function closeClassModal() {
  if (classModal) classModal.classList.remove('active');
}

function handleClassFormSubmit() {
  const oldName = classModalOldName.value;
  const name = classModalName.value.trim();
  const faculty = classModalFaculty.value.trim();
  
  const classData = { name, faculty };
  
  let result;
  if (oldName) {
    result = updateClass(oldName, classData);
  } else {
    result = addClass(classData);
  }
  
  if (result.success) {
    const importToast = window.smsShowToast || (msg => alert(msg));
    importToast(oldName ? 'Class details updated successfully.' : 'New class registered successfully.', 'success');
    closeClassModal();
    renderClassesView();
  } else {
    alert(result.error || 'Failed to save class records.');
  }
}

function confirmDeleteClass(className) {
  if (confirm(`Are you sure you want to permanently delete the class registry for ${className}? This clears assignments for all registered students.`)) {
    const success = deleteClass(className);
    if (success) {
      const importToast = window.smsShowToast || (msg => alert(msg));
      importToast('Class registry records deleted.', 'warning');
      renderClassesView();
    }
  }
}

window.editClassForm = openClassModal;
window.confirmDeleteClass = confirmDeleteClass;

export function viewClassRoster(className) {
  const students = getStudents().filter(s => s.class === className);
  
  // Sort roster by roll number
  students.sort((a, b) => a.rollNo.localeCompare(b.rollNo));
  
  const rosterSection = document.getElementById('class-roster-section');
  const rosterTitle = document.getElementById('class-roster-title');
  const rosterTbody = document.getElementById('class-roster-tbody');
  
  if (!rosterSection || !rosterTitle || !rosterTbody) return;
  
  rosterTitle.textContent = `${className} Student Roster (${students.length} Registered)`;
  
  rosterTbody.innerHTML = students.map(s => {
    // Attendance rate
    let presentCount = 0;
    let totalLogs = 0;
    if (s.attendance) {
      Object.values(s.attendance).forEach(status => {
        totalLogs++;
        if (status === 'present' || status === 'late') presentCount++;
      });
    }
    const attRate = totalLogs > 0 ? parseFloat(((presentCount / totalLogs) * 100).toFixed(1)) : 100.0;
    
    // Average Grade
    let gpaSum = 0;
    let subCount = 0;
    let isPassing = true;
    
    if (s.marks && s.marks.internal && s.marks.semester) {
      Object.keys(s.marks.internal).forEach(sub => {
        subCount++;
        const intMark = s.marks.internal[sub] || 0;
        const semMark = s.marks.semester[sub] || 0;
        const grading = calculateGrade(intMark, semMark);
        gpaSum += grading.points;
        if (grading.status === 'Fail') isPassing = false;
      });
    }
    
    const avgGpa = subCount > 0 ? (gpaSum / subCount).toFixed(1) : '10.0';
    
    let attBadgeClass = 'present';
    if (attRate < 75) attBadgeClass = 'absent';
    else if (attRate < 85) attBadgeClass = 'warning';

    return `
      <tr>
        <td><strong>${s.rollNo}</strong></td>
        <td><span class="badge info" style="font-size:0.7rem; font-family:'Courier New', monospace;">${s.id}</span></td>
        <td>
          <a href="javascript:void(0)" onclick="openStudentProfile('${s.id}')" style="font-weight:700; border-bottom: 1px dashed var(--primary); color: var(--text-main);">
            ${s.name}
          </a>
        </td>
        <td>
          <span class="badge ${attBadgeClass}">${attRate}%</span>
        </td>
        <td><strong>${avgGpa} / 10</strong></td>
        <td>
          <span class="badge ${isPassing ? 'present' : 'absent'}">${isPassing ? 'Cleared' : 'Critical'}</span>
        </td>
        <td>
          <button class="action-icon-btn" onclick="openStudentProfile('${s.id}')" title="Inspect Full Dossier">
            <i class="fa-solid fa-folder-open"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Reveal roster list panel and scroll to it
  rosterSection.style.display = 'block';
  rosterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Bind view roster to window global for inline list click handlers
window.viewClassRoster = viewClassRoster;
