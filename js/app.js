import { initAuth, renderProfilePage } from './auth.js';
import { initDashboard, loadDashboard } from './dashboard.js';
import { initStudents } from './students.js';
import { initClasses, renderClassesView } from './classes.js';
import { initAttendance } from './attendance.js';
import { initMarks } from './marks.js';
import { initReports } from './reports.js';
import { initApprovals } from './approvals.js';
import { initStudentPortal } from './studentPortal.js';
import { initSubjects } from './subjects.js';
import { getActiveSession, getClasses, getSubjects, initRemoteDatabaseSync } from './store.js';

// Dom elements
const menuItems = document.querySelectorAll('.menu-item');
const themeToggle = document.getElementById('theme-toggle');
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const sidebar = document.querySelector('.sidebar');
const currentScreenTitle = document.getElementById('current-screen-title');
const tickerEl = document.getElementById('live-time-ticker');

// Global navigation utility
export function navigateToScreen(screenId, isAddStudentShortcut = false) {
  // Hide all screens
  document.querySelectorAll('.app-screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // Show target screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }

  // Sync sidebar active class
  menuItems.forEach(item => {
    if (item.getAttribute('data-target') === screenId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update screen title header
  const titles = {
    'screen-dashboard': 'Academic Dashboard',
    'screen-students': 'Student Profiles Management',
    'screen-classes': 'Class Roster & Analytics',
    'screen-subjects': 'Academic Subject Registry',
    'screen-attendance': 'Class Attendance Sheet',
    'screen-marks': 'Evaluation & Grades Registry',
    'screen-reports': 'Consolidated Reports Center',
    'screen-approvals': 'Registration Approvals Portal',
    'screen-student-academic': 'Academic Dashboard',
    'screen-student-homework': 'Homework Assignments',
    'screen-profile': 'User Profile & Settings'
  };

  currentScreenTitle.textContent = titles[screenId] || 'Portal';

  // Trigger sub-module reload on navigation
  const session = getActiveSession();
  if (session) {
    try {
      if (screenId === 'screen-dashboard') {
        loadDashboard();
      } else if (screenId === 'screen-students') {
        // Re-trigger student table rendering
        const event = new CustomEvent('reload-students-view', { detail: { openAddForm: isAddStudentShortcut } });
        window.dispatchEvent(event);
      } else if (screenId === 'screen-classes') {
        renderClassesView();
      } else if (screenId === 'screen-subjects') {
        const event = new CustomEvent('reload-subjects-view');
        window.dispatchEvent(event);
      } else if (screenId === 'screen-attendance') {
        const event = new CustomEvent('reload-attendance-view');
        window.dispatchEvent(event);
      } else if (screenId === 'screen-marks') {
        const event = new CustomEvent('reload-marks-view');
        window.dispatchEvent(event);
      } else if (screenId === 'screen-approvals') {
        const event = new CustomEvent('reload-approvals-view');
        window.dispatchEvent(event);
      } else if (screenId === 'screen-student-academic') {
        const event = new CustomEvent('reload-student-academic-view');
        window.dispatchEvent(event);
      } else if (screenId === 'screen-student-homework') {
        const event = new CustomEvent('reload-student-homework-view');
        window.dispatchEvent(event);
      } else if (screenId === 'screen-profile') {
        renderProfilePage(session);
      }
    } catch (e) {
      console.error(`Failed to reload views for screen [${screenId}]:`, e);
    }
  }

  // Close mobile sidebar if open
  sidebar.classList.remove('active');
}

// Global Toast notification utility
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icon matching
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'warning') icon = 'fa-exclamation-triangle';
  if (type === 'danger') icon = 'fa-times-circle';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger CSS entry transition
  setTimeout(() => toast.classList.add('show'), 50);

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Ticker clock updates
function updateTimeTicker() {
  const d = new Date();
  let hr = d.getHours();
  let min = String(d.getMinutes()).padStart(2, '0');
  let ampm = hr >= 12 ? 'PM' : 'AM';
  hr = hr % 12 || 12; // 12-hour format
  tickerEl.textContent = `${hr}:${min} ${ampm}`;
}

export function populateClassDropdowns() {
  const classes = getClasses();
  
  // 1. student-filter-class
  const filterSelect = document.getElementById('student-filter-class');
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="all">All Classes</option>';
    classes.forEach(c => {
      filterSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
  }

  // 2. student-modal-class
  const modalSelect = document.getElementById('student-modal-class');
  if (modalSelect) {
    modalSelect.innerHTML = '';
    classes.forEach(c => {
      modalSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
  }

  // 3. attendance-class-select
  const attendanceSelect = document.getElementById('attendance-class-select');
  if (attendanceSelect) {
    attendanceSelect.innerHTML = '';
    classes.forEach(c => {
      attendanceSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
  }

  // 4. marks-class-select
  const marksSelect = document.getElementById('marks-class-select');
  if (marksSelect) {
    marksSelect.innerHTML = '';
    classes.forEach(c => {
      marksSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
  }

  // 5. report-class-select
  const reportSelect = document.getElementById('report-class-select');
  if (reportSelect) {
    reportSelect.innerHTML = '';
    classes.forEach(c => {
      reportSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
  }
}

// Bind Global navigation and toast utilities to window object
window.navigateToScreen = navigateToScreen;
window.smsShowToast = showToast;
window.populateClassDropdowns = populateClassDropdowns;

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
  // Sync database state from shared server before rendering views
  await initRemoteDatabaseSync();
  // Theme management
  let currentTheme = localStorage.getItem('sms_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeToggleIcon(currentTheme);

  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('sms_theme', currentTheme);
    updateThemeToggleIcon(currentTheme);
    showToast(`Switched to ${currentTheme} theme.`, 'info');
    
    // Live update charts since text/grid lines colors depend on active theme
    const activeScreen = document.querySelector('.app-screen.active');
    if (activeScreen && activeScreen.id === 'screen-dashboard') {
      loadDashboard();
    }
  });

  function updateThemeToggleIcon(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun';
      themeToggle.setAttribute('title', 'Switch to Light Theme');
    } else {
      icon.className = 'fa-solid fa-moon';
      themeToggle.setAttribute('title', 'Switch to Dark Theme');
    }
  }

  // Mobile menu toggle
  menuToggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // Bind Sidebar items click events
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetScreen = item.getAttribute('data-target');
      navigateToScreen(targetScreen);
    });
  });

  // Clock ticker start
  updateTimeTicker();
  setInterval(updateTimeTicker, 30000);

  // Initialize Auth module and load sub-modules safely on page load
  const modules = [
    { name: 'Dashboard', init: initDashboard },
    { name: 'Students', init: initStudents },
    { name: 'Classes', init: initClasses },
    { name: 'Subjects', init: initSubjects },
    { name: 'Attendance', init: initAttendance },
    { name: 'Marks', init: initMarks },
    { name: 'Reports', init: initReports },
    { name: 'Approvals', init: initApprovals },
    { name: 'StudentPortal', init: initStudentPortal },
    { name: 'Auth', init: initAuth }
  ];

  modules.forEach(m => {
    try {
      m.init();
    } catch (e) {
      console.error(`Failed to initialize module [${m.name}]:`, e);
    }
  });

  // Populate dynamic dropdown options
  populateClassDropdowns();
  populateSubjectDropdowns();
  
  // Re-sync dropdown options on class/subject modifications
  window.addEventListener('classes-updated', () => {
    populateClassDropdowns();
  });
  window.addEventListener('subjects-updated', () => {
    populateSubjectDropdowns();
  });

  // Pull remote database updates every 5 seconds to support multi-device real-time collaboration
  setInterval(async () => {
    await initRemoteDatabaseSync();
  }, 5000);
});

export function populateSubjectDropdowns() {
  const subjectSelect = document.getElementById('marks-subject-select');
  if (!subjectSelect) return;
  
  const subjects = getSubjects();
  subjectSelect.innerHTML = subjects.map(s => `
    <option value="${s.name}" style="background: var(--bg-card); color: var(--text-main);">${s.name} (${s.code})</option>
  `).join('');
}
