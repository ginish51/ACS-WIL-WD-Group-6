const API_BASE = "http://localhost:5000"; /** will change when API is hosted */

const appState = {
  currentView: "landingView",
  authMode: "login",
  currentUser: getStoredUser(),
  token: localStorage.getItem("token") || null,
  activeCauseFilter: "all"
};

/** hard-coded for prototype purposes */
const causes = [
  {
    id: 1,
    title: "Community Support Network",
    category: "community",
    categoryLabel: "Community Support",
    description: "Support neighborhood food drives, shelter outreach, and volunteer coordination.",
    date: "April 12, 2026",
    location: "Melbourne Community Hall",
    participants: 24,
    image: "images/community.jpg"
  },
  {
    id: 2,
    title: "Clean Ocean Initiative",
    category: "environment",
    categoryLabel: "Environmental Action",
    description: "Join us in cleaning local beaches and raising awareness about ocean pollution.",
    date: "March 15, 2026",
    location: "Santa Monica Beach",
    participants: 47,
    image: "images/ocean.jpg"
  },
  {
    id: 3,
    title: "Education Access Drive",
    category: "education",
    categoryLabel: "Education Access",
    description: "Help provide learning materials, tutoring support, and scholarships for students.",
    date: "May 03, 2026",
    location: "City Learning Center",
    participants: 31,
    image: "images/education.jpg"
  }
];

const starterBusinesses = [
  {
    name: "EcoGreen Essentials",
    category: "Eco-Friendly",
    description: "Sustainable home products made from recycled materials.",
    trending: "2.3K Trending"
  },
  {
    name: "Local Harvest Co-op",
    category: "Fair Trade",
    description: "Supporting local farmers with organic produce and ethical sourcing.",
    trending: "1.8K Trending"
  },
  {
    name: "Mindful Market",
    category: "Local",
    description: "Handcrafted goods supporting artisan communities and small makers.",
    trending: "1.5K Trending"
  }
];

function $(id) {
  return document.getElementById(id);
}

function exists(id) {
  return !!document.getElementById(id);
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("sessionUser") || "null");
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  appState.token = token;
  appState.currentUser = user;
  localStorage.setItem("token", token);
  localStorage.setItem("sessionUser", JSON.stringify(user));
}

function clearSession() {
  appState.token = null;
  appState.currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("sessionUser");
}

function saveJoinedCampaigns() {
  localStorage.setItem("joinedCampaigns", JSON.stringify(appState.joinedCampaigns));
}

function saveBusinesses() {
  localStorage.setItem("businesses", JSON.stringify(appState.businesses));
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email);
}

function closeMobileMenu() {
  const nav = $("navLinks");
  if (nav) {
    nav.classList.remove("open");
  }
}

/** displays view from html file via section id & class with view*/
/** core SPA */
function showView(viewId) {

  const target = $(viewId);
  if (!target) return;

  /** hides other views */
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active");
  });

  /** shows chosen view via the viewID */
  target.classList.add("active");
  appState.currentView = viewId;

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (viewId === "dashboardView") {
    updateDashboard();
  }

  closeMobileMenu();
}

function scrollToCauses() {
  showView("landingView");

  requestAnimationFrame(() => {
    const causesSection = $("causesSection");
    if (!causesSection) return;

    const headerOffset = 96;
    const targetY =
      causesSection.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: targetY,
      behavior: "smooth"
    });
  });
}

