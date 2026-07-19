import { getStudents, saveClassAttendance, addNotification } from './store.js';
import { showToast } from './app.js';

// DOM Elements
const classSelect = document.getElementById('attendance-class-select');
const dateSelect = document.getElementById('attendance-date-select');
const entryTbody = document.getElementById('attendance-entry-tbody');
const saveBtn = document.getElementById('save-attendance-btn');

const allPresentBtn = document.getElementById('btn-quick-present');
const allAbsentBtn = document.getElementById('btn-quick-absent');

export function initAttendance() {
  // Set default date to today
  if (dateSelect) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateSelect.value = `${yyyy}-${mm}-${dd}`;
  }

  // Bind change events
  if (classSelect) classSelect.addEventListener('change', renderAttendanceSheet);
  if (dateSelect) dateSelect.addEventListener('change', renderAttendanceSheet);
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      handleSaveAttendance();
    });
  }

  // Quick Action Buttons
  if (allPresentBtn) {
    allPresentBtn.addEventListener('click', () => {
      document.querySelectorAll('.attendance-toggle-group').forEach(group => {
        setToggleState(group, 'present');
      });
      showToast('Marked all students as Present.', 'info');
    });
  }
  
  if (allAbsentBtn) {
    allAbsentBtn.addEventListener('click', () => {
      document.querySelectorAll('.attendance-toggle-group').forEach(group => {
        setToggleState(group, 'absent');
      });
      showToast('Marked all students as Absent.', 'warning');
    });
  }

  // SPA View Listener
  window.addEventListener('reload-attendance-view', () => {
    renderAttendanceSheet();
  });
}

function renderAttendanceSheet() {
  const cls = classSelect.value;
  const dateStr = dateSelect.value;
  if (!cls || !dateStr) return;

  const students = getStudents().filter(s => s.class === cls);
  students.sort((a, b) => a.rollNo.localeCompare(b.rollNo));

  if (students.length === 0) {
    entryTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No student records found in this class.</td></tr>`;
    return;
  }

  entryTbody.innerHTML = students.map(s => {
    // Check if attendance is already logged for this student on this date
    const loggedStatus = s.attendance && s.attendance[dateStr] ? s.attendance[dateStr] : 'present'; // Default to present if unlogged

    // Calculate historical attendance %
    let presentCount = 0;
    let totalLogs = 0;
    if (s.attendance) {
      Object.values(s.attendance).forEach(status => {
        totalLogs++;
        if (status === 'present' || status === 'late') presentCount++;
      });
    }
    const attRate = totalLogs > 0 ? parseFloat(((presentCount / totalLogs) * 100).toFixed(1)) : 100.0;
    
    // Warning tag
    let rateClass = 'present';
    if (attRate < 75) rateClass = 'absent';
    else if (attRate < 85) rateClass = 'warning';

    return `
      <tr data-student-id="${s.id}">
        <td><strong>${s.rollNo}</strong></td>
        <td>
          <a href="javascript:void(0)" onclick="openStudentProfile('${s.id}')" style="font-weight:700; color: var(--text-main);">
            ${s.name}
          </a>
        </td>
        <td>
          <span class="badge ${rateClass}">${attRate}%</span>
        </td>
        <td style="text-align: right;">
          <div class="attendance-toggle-group" data-status="${loggedStatus}">
            <button class="attendance-toggle-btn present ${loggedStatus === 'present' ? 'active' : ''}" 
                    onclick="selectAttendanceState(this, 'present')">P</button>
            <button class="attendance-toggle-btn absent ${loggedStatus === 'absent' ? 'active' : ''}" 
                    onclick="selectAttendanceState(this, 'absent')">A</button>
            <button class="attendance-toggle-btn late ${loggedStatus === 'late' ? 'active' : ''}" 
                    onclick="selectAttendanceState(this, 'late')">L</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Select tri-state toggler option
export function selectAttendanceState(btn, state) {
  const group = btn.parentElement;
  setToggleState(group, state);
}

function setToggleState(group, state) {
  group.setAttribute('data-status', state);
  
  group.querySelectorAll('.attendance-toggle-btn').forEach(b => {
    b.classList.remove('active');
  });
  
  const targetBtn = group.querySelector(`.attendance-toggle-btn.${state}`);
  if (targetBtn) {
    targetBtn.classList.add('active');
  }
}

// Gather screen values and save to database
function handleSaveAttendance() {
  const cls = classSelect.value;
  const dateStr = dateSelect.value;
  if (!cls || !dateStr) return;

  const attendanceMap = {};
  const rows = entryTbody.querySelectorAll('tr[data-student-id]');
  
  if (rows.length === 0) {
    showToast('No students loaded on the sheet.', 'warning');
    return;
  }

  rows.forEach(row => {
    const studentId = row.getAttribute('data-student-id');
    const group = row.querySelector('.attendance-toggle-group');
    const status = group ? group.getAttribute('data-status') : 'present';
    attendanceMap[studentId] = status;
  });

  saveClassAttendance(cls, dateStr, attendanceMap);
  showToast(`Attendance logs saved for ${cls} on ${dateStr}.`, 'success');
  
  // Re-render sheet to show updated historical percentages
  renderAttendanceSheet();
}

// Bind to window for row button onclick attributes
window.selectAttendanceState = selectAttendanceState;
