const API_BASE = "https://impacthub06.onrender.com";

const appState = {
  currentView: "landingView",
  authMode: "login",
  currentUser: getStoredUser(),
  token: localStorage.getItem("token") || null,
  joinedCampaigns: JSON.parse(localStorage.getItem("joinedCampaigns") || "[]"),
  businesses: [],
  campaigns: [],
  selectedCause: null,
  activeCauseFilter: "all",
  selectedInterests: []
};

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

function hasSelectedInterests() {
  return Array.isArray(appState.selectedInterests) && appState.selectedInterests.length > 0;
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

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email);
}

function getInterestLabel(interestKey) {
  const labels = {
    community: "💗 Community Support",
    environment: "🌿 Environmental Action",
    education: "🎓 Education Access",
    equality: "⚖️ Social Equality",
    health: "🏥 Health & Wellness",
    poverty: "🤝 Poverty Relief"
  };

  return labels[interestKey] || interestKey;
}

function closeMobileMenu() {
  const nav = $("navLinks");
  if (nav) {
    nav.classList.remove("open");
  }
}

function getInterestStorageKey(user = appState.currentUser) {
  if (!user) return "selectedInterests_guest";
  return `selectedInterests_${user.email || user.id}`;
}

function loadSelectedInterests(user = appState.currentUser) {
  try {
    return JSON.parse(localStorage.getItem(getInterestStorageKey(user)) || "[]");
  } catch {
    return [];
  }
}

function saveSelectedInterests() {
  localStorage.setItem(getInterestStorageKey(), JSON.stringify(appState.selectedInterests));
}

/** core SPA */
function showView(viewId) {
  const target = $(viewId);
  if (!target) return;

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active");
  });

  target.classList.add("active");
  appState.currentView = viewId;

  renderNav();

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (viewId === "dashboardView") {
    updateDashboard();
  }

  if (viewId === "interestSelectionView") {
    renderInterestSelection();
  }

  if (viewId === "interestSummaryView") {
    renderInterestSummary();
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

  const isActiveView = (viewIds) => viewIds.includes(appState.currentView);

  const addButton = (label, onClick, className = "nav-link", isActive = false) => {
    const btn = document.createElement("button");
    btn.className = `${className}${isActive ? " active" : ""}`;
    btn.textContent = label;
    btn.type = "button";
    btn.addEventListener("click", () => {
      onClick();
      closeMobileMenu();
    });
    nav.appendChild(btn);
  };

  addButton(
    "Home",
    () => showView("landingView"),
    "nav-link",
    isActiveView(["landingView", "interestSelectionView", "interestSummaryView"])
  );

  if (exists("businessDirectoryView")) {
    addButton(
      "Business Directory",
      () => showView("businessDirectoryView"),
      "nav-link",
      isActiveView(["businessDirectoryView", "promoteBusinessView"])
    );
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
    addButton(
      "Join Impact Hub",
      () => {
        showView("authView");
        setAuthMode("login");
      },
      "nav-button",
      isActiveView(["authView"])
    );
  }
}

