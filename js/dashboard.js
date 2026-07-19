import { getStudents, getNotifications, calculateGrade, getClasses } from './store.js';

export function initDashboard() {
  // Listen for real-time notifications updates
  window.addEventListener('notification-added', () => {
    renderNotifications();
  });
  
  // Listen for class updates to live-reload counters
  window.addEventListener('classes-updated', () => {
    loadDashboard();
  });
  
  // Render initial dashboard data
  loadDashboard();
}

export function loadDashboard() {
  const students = getStudents();
  
  // Calculate KPIs
  const totalStudents = students.length;
  document.getElementById('kpi-total-students').textContent = totalStudents;
  
  // Count registered classes
  const classes = getClasses();
  document.getElementById('kpi-total-classes').textContent = classes.length;
  
  // Calculate Average Attendance Rate
  let totalPresentCount = 0;
  let totalAttendanceLogs = 0;
  
  students.forEach(s => {
    if (s.attendance) {
      Object.values(s.attendance).forEach(status => {
        totalAttendanceLogs++;
        if (status === 'present' || status === 'late') {
          totalPresentCount++;
        }
      });
    }
  });
  
  const avgAttendance = totalAttendanceLogs > 0 
    ? ((totalPresentCount / totalAttendanceLogs) * 100).toFixed(1)
    : '0.0';
  document.getElementById('kpi-avg-attendance').textContent = `${avgAttendance}%`;
  
  // Calculate Pass Rate
  let passedCount = 0;
  students.forEach(s => {
    let studentPassed = true;
    let subjectCount = 0;
    
    // Check marks
    if (s.marks && s.marks.internal && s.marks.semester) {
      const subjects = Object.keys(s.marks.internal);
      subjects.forEach(sub => {
        subjectCount++;
        const intMark = s.marks.internal[sub] || 0;
        const semMark = s.marks.semester[sub] || 0;
        const grading = calculateGrade(intMark, semMark);
        if (grading.status === 'Fail') {
          studentPassed = false;
        }
      });
    }
    
    if (subjectCount > 0 && studentPassed) {
      passedCount++;
    }
  });
  
  const passRate = totalStudents > 0 
    ? ((passedCount / totalStudents) * 100).toFixed(1)
    : '0.0';
  document.getElementById('kpi-pass-rate').textContent = `${passRate}%`;
  
  // Render notification feed
  renderNotifications();
  
  // Render Critical Attendance warnings list
  renderAttendanceWarnings(students);
}

function renderNotifications() {
  const container = document.getElementById('dashboard-notification-list');
  if (!container) return;
  
  const notifications = getNotifications();
  
  if (notifications.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 20px;">No alerts.</div>`;
    return;
  }
  
  container.innerHTML = notifications.map(notif => {
    let typeClass = notif.type || 'info';
    return `
      <div class="notification-item ${typeClass}">
        <p>${notif.text}</p>
        <span class="time">${notif.time}</span>
      </div>
    `;
  }).join('');
}

// Render student warning list (attendance under 75%)
function renderAttendanceWarnings(students) {
  const tbody = document.getElementById('dashboard-warnings-tbody');
  const countEl = document.getElementById('dashboard-warning-count');
  if (!tbody || !countEl) return;

  const flagged = [];

  students.forEach(s => {
    let presentCount = 0;
    let totalLogs = 0;
    if (s.attendance) {
      Object.values(s.attendance).forEach(status => {
        totalLogs++;
        if (status === 'present' || status === 'late') presentCount++;
      });
    }
    const rate = totalLogs > 0 ? parseFloat(((presentCount / totalLogs) * 100).toFixed(1)) : 100.0;
    if (rate < 75) {
      flagged.push({
        id: s.id,
        rollNo: s.rollNo,
        name: s.name,
        class: s.class,
        rate
      });
    }
  });

  // Sort by rate ascending (lowest first)
  flagged.sort((a, b) => a.rate - b.rate);

  countEl.textContent = `${flagged.length} students flagged`;

  if (flagged.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">All students meet the 75% attendance threshold.</td></tr>`;
  } else {
    tbody.innerHTML = flagged.map(s => `
      <tr>
        <td><strong>${s.rollNo}</strong></td>
        <td>
          <a href="javascript:void(0)" onclick="openStudentProfile('${s.id}')" style="font-weight:700; color: var(--text-main); border-bottom: 1px dashed var(--danger);">
            ${s.name}
          </a>
        </td>
        <td>${s.class}</td>
        <td>
          <span class="badge absent">${s.rate}%</span>
        </td>
      </tr>
    `).join('');
  }
}
