import { getActiveSession, getStudentByEmail, calculateGrade, getStudentAssignments, getStudentSubmissions, submitAssignment, getSubjects } from './store.js';
import { showToast } from './app.js';

// DOM elements
const homeworkSubmitModal = document.getElementById('homework-submit-modal');
const homeworkSubmitForm = document.getElementById('homework-submit-form');
const homeworkModalId = document.getElementById('homework-modal-id');
const homeworkModalTitle = document.getElementById('homework-modal-lbl-title');
const homeworkModalDesc = document.getElementById('homework-modal-lbl-desc');
const homeworkModalText = document.getElementById('homework-modal-text');

export function initStudentPortal() {
  // Listeners
  window.addEventListener('reload-student-academic-view', () => {
    loadStudentAcademicView();
  });

  window.addEventListener('reload-student-homework-view', () => {
    loadStudentAssignmentsView();
  });

  window.addEventListener('assignment-submitted', () => {
    loadStudentAssignmentsView();
  });

  // Modal Closures
  const closeBtn = document.getElementById('homework-modal-close');
  const cancelBtn = document.getElementById('homework-modal-cancel');
  if (closeBtn) closeBtn.addEventListener('click', closeHomeworkModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeHomeworkModal);

  // Form submission
  if (homeworkSubmitForm) {
    homeworkSubmitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const user = getActiveSession();
      if (!user || user.role !== 'student') return;

      const student = getStudentByEmail(user.email);
      if (!student) {
        showToast('Error: No linked student record found.', 'danger');
        return;
      }

      const assignmentId = homeworkModalId.value;
      const submissionText = homeworkModalText.value;

      const success = submitAssignment(student.id, assignmentId, submissionText);
      if (success) {
        showToast('Assignment submitted successfully!', 'success');
        closeHomeworkModal();
      }
    });
  }
}

export function loadStudentAcademicView() {
  const user = getActiveSession();
  if (!user || user.role !== 'student') return;

  const student = getStudentByEmail(user.email);
  if (!student) {
    // Render placeholder
    document.getElementById('student-card-name').textContent = user.name;
    document.getElementById('student-card-email').textContent = user.email;
    return;
  }

  // Populate particulars card
  document.getElementById('student-card-name').textContent = student.name;
  document.getElementById('student-card-id').textContent = student.id;
  document.getElementById('student-card-roll').textContent = student.rollNo;
  document.getElementById('student-card-class').textContent = student.class || 'Unassigned';
  document.getElementById('student-card-email').textContent = student.email;
  document.getElementById('student-card-phone').textContent = student.phone;
  document.getElementById('student-card-avatar').textContent = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // Calculate attendance rate percentage
  const attendanceRateVal = document.getElementById('student-kpi-attendance');
  const attendanceProgress = document.getElementById('student-kpi-attendance-progress');
  
  if (attendanceRateVal && attendanceProgress) {
    const dates = Object.values(student.attendance || {});
    if (dates.length === 0) {
      attendanceRateVal.textContent = '100%';
      attendanceProgress.style.width = '100%';
    } else {
      const presents = dates.filter(status => status === 'present').length;
      const percentage = Math.round((presents / dates.length) * 100);
      attendanceRateVal.textContent = `${percentage}%`;
      attendanceProgress.style.width = `${percentage}%`;
    }
  }

  // Render subject scores list and calculate GPA
  const gradesTbody = document.getElementById('student-grades-tbody');
  const gpaVal = document.getElementById('student-kpi-gpa');
  const termStatusVal = document.getElementById('student-term-status');

  if (gradesTbody) {
    const subjects = getSubjects().map(s => s.name);
    let totalPoints = 0;
    let counts = 0;
    let failed = false;

    const rowsHtml = subjects.map(sub => {
      const internal = (student.marks && student.marks.internal && student.marks.internal[sub]) !== undefined 
                       ? student.marks.internal[sub] : 0;
      const semester = (student.marks && student.marks.semester && student.marks.semester[sub]) !== undefined 
                       ? student.marks.semester[sub] : 0;
      
      const evalResult = calculateGrade(internal, semester);
      totalPoints += evalResult.points;
      counts++;
      if (evalResult.grade === 'F') failed = true;

      return `
        <tr>
          <td><strong>${sub}</strong></td>
          <td>${internal} / 40</td>
          <td>${semester} / 60</td>
          <td><strong>${evalResult.total} / 100</strong></td>
          <td>${evalResult.points}</td>
          <td><span class="badge ${evalResult.grade === 'F' ? 'danger' : 'success'}">${evalResult.grade}</span></td>
        </tr>
      `;
    }).join('');

    gradesTbody.innerHTML = rowsHtml;

    const avgGpa = counts > 0 ? (totalPoints / counts).toFixed(2) : '0.00';
    if (gpaVal) gpaVal.textContent = `${avgGpa} / 10.00`;

    if (termStatusVal) {
      if (failed) {
        termStatusVal.textContent = 'Term Status: Fail';
        termStatusVal.className = 'badge danger';
      } else {
        termStatusVal.textContent = 'Term Status: Pass';
        termStatusVal.className = 'badge success';
      }
    }
  }
}

