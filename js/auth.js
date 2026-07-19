import { loginUser, logoutUser, getActiveSession, updatePassword, addNotification, registerUser, getStudentByEmail, updateUserProfile } from './store.js';
import { showToast, navigateToScreen } from './app.js';

// Dom Elements
const authScreen = document.getElementById('auth-screen');
const appScreenContainer = document.getElementById('app-screen-container');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginRoleInput = document.getElementById('login-role');
const logoutBtn = document.getElementById('logout-btn');

const navAvatar = document.getElementById('nav-avatar');
const navUsername = document.getElementById('nav-username');
const navRole = document.getElementById('nav-role');

const changePasswordForm = document.getElementById('change-password-form');

// Initialize Auth State on boot
export function initAuth(onLoginSuccessCallback) {
  const activeSession = getActiveSession();
  
  if (activeSession) {
    applyLoggedInState(activeSession);
    if (onLoginSuccessCallback) onLoginSuccessCallback(activeSession);
  } else {
    applyLoggedOutState();
  }

  // Handle Login form
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = usernameInput.value.trim();
    const password = passwordInput.value;
    const selectedRole = loginRoleInput.value;

    const result = loginUser(email, password);

    if (result.status === 'success') {
      const user = result.user;
      if (user.role !== selectedRole) {
        showToast(`Login failed: Credentials do not match the ${selectedRole} role.`, 'danger');
        return;
      }
      
      showToast(`Welcome back, ${user.name}!`, 'success');
      applyLoggedInState(user);
      
      usernameInput.value = '';
      passwordInput.value = '';
      
      addNotification(`User ${user.email} logged in successfully.`, 'info');
      
      if (onLoginSuccessCallback) onLoginSuccessCallback(user);
    } else if (result.status === 'pending') {
      showToast('Your account is pending administrator approval.', 'warning');
    } else {
      showToast('Invalid email address or password.', 'danger');
    }
  });

  // Handle Registration / Form Switch Toggles
  const linkToRegister = document.getElementById('link-to-register');
  const linkToLogin = document.getElementById('link-to-login');
  const registerForm = document.getElementById('register-form');
  const loginRoleTabs = document.querySelector('.tabs-header');

  if (linkToRegister && linkToLogin && loginForm && registerForm) {
    linkToRegister.addEventListener('click', () => {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      linkToRegister.style.display = 'none';
      linkToLogin.style.display = 'inline-block';
      if (loginRoleTabs) loginRoleTabs.style.display = 'none';
    });

    linkToLogin.addEventListener('click', () => {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      linkToRegister.style.display = 'inline-block';
      linkToLogin.style.display = 'none';
      if (loginRoleTabs) loginRoleTabs.style.display = 'flex';
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      const role = document.getElementById('register-role').value;

      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'warning');
        return;
      }

      const result = registerUser(name, email, password, role);
      if (result.success) {
        showToast('Registration submitted! Awaiting administrator approval.', 'success');
        registerForm.reset();
        
        // Switch back to login form
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        linkToRegister.style.display = 'inline-block';
        linkToLogin.style.display = 'none';
        if (loginRoleTabs) loginRoleTabs.style.display = 'flex';
      } else {
        showToast(result.message || 'Registration failed.', 'danger');
      }
    });
  }

  // Handle Logout
  logoutBtn.addEventListener('click', () => {
    const user = getActiveSession();
    logoutUser();
    applyLoggedOutState();
    showToast('Logged out successfully.', 'info');
    if (user) {
      addNotification(`User ${user.email} logged out.`, 'info');
    }
  });

  // Handle Change Password
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const oldPwd = document.getElementById('profile-old-pwd').value;
      const newPwd = document.getElementById('profile-new-pwd').value;
      const confirmPwd = document.getElementById('profile-confirm-pwd').value;
      
      const session = getActiveSession();
      if (!session) return;

      if (newPwd.length < 6) {
        showToast('New password must be at least 6 characters.', 'warning');
        return;
      }

      if (newPwd !== confirmPwd) {
        showToast('New passwords do not match.', 'danger');
        return;
      }

      const result = updatePassword(session.username, oldPwd, newPwd);
      if (result.success) {
        showToast('Password updated successfully!', 'success');
        changePasswordForm.reset();
        
        renderProfilePage(getActiveSession());
      } else {
        showToast(result.message || 'Failed to update password.', 'danger');
      }
    });
  }

  // Handle Edit Profile Form
  const editProfileForm = document.getElementById('edit-profile-form');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const session = getActiveSession();
      if (!session) return;

      const name = document.getElementById('profile-edit-name').value.trim();
      const phone = document.getElementById('profile-edit-phone').value.trim();
      const duty = document.getElementById('profile-edit-duty').value.trim();

      const result = updateUserProfile(session.username, { name, phone, duty });
      if (result.success) {
        showToast('Profile details updated successfully!', 'success');
        
        // Refresh navbar user details
        if (navUsername) navUsername.textContent = result.user.name;
        if (navAvatar) navAvatar.textContent = result.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        // If student, refresh the roll number in subtitle
        if (result.user.role === 'student') {
          const studentRec = getStudentByEmail(result.user.email);
          if (navRole) navRole.textContent = studentRec ? `Student (${studentRec.rollNo})` : 'Student';
        }

        renderProfilePage(result.user);
      } else {
        showToast(result.message || 'Failed to update profile.', 'danger');
      }
    });
  }
}

