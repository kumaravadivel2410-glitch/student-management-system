import { getUsers, approveUserRegistration, rejectUserRegistration } from './store.js';
import { showToast } from './app.js';

export function initApprovals() {
  window.addEventListener('reload-approvals-view', () => {
    renderApprovalsTable();
  });
  
  renderApprovalsTable();
}

export function renderApprovalsTable() {
  const approvalsTbody = document.getElementById('approvals-tbody');
  if (!approvalsTbody) return;

  const users = getUsers();
  const pendingUsers = Object.values(users).filter(u => u.approved === false);

  if (pendingUsers.length === 0) {
    approvalsTbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
          <i class="fa-solid fa-user-clock" style="font-size: 2.5rem; margin-bottom: 12px; display: block; color: var(--text-muted);"></i>
          No pending registration approval requests.
        </td>
      </tr>
    `;
    return;
  }

  approvalsTbody.innerHTML = pendingUsers.map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td><span style="font-size: 0.85rem; color: var(--text-muted);">${u.email}</span></td>
      <td><span class="badge info" style="font-size: 0.75rem;">${u.role === 'admin' ? 'Administrator' : 'Faculty Member'}</span></td>
      <td><span class="badge warning">Awaiting Approval</span></td>
      <td style="text-align: right; padding-right: 20px;">
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn btn-sm" onclick="approveUser('${u.email.replace(/'/g, "\\'")}')" style="background-color: var(--primary); border-color: var(--primary); padding: 6px 12px; font-size: 0.75rem; height: auto;">
            <i class="fa-solid fa-check"></i> Approve
          </button>
          <button class="btn btn-secondary btn-sm" onclick="rejectUser('${u.email.replace(/'/g, "\\'")}')" style="background-color: transparent; border-color: var(--danger); color: var(--danger); padding: 6px 12px; font-size: 0.75rem; height: auto;">
            <i class="fa-solid fa-xmark"></i> Reject
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function approveUser(email) {
  if (confirm(`Are you sure you want to approve user registration for ${email}?`)) {
    const success = approveUserRegistration(email);
    if (success) {
      showToast(`User registration approved.`, 'success');
      renderApprovalsTable();
    }
  }
}

function rejectUser(email) {
  if (confirm(`Are you sure you want to reject and delete user registration for ${email}?`)) {
    const success = rejectUserRegistration(email);
    if (success) {
      showToast(`User registration rejected.`, 'warning');
      renderApprovalsTable();
    }
  }
}

// Bind to window global for inline click actions
window.approveUser = approveUser;
window.rejectUser = rejectUser;