export function loadStudentAssignmentsView() {
  const user = getActiveSession();
  if (!user || user.role !== 'student') return;

  const student = getStudentByEmail(user.email);
  const container = document.getElementById('student-homework-grid');
  if (!container) return;

  if (!student || !student.class) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">
        <i class="fa-solid fa-graduation-cap" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
        You are not assigned to any academic class. Homework lists are empty.
      </div>
    `;
    return;
  }

  const assignments = getStudentAssignments(student.class);
  const submissions = getStudentSubmissions(student.id);

  if (assignments.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">
        <i class="fa-solid fa-calendar-check" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
        No assignments currently assigned to your class (${student.class}).
      </div>
    `;
    return;
  }

  container.innerHTML = assignments.map(a => {
    const submission = submissions.find(sub => sub.assignmentId === a.id);
    const isSubmitted = !!submission;

    return `
      <div class="glass-panel" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; border-left: 4px solid ${isSubmitted ? '#10b981' : 'var(--secondary)'};">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="badge info" style="font-size:0.75rem;">${a.subject}</span>
            <span class="badge ${isSubmitted ? 'success' : 'warning'}" style="font-size:0.7rem;">
              ${isSubmitted ? 'Submitted' : 'Pending'}
            </span>
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 6px;">${a.title}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">${a.description}</p>
        </div>
        
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-bottom: 12px;">
            <span style="color: var(--text-muted);">Due Date:</span>
            <strong>${a.dueDate}</strong>
          </div>
          ${isSubmitted ? `
            <div style="background: rgba(16, 185, 129, 0.05); padding: 10px; border-radius: 4px; font-size: 0.75rem; border: 1px dashed rgba(16, 185, 129, 0.2); word-break: break-word;">
              <span style="color: #10b981; font-weight: 700; display: block; margin-bottom: 4px;">My Solution (Submitted on ${submission.submittedAt}):</span>
              ${submission.submissionText}
            </div>
          ` : `
            <button class="btn btn-sm" onclick="openHomeworkSubmissionModal('${a.id}', '${a.title.replace(/'/g, "\\'")}', '${a.description.replace(/'/g, "\\'")}')" style="width: 100%; height: 38px;">
              <i class="fa-solid fa-paper-plane"></i> Submit Solution
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function openHomeworkSubmissionModal(id, title, description) {
  if (!homeworkSubmitModal) return;
  homeworkModalId.value = id;
  homeworkModalTitle.textContent = title;
  homeworkModalDesc.textContent = description;
  homeworkModalText.value = '';
  
  homeworkSubmitModal.classList.add('active');
}

function closeHomeworkModal() {
  if (homeworkSubmitModal) {
    homeworkSubmitModal.classList.remove('active');
  }
}

// Bind to window for inline calls
window.openHomeworkSubmissionModal = openHomeworkSubmissionModal;