function renderNav() {
  const nav = $("navLinks");
  if (!nav) return;

  nav.innerHTML = "";

  const addButton = (label, onClick, className = "nav-link") => {
    const btn = document.createElement("button");
    btn.className = className;
    btn.textContent = label;
    btn.type = "button";
    btn.addEventListener("click", () => {
      onClick();
      closeMobileMenu();
    });
    nav.appendChild(btn);
  };

  addButton("Home", () => showView("landingView"));

  if (exists("businessDirectoryView")) {
    addButton("Explore Businesses", () => showView("businessDirectoryView"));
  }

  if (appState.currentUser) {
    const dropdown = document.createElement("div");
    dropdown.className = "nav-dropdown";

    const trigger = document.createElement("button");
    trigger.className = "nav-user-trigger";
    trigger.type = "button";
    trigger.innerHTML = `Hi, <span class="nav-user-name">${appState.currentUser.name}</span>`;

    const menu = document.createElement("div");
    menu.className = "nav-dropdown-menu";

    if (exists("dashboardView")) {
      const dashboardBtn = document.createElement("button");
      dashboardBtn.className = "nav-dropdown-item";
      dashboardBtn.type = "button";
      dashboardBtn.textContent = "Dashboard";
      dashboardBtn.addEventListener("click", () => {
        showView("dashboardView");
        closeMobileMenu();
      });
      menu.appendChild(dashboardBtn);
    }

    if (exists("promoteBusinessView")) {
      const promoteBtn = document.createElement("button");
      promoteBtn.className = "nav-dropdown-item";
      promoteBtn.type = "button";
      promoteBtn.textContent = "Promote Business";
      promoteBtn.addEventListener("click", () => {
        showView("promoteBusinessView");
        closeMobileMenu();
      });
      menu.appendChild(promoteBtn);
    }

    if (exists("logoutView")) {
      const logoutBtn = document.createElement("button");
      logoutBtn.className = "nav-dropdown-item";
      logoutBtn.type = "button";
      logoutBtn.textContent = "Log Out";
      logoutBtn.addEventListener("click", () => {
        showView("logoutView");
        closeMobileMenu();
      });
      menu.appendChild(logoutBtn);
    }

    dropdown.appendChild(trigger);
    dropdown.appendChild(menu);
    nav.appendChild(dropdown);
  } else {
    addButton("Sign In / Register", () => showView("authView"), "nav-button");
  }
}

