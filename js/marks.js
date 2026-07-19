import { getStudents, saveStudentMarks, calculateGrade } from './store.js';
import { showToast } from './app.js';

// DOM Elements
const classSelect = document.getElementById('marks-class-select');
const typeSelect = document.getElementById('marks-type-select');
const subjectSelect = document.getElementById('marks-subject-select');
const entryTbody = document.getElementById('marks-entry-tbody');

export function initMarks() {
  if (classSelect) classSelect.addEventListener('change', renderMarksSheet);
  if (typeSelect) typeSelect.addEventListener('change', renderMarksSheet);
  if (subjectSelect) subjectSelect.addEventListener('change', renderMarksSheet);
  
  // SPA View Listener
  window.addEventListener('reload-marks-view', () => {
    renderMarksSheet();
  });
}

function renderMarksSheet() {
  const cls = classSelect.value;
  const marksType = typeSelect.value; // 'internal' or 'semester'
  const subject = subjectSelect.value;
  
  if (!cls || !marksType || !subject) return;
  
  const students = getStudents().filter(s => s.class === cls);
  students.sort((a, b) => a.rollNo.localeCompare(b.rollNo));
  
  if (students.length === 0) {
    entryTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No student records found in this class.</td></tr>`;
    return;
  }

  const maxScore = marksType === 'internal' ? 40 : 60;
  
  entryTbody.innerHTML = students.map(s => {
    // Current value
    const curScore = s.marks && s.marks[marksType] && s.marks[marksType][subject] !== undefined
      ? s.marks[marksType][subject]
      : 0;
      
    // Look up the matching score of the other stage to compute total term grade
    const otherType = marksType === 'internal' ? 'semester' : 'internal';
    const otherScore = s.marks && s.marks[otherType] && s.marks[otherType][subject] !== undefined
      ? s.marks[otherType][subject]
      : 0;
      
    const internalVal = marksType === 'internal' ? curScore : otherScore;
    const semesterVal = marksType === 'semester' ? curScore : otherScore;
    const grading = calculateGrade(internalVal, semesterVal);

    return `
      <tr data-student-id="${s.id}">
        <td><strong>${s.rollNo}</strong></td>
        <td>
          <a href="javascript:void(0)" onclick="openStudentProfile('${s.id}')" style="font-weight:700; color: var(--text-main);">
            ${s.name}
          </a>
        </td>
        <td><span style="font-size:0.9rem; color:var(--text-muted);">${subject}</span></td>
        <td>
          <div class="marks-edit-inputs">
            <input type="number" 
                   class="marks-input-field" 
                   value="${curScore}" 
                   min="0" 
                   max="${maxScore}"
                   data-other-score="${otherScore}"
                   onblur="updateStudentScore(this, '${s.id}', '${marksType}', '${subject}', ${maxScore})"
                   oninput="previewStudentGrade(this, ${maxScore})"
            >
            <span style="align-self: center; font-size: 0.85rem; color: var(--text-muted);">/ ${maxScore}</span>
          </div>
        </td>
        <td>
          <span class="grade-box-wrapper">
            <span class="grade-box ${grading.grade.replace('+', 'p')}">${grading.grade}</span>
            <span style="font-size:0.8rem; margin-left: 8px; font-weight:600;">(Total: ${grading.total}/100)</span>
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// Handle score typing to preview grade calculation live
export function previewStudentGrade(input, maxVal) {
  let val = parseInt(input.value) || 0;
  if (val < 0) val = 0;
  if (val > maxVal) val = maxVal;
  
  const otherScore = parseInt(input.getAttribute('data-other-score')) || 0;
  const isInternal = maxVal === 40;
  
  const intVal = isInternal ? val : otherScore;
  const semVal = isInternal ? otherScore : val;
  
  const grading = calculateGrade(intVal, semVal);
  
  // Find grade badge in the current row
  const row = input.closest('tr');
  const badgeWrapper = row.querySelector('.grade-box-wrapper');
  if (badgeWrapper) {
    badgeWrapper.innerHTML = `
      <span class="grade-box ${grading.grade.replace('+', 'p')}">${grading.grade}</span>
      <span style="font-size:0.8rem; margin-left: 8px; font-weight:600;">(Total: ${grading.total}/100)</span>
    `;
  }
}

// Triggered on input blur: validate and save score
export function updateStudentScore(input, studentId, marksType, subject, maxVal) {
  let val = parseInt(input.value);
  
  // Validation bounds
  if (isNaN(val) || val < 0) val = 0;
  if (val > maxVal) val = maxVal;
  
  input.value = val;
  
  // Save to database
  const scoreObj = { [subject]: val };
  saveStudentMarks(studentId, marksType, scoreObj);
  
  // Update other-score properties inside the DOM row just in case
  const otherType = marksType === 'internal' ? 'semester' : 'internal';
  
  // Refresh the data state of the input itself
  input.setAttribute('value', val);
  
  // Find other input fields or update attributes
  const rows = entryTbody.querySelectorAll('tr[data-student-id]');
  rows.forEach(r => {
    if (r.getAttribute('data-student-id') === studentId) {
      // Recompute details
      const otherScore = parseInt(input.getAttribute('data-other-score')) || 0;
      const intVal = marksType === 'internal' ? val : otherScore;
      const semVal = marksType === 'semester' ? val : otherScore;
      
      const grading = calculateGrade(intVal, semVal);
      const badgeWrapper = r.querySelector('.grade-box-wrapper');
      if (badgeWrapper) {
        badgeWrapper.innerHTML = `
          <span class="grade-box ${grading.grade.replace('+', 'p')}">${grading.grade}</span>
          <span style="font-size:0.8rem; margin-left: 8px; font-weight:600;">(Total: ${grading.total}/100)</span>
        `;
      }
    }
  });

  showToast(`Score updated for student ID ${studentId}.`, 'success');
}

// Bind to window for HTML events execution
window.previewStudentGrade = previewStudentGrade;
window.updateStudentScore = updateStudentScore;