function renderCauses() {
  const causeGrid = $("causeGrid");
  if (!causeGrid) return;

  causeGrid.innerHTML = "";

  const searchValue = exists("causeSearchInput")
    ? $("causeSearchInput").value.trim().toLowerCase()
    : "";

  const filteredCauses = appState.campaigns.filter((cause) => {
    const category = (cause.category || "").toLowerCase();

    const matchesFilter =
      appState.activeCauseFilter === "all" || category === appState.activeCauseFilter;

    const matchesSearch =
      !searchValue ||
      (cause.title || "").toLowerCase().includes(searchValue) ||
      (cause.category || "").toLowerCase().includes(searchValue) ||
      (cause.description || "").toLowerCase().includes(searchValue);

    return matchesFilter && matchesSearch;
  });

  if (exists("causeCountText")) {
    $("causeCountText").textContent = `${filteredCauses.length} cause${filteredCauses.length !== 1 ? "s" : ""} found`;
  }

  const categoryIcons = {
    community: "♡",
    environment: "❃",
    education: "🎓",
    equality: "⚖",
    health: "⌘",
    poverty: "◫"
  };

  filteredCauses.forEach((cause) => {
    const card = document.createElement("article");
    card.className = "cause-directory-card";

    card.innerHTML = `
      <div class="cause-directory-image-wrap">
        <div class="cause-directory-image" style="background-image: url('${cause.image_url || "images/community.jpg"}');"></div>
        <div class="cause-directory-badge badge-${(cause.category || "community").toLowerCase()}">
          ${categoryIcons[(cause.category || "community").toLowerCase()] || "•"}
        </div>
        <button class="cause-fav-btn" type="button">♡</button>
      </div>

      <div class="cause-directory-body">
        <h3 class="cause-directory-title">${cause.title || "Untitled Campaign"}</h3>

        <div class="cause-directory-meta">
          <span class="cause-meta-pill">📂 ${cause.category || "General"}</span>
          <span class="cause-meta-pill">💰 Goal: ${cause.goal_amount ?? 0}</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openCauseDetail(cause.id));
    causeGrid.appendChild(card);
  });
}

function openCauseDetail(causeId) {
  const cause = appState.campaigns.find((item) => item.id === causeId);
  if (!cause) return;

  appState.selectedCause = cause;

  if (exists("detailCategory")) $("detailCategory").textContent = cause.category || "General";
  if (exists("detailTitle")) $("detailTitle").textContent = cause.title || "Untitled Campaign";
  if (exists("detailDescription")) $("detailDescription").textContent = cause.description || "No description available.";
  if (exists("detailDate")) $("detailDate").textContent = "Ongoing Campaign";
  if (exists("detailLocation")) $("detailLocation").textContent = "Online / Community";
  if (exists("detailParticipants")) {
    $("detailParticipants").textContent = `Raised: ${cause.current_amount ?? 0}`;
  }

  showView("causeDetailView");
}

function renderBusinesses() {
  const businessGrid = $("businessGrid");
  if (!businessGrid) return;

  businessGrid.innerHTML = "";

  const searchValue = exists("businessSearchInput")
    ? $("businessSearchInput").value.trim().toLowerCase()
    : "";

  const filteredBusinesses = appState.businesses.filter((business) => {
    return (
      !searchValue ||
      (business.business_name || "").toLowerCase().includes(searchValue) ||
      (business.category || business.industry || "").toLowerCase().includes(searchValue) ||
      (business.description || "").toLowerCase().includes(searchValue)
    );
  });

  if (exists("businessCountText")) {
    $("businessCountText").textContent =
      `${filteredBusinesses.length} business${filteredBusinesses.length !== 1 ? "es" : ""} found`;
  }

  if (filteredBusinesses.length === 0) {
    businessGrid.innerHTML = `
      <article class="business-directory-card">
        <div class="business-directory-body">
          <h3 class="business-directory-title">No businesses found</h3>
          <p class="business-directory-description">
            Businesses will appear here once they are added.
          </p>
        </div>
      </article>
    `;
    return;
  }

  filteredBusinesses.forEach((business) => {
    const card = document.createElement("article");
    card.className = "business-directory-card";

    const displayName = business.business_name || "Unnamed Business";
    const displayCategory = business.category || business.industry || "General";
    const displayDescription = business.description || "No description available.";
    const displayImage = business.image_url || "images/business-eco.jpg";
    const displayRating = business.rating || "4.8";
    const displayTrending = business.trending || "New";

    card.innerHTML = `
      <div class="business-directory-image-wrap">
        <div class="business-directory-image" style="background-image: url('${displayImage}');"></div>
        <div class="business-rating-badge">⭐ ${displayRating}</div>
        <button class="business-fav-btn" type="button">♡</button>
      </div>

      <div class="business-directory-body">
        <h3 class="business-directory-title">${displayName}</h3>
        <span class="business-category-pill">${displayCategory}</span>
        <p class="business-directory-description">${displayDescription}</p>

        <div class="business-directory-meta-row">
          <span>⍟ ${displayTrending}</span>
          <span class="business-trending">↗ Growing</span>
        </div>

        <button class="business-visit-btn" type="button">
          ${business.website ? "↗ Visit Website" : "↗ View Business"}
        </button>
      </div>
    `;

    const visitBtn = card.querySelector(".business-visit-btn");
    if (visitBtn && business.website) {
      visitBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        window.open(business.website, "_blank", "noopener,noreferrer");
      });
    }

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
    $("dashboardMeta").textContent = `Impact Maker since January ${new Date().getFullYear()}`;
  }

  if (exists("statCampaigns")) $("statCampaigns").textContent = appState.joinedCampaigns.length || 12;
  if (exists("statPoints")) {
    $("statPoints").textContent = 100 + appState.joinedCampaigns.length * 25;
  }
  if (exists("statBusinesses")) $("statBusinesses").textContent = appState.businesses.length || 5;
  if (exists("statHours")) $("statHours").textContent = 87;

  const dashboardInterestTags = $("dashboardInterestTags");
  if (dashboardInterestTags) {
    dashboardInterestTags.innerHTML = "";

    if (!appState.selectedInterests || appState.selectedInterests.length === 0) {
      const empty = document.createElement("p");
      empty.className = "small-muted";
      empty.textContent = "No interests selected yet.";
      dashboardInterestTags.appendChild(empty);
    } else {
      appState.selectedInterests.forEach((interest) => {
        const tag = document.createElement("span");
        tag.className = "interest-tag";
        tag.textContent = getInterestLabel(interest);
        dashboardInterestTags.appendChild(tag);
      });
    }
  }
}

function setAuthMode(mode) {
  appState.authMode = mode;

  const isLogin = mode === "login";

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

async function loadCampaigns() {
  try {
    const campaigns = await apiRequest("/api/campaigns");
    appState.campaigns = Array.isArray(campaigns) ? campaigns : [];
    renderCauses();
  } catch (error) {
    console.error("Failed to load campaigns:", error);
    appState.campaigns = [];
    renderCauses();
  }
}

async function loadBusinesses() {
  try {
    const businesses = await apiRequest("/api/businesses");
    appState.businesses = Array.isArray(businesses) ? businesses : [];
    renderBusinesses();
  } catch (error) {
    console.error("Failed to load businesses:", error);
    appState.businesses = [];
    renderBusinesses();
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

    if (!data.token || !data.user) {
      throw new Error("Login response was missing token or user.");
    }

    saveSession(data.token, data.user);
    appState.selectedInterests = loadSelectedInterests(data.user);
    renderNav();

    if (hasSelectedInterests()) {
      renderInterestSummary();
      showView("interestSummaryView");
    } else {
      renderInterestSelection();
      showView("interestSelectionView");
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

async function handleBusinessSubmit(event) {
  event.preventDefault();

  if (!appState.currentUser) {
    showView("authView");
    setAuthMode("login");
    return;
  }

  const businessName = exists("businessName") ? $("businessName").value.trim() : "";
  const description = exists("businessDescription") ? $("businessDescription").value.trim() : "";
  const category = exists("businessCategory") ? $("businessCategory").value.trim() : "";
  const logoFile = exists("businessLogo") ? $("businessLogo").files[0] : null;

  if (exists("businessMsg")) $("businessMsg").textContent = "";

  if (!businessName || !description || !category || !logoFile) {
    if (exists("businessMsg")) {
      $("businessMsg").textContent = "Please complete all business fields and upload a logo.";
    }
    return;
  }

  try {
    const formData = new FormData();
    formData.append("user_id", appState.currentUser.id || "");
    formData.append("business_name", businessName);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("industry", category);
    formData.append("rating", "4.8");
    formData.append("trending", "New");
    formData.append("image", logoFile);

    const response = await fetch(`${API_BASE}/api/businesses`, {
      method: "POST",
      body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Failed to submit business.");
    }

    if (exists("businessMsg")) {
      $("businessMsg").textContent = "Business submitted successfully.";
    }

    if (exists("businessForm")) $("businessForm").reset();

    document.querySelectorAll(".promote-category-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    if (exists("businessCategory")) $("businessCategory").value = "";

    if (exists("previewLogoArea")) {
      $("previewLogoArea").innerHTML = '<span class="preview-camera">📷</span>';
    }

    updateBusinessPreview();
    await loadBusinesses();
    showView("businessDirectoryView");
  } catch (error) {
    if (exists("businessMsg")) {
      $("businessMsg").textContent = error.message || "Failed to submit business.";
    }
  }
}

function updateBusinessPreview() {
  const name = exists("businessName")
    ? $("businessName").value.trim() || "Your Business Name"
    : "Your Business Name";

  const description = exists("businessDescription")
    ? $("businessDescription").value.trim() || "Your business description will appear here..."
    : "Your business description will appear here...";

  const category = exists("businessCategory")
    ? $("businessCategory").value || "Select category"
    : "Select category";

  if (exists("previewBusinessName")) $("previewBusinessName").textContent = name;
  if (exists("previewBusinessDescription")) $("previewBusinessDescription").textContent = description;
  if (exists("previewBusinessCategory")) $("previewBusinessCategory").textContent = category;

  if (exists("businessCharCount") && exists("businessDescription")) {
    $("businessCharCount").textContent = $("businessDescription").value.length;
  }

  updateBusinessSubmitState();
}

function updateBusinessSubmitState() {
  if (!exists("businessSubmitBtn")) return;

  const name = exists("businessName") ? $("businessName").value.trim() : "";
  const description = exists("businessDescription") ? $("businessDescription").value.trim() : "";
  const category = exists("businessCategory") ? $("businessCategory").value.trim() : "";
  const hasLogo = exists("businessLogo") ? $("businessLogo").files.length > 0 : false;

  const ready = !!(name && description && category && hasLogo);

  $("businessSubmitBtn").disabled = !ready;
  $("businessSubmitBtn").classList.toggle("enabled", ready);
  $("businessSubmitBtn").textContent = ready
    ? "Submit for Review"
    : "Complete all fields to submit";
}

function setupBusinessCategoryButtons() {
  document.querySelectorAll(".promote-category-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".promote-category-btn").forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      if (exists("businessCategory")) {
        $("businessCategory").value = button.dataset.category;
      }

      updateBusinessPreview();
    });
  });
}

function setupBusinessLogoPreview() {
  if (!exists("businessLogo") || !exists("previewLogoArea")) return;

  $("businessLogo").addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) {
      $("previewLogoArea").innerHTML = '<span class="preview-camera">📷</span>';
      updateBusinessSubmitState();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      $("previewLogoArea").innerHTML = `<img src="${reader.result}" alt="Business logo preview" class="preview-logo-image">`;
    };
    reader.readAsDataURL(file);

    updateBusinessSubmitState();
  });
}

function handleLogout() {
  clearSession();
  appState.selectedInterests = [];
  renderNav();
  showView("landingView");
}

function handleLandingContinue() {
  if (!appState.currentUser) {
    showView("authView");
    setAuthMode("login");
    return;
  }

  if (hasSelectedInterests()) {
    renderInterestSummary();
    showView("interestSummaryView");
    return;
  }

  renderInterestSelection();
  showView("interestSelectionView");
}

function renderInterestSelection() {
  document.querySelectorAll(".interest-card").forEach((card) => {
    const key = card.dataset.interest;
    card.classList.toggle("selected", appState.selectedInterests.includes(key));
  });

  if (exists("interestMsg")) {
    $("interestMsg").textContent =
      appState.selectedInterests.length === 0
        ? "Please choose up to 2 interests."
        : `Selected ${appState.selectedInterests.length}/2 interest${appState.selectedInterests.length > 1 ? "s" : ""}.`;
  }
}

function toggleInterestSelection(event) {
  const card = event.currentTarget;
  const interest = card.dataset.interest;
  const alreadySelected = appState.selectedInterests.includes(interest);

  if (alreadySelected) {
    appState.selectedInterests = appState.selectedInterests.filter((item) => item !== interest);
  } else {
    if (appState.selectedInterests.length >= 2) {
      if (exists("interestMsg")) {
        $("interestMsg").textContent = "You can choose at most 2 interests.";
      }
      return;
    }

    appState.selectedInterests.push(interest);
  }

  saveSelectedInterests();
  renderInterestSelection();
}

function handleInterestContinue() {
  if (appState.selectedInterests.length === 0) {
    if (exists("interestMsg")) {
      $("interestMsg").textContent = "Please select at least 1 interest.";
    }
    return;
  }

  saveSelectedInterests();
  renderInterestSummary();
  showView("interestSummaryView");
}

function renderInterestSummary() {
  const container = $("selectedInterestTags");
  if (!container) return;

  container.innerHTML = "";

  appState.selectedInterests.forEach((interest) => {
    const tag = document.createElement("span");
    tag.className = "interest-tag";
    tag.textContent = getInterestLabel(interest);
    container.appendChild(tag);
  });
}

function handleStartExploringByInterest() {
  appState.activeCauseFilter = "all";

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.filter === "all");
  });

  renderCauses();
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

function bindEvents() {
  if (exists("causeSearchInput")) {
    $("causeSearchInput").addEventListener("input", renderCauses);
  }

  if (exists("discoverBtn")) $("discoverBtn").addEventListener("click", scrollToCauses);

  if (exists("startExploringBtn")) {
    $("startExploringBtn").addEventListener("click", handleLandingContinue);
  }

  if (exists("landingBackBtn")) {
    $("landingBackBtn").addEventListener("click", () => window.history.back());
  }

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

  if (exists("businessSearchInput")) {
    $("businessSearchInput").addEventListener("input", renderBusinesses);
  }

  if (exists("interestContinueBtn")) {
    $("interestContinueBtn").addEventListener("click", handleInterestContinue);
  }

  if (exists("interestBackBtn")) {
    $("interestBackBtn").addEventListener("click", () => showView("landingView"));
  }

  if (exists("summaryBackBtn")) {
    $("summaryBackBtn").addEventListener("click", () => {
      if (hasSelectedInterests()) {
        showView("landingView");
      } else {
        showView("interestSelectionView");
      }
    });
  }

  if (exists("startExploringInterestsBtn")) {
    $("startExploringInterestsBtn").addEventListener("click", handleStartExploringByInterest);
  }

  document.querySelectorAll(".interest-card").forEach((card) => {
    card.addEventListener("click", toggleInterestSelection);
  });

  if (exists("browseCampaignsCue")) {
    const handleBrowseCue = () => {
      const causesSection = $("causesSection");
      if (!causesSection) return;

      const headerOffset = 96;
      const targetY =
        causesSection.getBoundingClientRect().top + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: targetY,
        behavior: "smooth"
      });
    };

    $("browseCampaignsCue").addEventListener("click", handleBrowseCue);
    $("browseCampaignsCue").addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleBrowseCue();
      }
    });
  }

  setupFilters();
  setupViewButtons();
  setupMenuToggle();
  setupBusinessCategoryButtons();
  setupBusinessLogoPreview();
}

function init() {
  if (appState.currentUser) {
    appState.selectedInterests = loadSelectedInterests(appState.currentUser);
  }

  renderNav();
  loadCampaigns();
  loadBusinesses();
  updateBusinessPreview();
  bindEvents();

  if (appState.currentUser && exists("dashboardView")) {
    updateDashboard();
  }

  showView("landingView");
}

window.addEventListener("DOMContentLoaded", init);