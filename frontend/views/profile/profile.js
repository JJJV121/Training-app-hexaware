// Hexaware Student Dashboard - Profile Component Controller

export function initProfile(appState, saveStateFunc, updateSidebarBadgeFunc) {
  // Navigation inside profile tab: Main view -> Edit form
  const personalDetailsBtn = document.getElementById("profile-edit-btn");
  if (personalDetailsBtn) {
    personalDetailsBtn.addEventListener("click", () => {
      document.getElementById("profile-main-subview").style.display = "none";
      document.getElementById("profile-edit-subview").style.display = "block";
      document.getElementById("profile-password-subview").style.display = "none";
      populateEditProfileForm(appState);
    });
  }

  // Back button in edit profile
  const editProfileBackBtn = document.getElementById("edit-profile-back-btn");
  if (editProfileBackBtn) {
    editProfileBackBtn.addEventListener("click", () => {
      document.getElementById("profile-edit-subview").style.display = "none";
      document.getElementById("profile-main-subview").style.display = "block";
    });
  }

  // --- Password Subview Navigation ---
  const passwordBtn = document.getElementById("profile-password-btn");
  if (passwordBtn) {
    passwordBtn.addEventListener("click", () => {
      document.getElementById("profile-main-subview").style.display = "none";
      document.getElementById("profile-edit-subview").style.display = "none";
      document.getElementById("profile-password-subview").style.display = "block";
      // Clear password fields on open
      const curr = document.getElementById("current-password");
      const newP = document.getElementById("new-password");
      const conf = document.getElementById("confirm-password");
      if (curr) curr.value = "";
      if (newP) newP.value = "";
      if (conf) conf.value = "";
    });
  }

  const passwordBackBtn = document.getElementById("password-back-btn");
  if (passwordBackBtn) {
    passwordBackBtn.addEventListener("click", () => {
      document.getElementById("profile-password-subview").style.display = "none";
      document.getElementById("profile-main-subview").style.display = "block";
    });
  }

  // Password form submit
  const passwordForm = document.getElementById("change-password-form");
  if (passwordForm) {
    passwordForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const currVal = document.getElementById("current-password")?.value.trim() || "";
      const newVal = document.getElementById("new-password")?.value.trim() || "";
      const confVal = document.getElementById("confirm-password")?.value.trim() || "";

      if (!newVal) {
        alert("Please enter a new password.");
        return;
      }
      if (newVal !== confVal) {
        alert("New password and confirmation do not match.");
        return;
      }
      // If user already has a password stored, check current
      if (appState.profile.password && currVal !== appState.profile.password) {
        alert("Current password is incorrect.");
        return;
      }

      appState.profile.password = newVal;
      saveStateFunc();
      alert("Password updated successfully!");
      document.getElementById("profile-password-subview").style.display = "none";
      document.getElementById("profile-main-subview").style.display = "block";
    });
  }

  // --- Avatar Upload ---
  const avatarTrigger = document.getElementById("avatar-upload-trigger");
  const avatarInput = document.getElementById("avatar-upload");
  if (avatarTrigger && avatarInput) {
    avatarTrigger.addEventListener("click", () => {
      avatarInput.click();
    });
    avatarInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        appState.profile.avatar = base64;
        saveStateFunc();
        applyAvatar(base64);
      };
      reader.readAsDataURL(file);
    });
  }

  // --- Mode Toggle (Dark/Light) ---
  const modeToggle = document.getElementById("mode-toggle");
  if (modeToggle) {
    modeToggle.checked = appState.profile.darkMode || false;
    const newModeToggle = modeToggle.cloneNode(true);
    modeToggle.parentNode.replaceChild(newModeToggle, modeToggle);
    newModeToggle.addEventListener("change", (e) => {
      appState.profile.darkMode = e.target.checked;
      saveStateFunc();
      applyTheme(appState.profile.darkMode);
    });
  }

  // --- Notifications Toggle ---
  const notificationToggle = document.getElementById("notifications-toggle");
  if (notificationToggle) {
    notificationToggle.checked = appState.profile.notificationsEnabled;
    const newNotificationToggle = notificationToggle.cloneNode(true);
    notificationToggle.parentNode.replaceChild(newNotificationToggle, notificationToggle);
    newNotificationToggle.addEventListener("change", (e) => {
      appState.profile.notificationsEnabled = e.target.checked;
      saveStateFunc();
    });
  }

  // --- Logout Handler (profile-scoped) ---
  const logoutBtns = document.querySelectorAll("#profile-main-subview .logout-action");
  logoutBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Are you sure you want to log out? This will reset all demo data.")) {
        localStorage.removeItem("hexaware_dashboard_state");
        window.location.reload();
      }
    });
  });

  // Form submission handler
  const editProfileForm = document.getElementById("edit-profile-form");
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const fullNameInput = document.getElementById("edit-fullname");
      const emailInput = document.getElementById("edit-email");
      const phoneInput = document.getElementById("edit-phone");
      const countryInput = document.getElementById("edit-country");
      const genderInput = document.getElementById("edit-gender");
      const addressInput = document.getElementById("edit-address");
      
      const name = fullNameInput ? fullNameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      
      if (!name || !email) {
        alert("Name and Email are required.");
        return;
      }

      // Save form fields to state
      appState.profile.fullName = name;
      appState.profile.email = email;
      appState.profile.phone = phoneInput ? phoneInput.value.trim() : "";
      appState.profile.country = countryInput ? countryInput.value : "";
      appState.profile.gender = genderInput ? genderInput.value : "";
      appState.profile.address = addressInput ? addressInput.value.trim() : "";

      saveStateFunc();
      
      // Update displays
      updateSidebarBadgeFunc();
      renderProfile(appState);
      
      // Navigate back to main profile card
      document.getElementById("profile-edit-subview").style.display = "none";
      document.getElementById("profile-main-subview").style.display = "block";
    });
  }

  // Apply avatar on init
  if (appState.profile.avatar) {
    applyAvatar(appState.profile.avatar);
  }

  // Apply theme on init
  applyTheme(appState.profile.darkMode || false);
}

function applyAvatar(base64) {
  const img = document.getElementById("profile-avatar-img");
  const svgIcon = document.getElementById("avatar-svg-icon");
  if (img && base64) {
    img.src = base64;
    img.style.display = "block";
    if (svgIcon) svgIcon.style.display = "none";
  } else if (img) {
    img.style.display = "none";
    if (svgIcon) svgIcon.style.display = "block";
  }
}

export function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function populateEditProfileForm(appState) {
  const prof = appState.profile;
  
  const fullNameInput = document.getElementById("edit-fullname");
  const emailInput = document.getElementById("edit-email");
  const phoneInput = document.getElementById("edit-phone");
  const countryInput = document.getElementById("edit-country");
  const genderInput = document.getElementById("edit-gender");
  const addressInput = document.getElementById("edit-address");
  
  if (fullNameInput) fullNameInput.value = prof.fullName;
  if (emailInput) emailInput.value = prof.email;
  if (phoneInput) phoneInput.value = prof.phone;
  if (countryInput) countryInput.value = prof.country;
  if (genderInput) genderInput.value = prof.gender;
  if (addressInput) addressInput.value = prof.address;
}

export function renderProfile(appState) {
  const prof = appState.profile;
  
  const mainName = document.getElementById("profile-main-name");
  const mainEmail = document.getElementById("profile-main-email");
  
  if (mainName) mainName.textContent = prof.fullName;
  if (mainEmail) mainEmail.textContent = prof.email;

  // Update avatar
  if (prof.avatar) {
    applyAvatar(prof.avatar);
  }
}
