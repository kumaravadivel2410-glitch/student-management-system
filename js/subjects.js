import { getActiveSession, getSubjects, addSubject, deleteSubject } from './store.js';
import { showToast } from './app.js';

// DOM elements
const addSubjectBtn = document.getElementById('add-subject-btn');
const subjectModal = document.getElementById('subject-modal');
const subjectForm = document.getElementById('subject-form');
const subjectModalCode = document.getElementById('subject-modal-code');
const subjectModalName = document.getElementById('subject-modal-name');
const subjectsTbody = document.getElementById('subjects-tbody');

export function initSubjects() {
  // Listeners
  window.addEventListener('reload-subjects-view', () => {
    renderSubjectsTable();
  });

  window.addEventListener('subjects-updated', () => {
    renderSubjectsTable();
  });

  if (addSubjectBtn) {
    addSubjectBtn.addEventListener('click', openSubjectModal);
  }

  const closeBtn = document.getElementById('subject-modal-close');
  const cancelBtn = document.getElementById('subject-modal-cancel');
  if (closeBtn) closeBtn.addEventListener('click', closeSubjectModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeSubjectModal);

  if (subjectForm) {
    subjectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const session = getActiveSession();
      if (!session || session.role !== 'faculty') {
        showToast('Permission Denied: Only faculty members can manage subjects.', 'danger');
        closeSubjectModal();
        return;
      }
      
      const code = subjectModalCode.value;
      const name = subjectModalName.value;

      const result = addSubject({ code, name });
      if (result.success) {
        showToast('New subject registered successfully.', 'success');
        closeSubjectModal();
      } else {
        showToast(result.error || 'Failed to register subject.', 'danger');
      }
    });
  }
}

export function renderSubjectsTable() {
  if (!subjectsTbody) return;

  const session = getActiveSession();
  const isFaculty = session && session.role === 'faculty';

  // Toggle faculty specific controls
  if (addSubjectBtn) addSubjectBtn.style.display = isFaculty ? 'inline-flex' : 'none';
  document.querySelectorAll('.subjects-admin-action').forEach(el => {
    el.style.display = isFaculty ? 'table-cell' : 'none';
  });

  const subjects = getSubjects();
  subjects.sort((a, b) => a.code.localeCompare(b.code));

  if (subjects.length === 0) {
    subjectsTbody.innerHTML = `
      <tr>
        <td colspan="${isFaculty ? 3 : 2}" style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
          <i class="fa-solid fa-book" style="font-size: 2.5rem; margin-bottom: 12px; display: block; color: var(--text-muted);"></i>
          No subjects registered. ${isFaculty ? "Click 'Add Subject' to register your first course." : ""}
        </td>
      </tr>
    `;
    return;
  }

  subjectsTbody.innerHTML = subjects.map(s => `
    <tr>
      <td><span class="badge info" style="font-size: 0.75rem; font-family: monospace;">${s.code}</span></td>
      <td><strong>${s.name}</strong></td>
      ${isFaculty ? `
        <td style="text-align: right; padding-right: 20px;">
          <button class="action-icon-btn delete-btn" onclick="deleteSubjectAction('${s.code}')" title="Remove Course">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      ` : ''}
    </tr>
  `).join('');
}

function openSubjectModal() {
  if (subjectModal) {
    subjectForm.reset();
    subjectModal.classList.add('active');
  }
}

function closeSubjectModal() {
  if (subjectModal) {
    subjectModal.classList.remove('active');
  }
}

function deleteSubjectAction(code) {
  const session = getActiveSession();
  if (!session || session.role !== 'faculty') {
    showToast('Permission Denied: Only faculty members can manage subjects.', 'danger');
    return;
  }

  if (confirm(`Are you sure you want to delete and permanently remove subject ${code}?`)) {
    const success = deleteSubject(code);
    if (success) {
      showToast(`Successfully deleted subject ${code}.`, 'warning');
    }
  }
}

// Bind to window for inline calls
window.deleteSubjectAction = deleteSubjectAction;
