// Hexaware Student Dashboard - Progress Component Controller

export function initProgress(appState, switchViewFunc) {
  // Bind "+ New Note" button to switch to notes view and open the note modal
  const progressNewNoteBtn = document.getElementById("progress-new-note-btn");
  if (progressNewNoteBtn) {
    progressNewNoteBtn.addEventListener("click", () => {
      // Switch view to notes
      switchViewFunc("notes").then(() => {
        // Find notes module to open modal
        // Note modal functions can be triggered globally or imported. We will make them exportable.
        const notesTriggerBtn = document.querySelector(".add-note-action");
        if (notesTriggerBtn) {
          notesTriggerBtn.click();
        }
      });
    });
  }
}

export function renderProgress(appState) {
  const prog = appState.progress;

  // Calculate completion statuses
  const isModulesDone = prog.modulesCompleted === prog.totalModules;
  const isAssessmentsDone = prog.assessmentsCompleted === prog.totalAssessments;
  
  // Set requirements progress bar details
  const requirementsProgressText = document.getElementById("requirements-progress-percentage");
  const requirementsProgressBar = document.getElementById("requirements-progress-bar");
  
  if (requirementsProgressText) requirementsProgressText.textContent = `${prog.requirementsCompletedPercent}%`;
  if (requirementsProgressBar) requirementsProgressBar.style.width = `${prog.requirementsCompletedPercent}%`;

  // Update checklist checkboxes
  const moduleChecklist = document.getElementById("checklist-modules");
  if (moduleChecklist) {
    if (isModulesDone) {
      moduleChecklist.className = "checklist-item checked";
      moduleChecklist.querySelector(".check-icon-slot").innerHTML = `
        <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
      `;
    } else {
      moduleChecklist.className = "checklist-item unchecked";
      moduleChecklist.querySelector(".check-icon-slot").innerHTML = `
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle></svg>
      `;
    }
    moduleChecklist.querySelector("span").textContent = `Complete all ${prog.totalModules} modules`;
  }

  const assessmentChecklist = document.getElementById("checklist-assessments");
  if (assessmentChecklist) {
    if (isAssessmentsDone) {
      assessmentChecklist.className = "checklist-item checked";
      assessmentChecklist.querySelector(".check-icon-slot").innerHTML = `
        <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
      `;
    } else {
      assessmentChecklist.className = "checklist-item unchecked";
      assessmentChecklist.querySelector(".check-icon-slot").innerHTML = `
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle></svg>
      `;
    }
    assessmentChecklist.querySelector("span").textContent = `Pass all assessments (${prog.assessmentsCompleted}/${prog.totalAssessments} completed)`;
  }

  // Handle Certificate Claim actions
  const certificateLockBtn = document.getElementById("certificate-lock-btn");
  if (certificateLockBtn) {
    if (isModulesDone && isAssessmentsDone) {
      certificateLockBtn.className = "btn-white";
      certificateLockBtn.style.color = "var(--success-color)";
      certificateLockBtn.style.backgroundColor = "var(--success-bg)";
      certificateLockBtn.style.cursor = "pointer";
      certificateLockBtn.style.width = "100%";
      certificateLockBtn.style.border = "1px solid var(--success-color)";
      certificateLockBtn.innerHTML = `
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
        Claim Certificate
      `;
      certificateLockBtn.onclick = () => alert("Congratulations! Your course certificate has been generated.");
    } else {
      certificateLockBtn.className = "btn-gray-locked";
      certificateLockBtn.style.width = "100%";
      certificateLockBtn.style.cursor = "not-allowed";
      certificateLockBtn.innerHTML = `
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        Certificate Locked
      `;
      certificateLockBtn.onclick = null;
    }
  }

  // Populate dynamic Learning Insights
  const insightsContainer = document.getElementById("learning-insights-list");
  if (insightsContainer) {
    insightsContainer.innerHTML = prog.insights.map(ins => `
      <div class="insight-pill">
        <span class="title">${ins.title}</span>
        <span class="subtitle">${ins.subtitle}</span>
      </div>
    `).join('');
  }

  // Populate Assessment Results grid
  const assessmentsContainer = document.getElementById("assessment-results-list");
  if (assessmentsContainer) {
    assessmentsContainer.innerHTML = prog.assessments.map(test => {
      const isPassed = test.status === "Passed";
      const scoreText = isPassed ? `Score: ${test.score}/${test.total}` : "Not yet taken";
      const badgeClass = isPassed ? "passed" : "upcoming";
      
      return `
        <div class="assessment-item">
          <div class="assessment-info">
            <span class="assessment-name">${test.name}</span>
            <span class="assessment-score">${scoreText}</span>
          </div>
          <div class="assessment-progress-wrapper">
            <div class="assessment-progress-bar-bg">
              <div class="assessment-progress-bar-fill" style="width: ${test.percent}%"></div>
            </div>
          </div>
          <span class="assessment-badge ${badgeClass}">${test.status}</span>
        </div>
      `;
    }).join('');
  }
}