function renderCauses() {
  const causeGrid = $("causeGrid");
  if (!causeGrid) return;

  causeGrid.innerHTML = "";

  const filteredCauses =
    appState.activeCauseFilter === "all"
      ? causes
      : causes.filter((cause) => cause.category === appState.activeCauseFilter);

  filteredCauses.forEach((cause) => {
    const card = document.createElement("article");
    card.className = "cause-card";

    card.innerHTML = `
      <div class="card-image" style="background-image: url('${cause.image}');"></div>
      <div class="card-body">
        <span class="card-category">${cause.categoryLabel}</span>
        <h3>${cause.title}</h3>
        <p>${cause.description}</p>
        <div class="card-meta">
          <span>${cause.date}</span>
          <span>${cause.participants} Active</span>
        </div>
        <button class="btn btn-primary" type="button">View Cause</button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => openCauseDetail(cause.id));
    causeGrid.appendChild(card);
  });
}

function openCauseDetail(causeId) {
  const cause = causes.find((item) => item.id === causeId);
  if (!cause) return;

  appState.selectedCause = cause;

  if (exists("detailCategory")) $("detailCategory").textContent = cause.categoryLabel;
  if (exists("detailTitle")) $("detailTitle").textContent = cause.title;
  if (exists("detailDescription")) $("detailDescription").textContent = cause.description;
  if (exists("detailDate")) $("detailDate").textContent = cause.date;
  if (exists("detailLocation")) $("detailLocation").textContent = cause.location;
  if (exists("detailParticipants")) {
    $("detailParticipants").textContent = `${cause.participants} Participants`;
  }

  showView("causeDetailView");
}

function renderBusinesses() {
  const businessGrid = $("businessGrid");
  if (!businessGrid) return;

  businessGrid.innerHTML = "";

  const allBusinesses = [...starterBusinesses, ...appState.businesses];

  allBusinesses.forEach((business) => {
    const card = document.createElement("article");
    card.className = "business-card";

    card.innerHTML = `
      <div class="card-image"></div>
      <div class="card-body">
        <span class="card-category">${business.category}</span>
        <h3>${business.name}</h3>
        <p>${business.description}</p>
        <div class="card-meta">
          <span>⭐ 4.8</span>
          <span>${business.trending || "New Listing"}</span>
        </div>
      </div>
    `;

    businessGrid.appendChild(card);
  });
}

function updateDashboard() {
  if (!exists("dashboardView")) return;

  const user = appState.currentUser;

  if (!user) {
    showView("authView");
    return;
  }

  if (exists("dashboardName")) $("dashboardName").textContent = user.name;
  if (exists("dashboardMeta")) {
    $("dashboardMeta").textContent = `Impact Maker since ${new Date().getFullYear()}`;
  }

  if (exists("statCampaigns")) $("statCampaigns").textContent = appState.joinedCampaigns.length;
  if (exists("statPoints")) {
    $("statPoints").textContent = 100 + appState.joinedCampaigns.length * 25;
  }
  if (exists("statBusinesses")) $("statBusinesses").textContent = appState.businesses.length;

  const achievementList = $("achievementList");
  if (!achievementList) return;

  achievementList.innerHTML = "";

  const achievements = [
    appState.joinedCampaigns.length > 0 ? "Joined at least one campaign" : "Join your first campaign",
    appState.businesses.length > 0 ? "Submitted a business profile" : "Submit a social business",
    "Completed profile access setup"
  ];

  achievements.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    achievementList.appendChild(li);
  });
}

function setAuthMode(mode) {
  appState.authMode = mode;

  const isLogin = mode === "login";

  if (exists("showLoginTab")) $("showLoginTab").classList.toggle("active", isLogin);
  if (exists("showRegisterTab")) $("showRegisterTab").classList.toggle("active", !isLogin);
  if (exists("loginForm")) $("loginForm").classList.toggle("hidden", !isLogin);
  if (exists("registerForm")) $("registerForm").classList.toggle("hidden", isLogin);

  if (exists("authTitle")) {
    $("authTitle").textContent = isLogin ? "Welcome Back" : "Create Your Account";
  }

  if (exists("authSubtitle")) {
    $("authSubtitle").textContent = isLogin
      ? "Log in to continue your impact journey."
      : "Register to start making an impact.";
  }
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (appState.token) {
    headers.Authorization = `Bearer ${appState.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

async function handleLogin(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const email = exists("loginEmail") ? $("loginEmail").value.trim() : "";
  const password = exists("loginPassword") ? $("loginPassword").value : "";

  if (exists("loginMsg")) $("loginMsg").textContent = "";

  if (!email || !password) {
    if (exists("loginMsg")) $("loginMsg").textContent = "Please enter email and password.";
    return;
  }

  if (!isValidEmail(email)) {
    if (exists("loginMsg")) $("loginMsg").textContent = "Please enter a valid email address.";
    return;
  }

  try {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    saveSession(data.token, data.user);
    renderNav();

    if (exists("dashboardView")) {
      updateDashboard();
      showView("dashboardView");
    } else {
      showView("landingView");
    }
  } catch (error) {
    if (exists("loginMsg")) $("loginMsg").textContent = error.message || "Failed to log in.";
  }
}

async function handleRegister(event) {

  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const name = exists("registerName") ? $("registerName").value.trim() : "";
  const email = exists("registerEmail") ? $("registerEmail").value.trim() : "";
  const password = exists("registerPassword") ? $("registerPassword").value : "";

  if (exists("registerMsg")) $("registerMsg").textContent = "";
  if (exists("loginMsg")) $("loginMsg").textContent = "";

  if (!name || !email || !password) {
    if (exists("registerMsg")) {
      $("registerMsg").textContent = "Please fill in all required fields.";
    }
    return;
  }

  if (name.length < 2) {
    if (exists("registerMsg")) {
      $("registerMsg").textContent = "Name must be at least 2 characters.";
    }
    return;
  }

  if (!isValidEmail(email)) {
    if (exists("registerMsg")) {
      $("registerMsg").textContent = "Please enter a valid email address.";
    }
    return;
  }

  if (password.length < 6) {
    if (exists("registerMsg")) {
      $("registerMsg").textContent = "Password must be at least 6 characters.";
    }
    return;
  }

  try {
    await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });

    if (exists("registerName")) $("registerName").value = "";
    if (exists("registerEmail")) $("registerEmail").value = "";
    if (exists("registerPassword")) $("registerPassword").value = "";

    showView("authView");
    setAuthMode("login");

    requestAnimationFrame(() => {
      if (exists("loginMsg")) {
        $("loginMsg").textContent =
          "Registration successful! You can sign in to your account.";
      }
    });
  } catch (error) {
    console.log("REGISTER ERROR:", error);

    if (exists("registerMsg")) {
      $("registerMsg").textContent =
        error.message || "Registration failed. Please try again.";
    }
  }
}

function handleJoinCampaign() {
  if (!appState.currentUser) {
    showView("authView");
    setAuthMode("login");
    return;
  }

  if (!appState.selectedCause) return;

  const alreadyJoined = appState.joinedCampaigns.some(
    (item) => item.id === appState.selectedCause.id
  );

  if (!alreadyJoined) {
    appState.joinedCampaigns.push(appState.selectedCause);
    saveJoinedCampaigns();
  }

  if (exists("joinedMessage")) {
    $("joinedMessage").textContent = `You've successfully joined the ${appState.selectedCause.title}.`;
  }

  if (exists("joinSuccessView")) {
    showView("joinSuccessView");
  } else if (exists("dashboardView")) {
    showView("dashboardView");
  } else {
    showView("landingView");
  }
}

function handleBusinessSubmit(event) {
  event.preventDefault();

  if (!appState.currentUser) {
    showView("authView");
    return;
  }

  const name = exists("businessName") ? $("businessName").value.trim() : "";
  const description = exists("businessDescription") ? $("businessDescription").value.trim() : "";
  const category = exists("businessCategory") ? $("businessCategory").value : "";

  if (exists("businessMsg")) $("businessMsg").textContent = "";

  if (!name || !description || !category) {
    if (exists("businessMsg")) $("businessMsg").textContent = "Please complete all business fields.";
    return;
  }

  const newBusiness = {
    name,
    description,
    category,
    trending: "New Listing"
  };

  appState.businesses.push(newBusiness);
  saveBusinesses();
  renderBusinesses();

  if (exists("businessMsg")) $("businessMsg").textContent = "Business submitted successfully.";
  if (exists("businessForm")) $("businessForm").reset();
  updateBusinessPreview();
}

function updateBusinessPreview() {
  if (!exists("previewBusinessName")) return;

  const name = exists("businessName") ? $("businessName").value.trim() || "Your Business Name" : "Your Business Name";
  const description = exists("businessDescription")
    ? $("businessDescription").value.trim() || "Your business description will appear here..."
    : "Your business description will appear here...";
  const category = exists("businessCategory")
    ? $("businessCategory").value || "Category"
    : "Category";

  $("previewBusinessName").textContent = name;
  if (exists("previewBusinessDescription")) $("previewBusinessDescription").textContent = description;
  if (exists("previewBusinessCategory")) $("previewBusinessCategory").textContent = category;
}

function handleLogout() {
  clearSession();
  renderNav();
  showView("landingView");
}

function setupFilters() {
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      appState.activeCauseFilter = chip.dataset.filter;
      renderCauses();
    });
  });
}

