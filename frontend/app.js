// Hexaware Student Dashboard - Modular Main Application Entry (ES Module)

import { initProgress, renderProgress } from './views/progress/progress.js';
import { initNotes, renderNotes } from './views/notes/notes.js';
import { initProfile, renderProfile, applyTheme } from './views/profile/profile.js';

const DEFAULT_STATE = {
  profile: {
    fullName: "Name",
    email: "hexaware.tech@gmail.com",
    phone: "9791407000",
    country: "India",
    gender: "Male",
    address: "123 Technology Corridor, Hexaware Campus, Chennai",
    musicEnabled: false,
    notificationsEnabled: true,
    avatar: "",
    password: "",
    darkMode: false
  },
  progress: {
    modulesCompleted: 48,
    totalModules: 48,
    assessmentsCompleted: 2,
    totalAssessments: 3,
    requirementsCompletedPercent: 58,
    assessments: [
      {
        id: "java-quiz",
        name: "Java Basics Quiz",
        score: 85,
        total: 100,
        status: "Passed",
        percent: 85
      },
      {
        id: "oop-quiz",
        name: "OOP Mid-Assessment",
        score: 78,
        total: 100,
        status: "Passed",
        percent: 78
      },
      {
        id: "ds-quiz",
        name: "Data Structures Quiz",
        score: null,
        total: 100,
        status: "Upcoming",
        percent: 0
      }
    ],
    insights: [
      { title: "20% ahead of average pace", subtitle: "You're making excellent progress!" },
      { title: "Estimated completion: May 22, 2026", subtitle: "2 days earlier than scheduled" }
    ]
  },
  notes: [
    {
      id: "note-1",
      title: "A101",
      content: "Test",
      date: "Mar 3, 2026",
      colorClass: "note-purple"
    },
    {
      id: "note-2",
      title: "Database Systems",
      content: "Normalization, ERD, SQL, DDL, DML - Understand key database concepts, normalization rules - primary key, foreign key, transitive dependencies",
      date: "May 5, 2026",
      colorClass: "note-blue"
    },
    {
      id: "note-3",
      title: "Machine Learning",
      content: "Supervised vs Unsupervised Learning. Key algorithms to review for midterms.",
      date: "Apr 20, 2026",
      colorClass: "note-green"
    },
    {
      id: "note-4",
      title: "Web Development",
      content: "React basics - useState, useEffect, useContext, useMemo, useCallback.",
      date: "Apr 24, 2026",
      colorClass: "note-yellow"
    },
    {
      id: "note-5",
      title: "Data Structures",
      content: "Time Complexity: O(1) - Constant, O(log n) - Logarithmic, O(n) - Linear, O(n²) - Quadratic.",
      date: "Apr 27, 2026",
      colorClass: "note-pink"
    },
    {
      id: "note-6",
      title: "Algorithms",
      content: "Sorting Algorithms: QuickSort, MergeSort, HeapSort best for different scenarios.",
      date: "Apr 26, 2026",
      colorClass: "note-indigo"
    },
    {
      id: "note-7",
      title: "Cloud Computing",
      content: "AWS basics: EC2, S3, RDS, Lambda, VPC. Review deployment pipelines.",
      date: "May 2, 2026",
      colorClass: "note-cyan"
    },
    {
      id: "note-8",
      title: "Security Fundamentals",
      content: "CIA Triad: Confidentiality, Integrity, Availability. Symmetric vs Asymmetric encryption.",
      date: "Apr 25, 2026",
      colorClass: "note-orange"
    }
  ]
};

// Application State
let state = {};

function loadState() {
  const local = localStorage.getItem("hexaware_dashboard_state");
  if (local) {
    try {
      state = JSON.parse(local);
    } catch (e) {
      console.error("Local state parse failed, resetting defaults.", e);
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  } else {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
  }
}

function saveState() {
  localStorage.setItem("hexaware_dashboard_state", JSON.stringify(state));
}

// Router for dynamically loading templates
async function switchView(viewId) {
  // Update sidebar active link highlights
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    if (link.getAttribute("data-view") === viewId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Fetch HTML fragment from view subfolders
  try {
    const response = await fetch(`views/${viewId}/${viewId}.html`);
    if (!response.ok) throw new Error(`Could not find view template for '${viewId}'`);
    const templateHTML = await response.text();
    
    // Inject HTML into central wrapper
    const wrapper = document.getElementById("active-view-container");
    if (wrapper) {
      wrapper.innerHTML = templateHTML;
    }
  } catch (err) {
    console.error("Template load error:", err);
    const wrapper = document.getElementById("active-view-container");
    if (wrapper) {
      wrapper.innerHTML = `
        <div style="text-align: center; padding: 60px; color: var(--text-gray);">
          <h2>Failed to load page</h2>
          <p>${err.message}</p>
        </div>
      `;
    }
    return;
  }

  // Initialize view controller modules
  if (viewId === "progress") {
    initProgress(state, switchView);
    renderProgress(state);
  } else if (viewId === "notes") {
    initNotes(state, saveState);
    renderNotes(state);
  } else if (viewId === "profile") {
    initProfile(state, saveState, updateSidebarBadge);
    renderProfile(state);
  }
}

function updateSidebarBadge() {
  const sidebarName = document.getElementById("sidebar-name");
  const sidebarEmail = document.getElementById("sidebar-email");
  
  if (sidebarName) sidebarName.textContent = state.profile.fullName;
  if (sidebarEmail) sidebarEmail.textContent = state.profile.email;
}

// Initial bindings
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  applyTheme(state.profile.darkMode || false);
  updateSidebarBadge();

  // Sidebar Menu clicks
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-view");
      if (target) {
        switchView(target);
      }
    });
  });

  // Logout actions
  const logoutButtons = document.querySelectorAll(".logout-action");
  logoutButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Are you sure you want to log out? This will reset all demo database settings back to default screenshot values.")) {
        localStorage.removeItem("hexaware_dashboard_state");
        window.location.reload();
      }
    });
  });

  // Default view
  switchView("progress");
});