// Adjust UI when logged in
function applyLoggedInState(user) {
  authScreen.style.display = 'none';
  appScreenContainer.style.display = 'flex';
  
  // Set navbar user credentials
  navUsername.textContent = user.name;
  navAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  if (user.role === 'admin') {
    navRole.textContent = 'Administrator';
  } else if (user.role === 'faculty') {
    navRole.textContent = `Faculty (${user.classAssigned || 'General'})`;
  } else if (user.role === 'student') {
    const studentRec = getStudentByEmail(user.email);
    navRole.textContent = studentRec ? `Student (${studentRec.rollNo})` : 'Student';
  }
  
  // Set menu and action item visibilities
  applyRolePermissions(user);
  
  // Show default screen: student-academic for student, dashboard for admin/faculty
  if (user.role === 'student') {
    navigateToScreen('screen-student-academic');
  } else {
    navigateToScreen('screen-dashboard');
  }
}

// Adjust UI when logged out
function applyLoggedOutState() {
  authScreen.style.display = 'flex';
  appScreenContainer.style.display = 'none';
}

function applyRolePermissions(user) {
  const role = user.role;
  const isStudent = role === 'student';
  const isFaculty = role === 'faculty';
  const isAdmin = role === 'admin';

  // Sidebar Menu elements
  const menuDashboard = document.querySelector('li[data-target="screen-dashboard"]');
  const menuStudents = document.querySelector('li[data-target="screen-students"]');
  const menuClasses = document.querySelector('li[data-target="screen-classes"]');
  const menuSubjects = document.getElementById('menu-item-subjects');
  const menuAttendance = document.querySelector('li[data-target="screen-attendance"]');
  const menuMarks = document.querySelector('li[data-target="screen-marks"]');
  const menuReports = document.querySelector('li[data-target="screen-reports"]');
  const menuApprovals = document.getElementById('menu-item-approvals');
  const menuStudentAcademic = document.getElementById('menu-item-student-academic');
  const menuStudentHomework = document.getElementById('menu-item-student-homework');

  // Toggle sidebar items visibility
  if (menuDashboard) menuDashboard.style.display = (isAdmin || isFaculty) ? 'flex' : 'none';
  if (menuStudents) menuStudents.style.display = isFaculty ? 'flex' : 'none';
  if (menuClasses) menuClasses.style.display = (isAdmin || isFaculty) ? 'flex' : 'none';
  if (menuSubjects) menuSubjects.style.display = (isAdmin || isFaculty) ? 'flex' : 'none';
  if (menuAttendance) menuAttendance.style.display = isFaculty ? 'flex' : 'none';
  if (menuMarks) menuMarks.style.display = isFaculty ? 'flex' : 'none';
  if (menuReports) menuReports.style.display = isFaculty ? 'flex' : 'none';
  
  if (menuApprovals) menuApprovals.style.display = isAdmin ? 'flex' : 'none';
  
  if (menuStudentAcademic) menuStudentAcademic.style.display = isStudent ? 'flex' : 'none';
  if (menuStudentHomework) menuStudentHomework.style.display = isStudent ? 'flex' : 'none';

  // Toggle action buttons in screens
  const addBtn = document.getElementById('add-student-btn');
  if (addBtn) addBtn.style.display = isFaculty ? 'inline-flex' : 'none';
  document.querySelectorAll('.delete-btn').forEach(btn => btn.style.display = isAdmin ? 'inline-flex' : 'none');
}

// Render Profile/Settings page info
export function renderProfilePage(user) {
  if (!user) return;
  
  const avatarChar = document.getElementById('profile-avatar-char');
  const profileName = document.getElementById('profile-name');
  const roleTag = document.getElementById('profile-role-tag');
  const emailVal = document.getElementById('profile-email-val');
  const phoneVal = document.getElementById('profile-phone-val');
  const dutyVal = document.getElementById('profile-duty-val');
  
  avatarChar.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  profileName.textContent = user.name;
  
  let defaultDuty = '';
  if (user.role === 'admin') {
    roleTag.textContent = 'Staff - Administrator';
    defaultDuty = 'Institutional Administration & Admissions';
  } else if (user.role === 'faculty') {
    roleTag.textContent = 'Staff - Instructor';
    defaultDuty = `Academic Instruction (${user.classAssigned || 'General'})`;
  } else if (user.role === 'student') {
    roleTag.textContent = 'Enrolled Student';
    const studentRec = getStudentByEmail(user.email);
    defaultDuty = studentRec ? `Class enrollment: ${studentRec.class}` : 'Student Portal User';
  }
  
  const currentDuty = user.duty || defaultDuty;
  dutyVal.textContent = currentDuty;
  
  emailVal.textContent = user.email;
  phoneVal.textContent = user.phone;

  // Prepopulate edit form values
  const editName = document.getElementById('profile-edit-name');
  const editPhone = document.getElementById('profile-edit-phone');
  const editDuty = document.getElementById('profile-edit-duty');

  if (editName) editName.value = user.name;
  if (editPhone) editPhone.value = user.phone;
  if (editDuty) editDuty.value = currentDuty;
}