function setupViewButtons() {
  document.querySelectorAll("[data-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.target;
      if (exists(target)) {
        showView(target);
      }
    });
  });

  document.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.back;

      if (target === "landingView") {
        showView("landingView");
        scrollToCauses();
        return;
      }

      if (exists(target)) {
        showView(target);
      }
    });
  });
}

function setupMenuToggle() {
  const menuToggle = $("menuToggle");
  const nav = $("navLinks");

  if (!menuToggle || !nav) return;

  menuToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

/** checks if bind events exist; not visible if not **/
function bindEvents() {
  if (exists("discoverBtn")) $("discoverBtn").addEventListener("click", scrollToCauses);
  if (exists("startExploringBtn")) $("startExploringBtn").addEventListener("click", scrollToCauses);

  if (exists("showLoginTab")) $("showLoginTab").addEventListener("click", () => setAuthMode("login"));
  if (exists("showRegisterTab")) $("showRegisterTab").addEventListener("click", () => setAuthMode("register"));

  if (exists("loginBtn")) $("loginBtn").addEventListener("click", handleLogin);
  if (exists("registerBtn")) $("registerBtn").addEventListener("click", handleRegister);

  if (exists("joinCampaignBtn")) $("joinCampaignBtn").addEventListener("click", handleJoinCampaign);
  if (exists("goDashboardAfterJoin")) {
    $("goDashboardAfterJoin").addEventListener("click", () => showView("dashboardView"));
  }
  if (exists("confirmLogoutBtn")) $("confirmLogoutBtn").addEventListener("click", handleLogout);

  if (exists("businessForm")) $("businessForm").addEventListener("submit", handleBusinessSubmit);
  if (exists("businessName")) $("businessName").addEventListener("input", updateBusinessPreview);
  if (exists("businessDescription")) $("businessDescription").addEventListener("input", updateBusinessPreview);
  if (exists("businessCategory")) $("businessCategory").addEventListener("change", updateBusinessPreview);

  setupFilters();
  setupViewButtons();
  setupMenuToggle();
}

/** default view of the landing page. loads everything at the start **/
function init() {

  renderNav();
  renderCauses();
  renderBusinesses();
  updateBusinessPreview();
  bindEvents();

  if (appState.currentUser && exists("dashboardView")) {
    updateDashboard();
  }

  showView("landingView");
}

window.addEventListener("DOMContentLoaded", init);