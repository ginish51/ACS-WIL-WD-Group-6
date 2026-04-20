const API_BASE = "https://impacthub06.onrender.com";

const appState = {
  currentView: "landingView",
  authMode: "login",
  currentUser: getStoredUser(),
  token: localStorage.getItem("token") || null,
  joinedCampaigns: [],
  businesses: [],
  campaigns: [],
  myCampaigns: [],
  selectedCause: null,
  activeCauseFilter: "all",
  selectedInterests: [],
  campaignStats: {
    active_count: 0,
    pending_count: 0,
    rejected_count: 0
  },
  adminPendingCampaigns: []
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

function updateCampaignPreview() {
  const title = exists("campaignTitle")
    ? $("campaignTitle").value.trim() || "Your Campaign Title"
    : "Your Campaign Title";

  const description = exists("campaignDescription")
    ? $("campaignDescription").value.trim() || "Your campaign description preview will appear here as you type."
    : "Your campaign description preview will appear here as you type.";

  const category = exists("campaignCategory")
    ? $("campaignCategory").value.trim() || "Category"
    : "Category";

  const goalAmount = exists("campaignGoalAmount")
    ? $("campaignGoalAmount").value.trim() || "0"
    : "0";

  const goalUsers = exists("campaignGoalUsers")
    ? $("campaignGoalUsers").value.trim() || "0"
    : "0";

  if (exists("campaignPreviewTitle")) $("campaignPreviewTitle").textContent = title;
  if (exists("campaignPreviewDescription")) $("campaignPreviewDescription").textContent = description;
  if (exists("campaignPreviewCategory")) $("campaignPreviewCategory").textContent = category;
  if (exists("campaignPreviewGoalAmount")) $("campaignPreviewGoalAmount").textContent = `💰 Goal Amount: ${goalAmount}`;
  if (exists("campaignPreviewGoalUsers")) $("campaignPreviewGoalUsers").textContent = `👥 Goal Users: ${goalUsers}`;
}

function setupCampaignCategoryButtons() {
  document.querySelectorAll(".campaign-category-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".campaign-category-btn").forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      if (exists("campaignCategory")) {
        $("campaignCategory").value = button.dataset.category;
      }

      updateCampaignPreview();
    });
  });
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
  if (nav) nav.classList.remove("open");
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

  Promise.all([
    loadMyCampaignStats(),
    loadMyCampaigns()
  ]).then(() => {
    updateDashboard();
  });
}

  if (viewId === "interestSelectionView") {
    renderInterestSelection();
  }

  if (viewId === "interestSummaryView") {
    renderInterestSummary();
  }

  if (viewId === "adminDashboardView") {
    loadAdminPendingCampaigns();
  }

  closeMobileMenu();
}

function showBusinessDetailsModal(business) {
  const modal = $("businessDetailModal");
  const title = $("businessDetailTitle");
  const body = $("businessDetailBody");

  if (!modal || !title || !body) return;

  const displayName = business.business_name || "Unnamed Business";
  const displayCategory = business.category || business.industry || "General";
  const displayDescription = business.description || "No description available.";
  const displayImage = business.image_url || "";
  const displayWebsite = business.website || "";
  const displayTrending = business.trending || "New";

  title.textContent = displayName;

  body.innerHTML = `
    <div class="business-modal-layout">
      ${
        displayImage
          ? `<div class="business-modal-image-wrap">
               <img src="${displayImage}" alt="${displayName}" class="business-detail-modal-image">
             </div>`
          : ""
      }

      <div class="business-modal-info">
        <div class="business-modal-tags">
          <span class="business-modal-pill">${displayCategory}</span>
          <span class="business-modal-pill subtle">${displayTrending}</span>
        </div>

        <div class="business-modal-section">
          <h4>About</h4>
          <p>${displayDescription}</p>
        </div>

        <div class="business-modal-section">
          <h4>Link</h4>
          ${
            displayWebsite
              ? `<a href="${displayWebsite}" target="_blank" rel="noopener noreferrer" class="business-modal-link-btn">
                   ↗ Visit Website
                 </a>`
              : `<p class="small-muted">No website provided.</p>`
          }
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeBusinessDetailsModal() {
  const modal = $("businessDetailModal");
  if (modal) {
    modal.classList.add("hidden");
  }
  document.body.classList.remove("modal-open");
}

function showJoinedCampaignsModal() {
  const modal = $("joinedCampaignsModal");
  const body = $("joinedCampaignsModalBody");

  if (!modal || !body) return;

  body.innerHTML = "";

  if (!appState.joinedCampaigns.length) {
    body.innerHTML = `
      <div class="empty-modal-state">
        <p class="small-muted">You have not joined any campaigns yet.</p>
      </div>
    `;
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    return;
  }

  const list = document.createElement("div");
  list.className = "joined-campaigns-list";

  appState.joinedCampaigns.forEach((campaign) => {
    const card = document.createElement("article");
    card.className = "joined-campaign-item";
    card.innerHTML = `
      <div class="joined-campaign-item-content">
        <h4>${campaign.title || "Untitled Campaign"}</h4>
        <p>${campaign.description || "No description available."}</p>
        <div class="joined-campaign-item-meta">
          <span class="joined-campaign-pill">${campaign.category || "General"}</span>
          <span class="joined-campaign-open">View details →</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
  closeJoinedCampaignsModal();
  setTimeout(() => {
    showCampaignDetailsModal(campaign);
  }, 120);
});

    list.appendChild(card);
  });

  body.appendChild(list);
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeJoinedCampaignsModal() {
  const modal = $("joinedCampaignsModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function showCampaignDetailsModal(campaign) {
  const modal = $("campaignDetailModal");
  const title = $("campaignDetailTitle");
  const body = $("campaignDetailBody");

  if (!modal || !title || !body) return;

  const displayTitle = campaign.title || "Untitled Campaign";
  const displayCategory = campaign.category || "General";
  const displayDescription = campaign.description || "No description available.";
  const displayImage = campaign.image_url || "";
  const displayGoal = campaign.goal_amount ?? 0;
  const displayGoalUsers = campaign.goal_users ?? 0;
  const displayCurrent = campaign.current_amount ?? 0;

  title.textContent = displayTitle;

  body.innerHTML = `
    <div class="business-modal-layout">
      ${
        displayImage
          ? `<div class="business-modal-image-wrap">
               <img src="${displayImage}" alt="${displayTitle}" class="business-detail-modal-image">
             </div>`
          : ""
      }

      <div class="business-modal-info">
        <div class="business-modal-tags">
          <span class="business-modal-pill">${displayCategory}</span>
          <span class="business-modal-pill subtle">Joined Campaign</span>
        </div>

        <div class="business-modal-section">
          <h4>About</h4>
          <p>${displayDescription}</p>
        </div>

        <div class="business-modal-section">
          <h4>Progress</h4>
          <p><strong>Goal Amount:</strong> ${displayGoal}</p>
          <p><strong>Current Amount:</strong> ${displayCurrent}</p>
          <p><strong>Goal Users:</strong> ${displayGoalUsers}</p>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeCampaignDetailsModal() {
  const modal = $("campaignDetailModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function showMyBusinessesModal() {
  const modal = $("myBusinessesModal");
  const body = $("myBusinessesModalBody");

  if (!modal || !body) return;

  body.innerHTML = "";

  if (!appState.currentUser) {
    body.innerHTML = `
      <div class="empty-modal-state">
        <p class="small-muted">Please log in to view your businesses.</p>
      </div>
    `;
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    return;
  }

  const myBusinesses = appState.businesses.filter(
    (business) => Number(business.user_id) === Number(appState.currentUser.id)
  );

  if (!myBusinesses.length) {
    body.innerHTML = `
      <div class="empty-modal-state">
        <p class="small-muted">You have not created any businesses yet.</p>
      </div>
    `;
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    return;
  }

  const list = document.createElement("div");
  list.className = "joined-campaigns-list";

  myBusinesses.forEach((business) => {
    const card = document.createElement("article");
    card.className = "joined-campaign-item";
    card.innerHTML = `
      <div class="joined-campaign-item-content">
        <h4>${business.business_name || "Unnamed Business"}</h4>
        <p>${business.description || "No description available."}</p>
        <div class="joined-campaign-item-meta">
          <span class="joined-campaign-pill">${business.category || business.industry || "General"}</span>
          <span class="joined-campaign-open">View details →</span>
        </div>
      </div>
    `;

   card.addEventListener("click", () => {
  closeMyBusinessesModal();
  setTimeout(() => {
    showBusinessDetailsModal(business);
  }, 120);
});

    list.appendChild(card);
  });

  body.appendChild(list);
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeMyBusinessesModal() {
  const modal = $("myBusinessesModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
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

    if (exists("campaignSubmitView")) {
      const campaignBtn = document.createElement("button");
      campaignBtn.className = "nav-dropdown-item";
      campaignBtn.type = "button";
      campaignBtn.textContent = "Submit Campaign";
      campaignBtn.addEventListener("click", () => {
        showView("campaignSubmitView");
        closeMobileMenu();
      });
      menu.appendChild(campaignBtn);
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

    if (appState.currentUser?.role === "admin" && exists("adminDashboardView")) {
      const adminBtn = document.createElement("button");
      adminBtn.className = "nav-dropdown-item";
      adminBtn.type = "button";
      adminBtn.textContent = "Admin Dashboard";
      adminBtn.addEventListener("click", () => {
        loadAdminPendingCampaigns();
        showView("adminDashboardView");
        closeMobileMenu();
      });
      menu.appendChild(adminBtn);
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
    "Log In",
    () => {
      showView("authView");
      setAuthMode("login");
    },
    "nav-link nav-login-btn",
    appState.currentView === "authView" && appState.authMode === "login"
  );

  addButton(
    "Join Impact Hub",
    () => {
      showView("authView");
      setAuthMode("register");
    },
    "nav-button nav-register-btn",
    appState.currentView === "authView" && appState.authMode === "register"
  );
}
}


async function loadCampaigns() {
  if (exists("causeCountText")) {
    $("causeCountText").textContent = "Loading causes...";
  }

  renderCauseSkeletons(3);

  try {
    const campaigns = await apiRequest("/api/campaigns");
    appState.campaigns = Array.isArray(campaigns) ? campaigns : [];
    renderCauses();
  } catch (error) {
    console.error("Failed to load campaigns:", error);
    appState.campaigns = [];

    if (exists("causeCountText")) {
      $("causeCountText").textContent = "Failed to load causes.";
    }

    const causeGrid = $("causeGrid");
    if (causeGrid) {
      causeGrid.classList.remove("skeleton-grid");
      causeGrid.innerHTML = `<p class="small-muted">Could not load campaigns right now.</p>`;
    }
  }
}

function renderCauses() {
  const causeGrid = $("causeGrid");
  if (!causeGrid) return;

  causeGrid.innerHTML = "";
  causeGrid.classList.remove("skeleton-grid");

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
    $("causeCountText").textContent =
      `${filteredCauses.length} cause${filteredCauses.length !== 1 ? "s" : ""} found`;
  }

  const categoryIcons = {
    community: "♡",
    environment: "❃",
    education: "🎓",
    equality: "⚖",
    health: "⌘",
    poverty: "◫"
  };

  if (filteredCauses.length === 0) {
    causeGrid.innerHTML = `
      <article class="cause-directory-card">
        <div class="cause-directory-body">
          <h3 class="cause-directory-title">No active campaigns found</h3>
          <p class="business-directory-description">
            Approved campaigns will appear here once they become active.
          </p>
        </div>
      </article>
    `;
    return;
  }

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

  if (exists("detailCategory")) {
    $("detailCategory").textContent = cause.category || "General";
  }

  if (exists("detailTitle")) {
    $("detailTitle").textContent = cause.title || "Untitled Campaign";
  }

  if (exists("detailDescription")) {
    $("detailDescription").textContent =
      cause.description || "No description available.";
  }

  if (exists("detailGoalAmount")) {
    $("detailGoalAmount").textContent = cause.goal_amount ?? 0;
  }

  if (exists("detailGoalUsers")) {
    $("detailGoalUsers").textContent = cause.goal_users ?? 0;
  }

  if (exists("detailCurrentAmount")) {
    $("detailCurrentAmount").textContent = cause.current_amount ?? 0;
  }

  if (exists("causeDetailImage")) {
    const imageUrl = cause.image_url || "images/community.jpg";
    $("causeDetailImage").style.backgroundImage = `url('${imageUrl}')`;
  }

  showView("causeDetailView");
}

async function handleCampaignSubmit(event) {
  event.preventDefault();

  if (!appState.currentUser) {
    showView("authView");
    setAuthMode("login");
    return;
  }

  const title = exists("campaignTitle") ? $("campaignTitle").value.trim() : "";
  const description = exists("campaignDescription") ? $("campaignDescription").value.trim() : "";
  const category = exists("campaignCategory") ? $("campaignCategory").value.trim() : "";
  const goalAmount = exists("campaignGoalAmount") ? $("campaignGoalAmount").value.trim() : "";
  const goalUsers = exists("campaignGoalUsers") ? $("campaignGoalUsers").value.trim() : "";
  const imageFile = exists("campaignImage") ? $("campaignImage").files[0] : null;

  if (exists("campaignMsg")) $("campaignMsg").textContent = "";

  if (!title || !description || !category || !goalAmount || !goalUsers || !imageFile) {
    if (exists("campaignMsg")) {
      $("campaignMsg").textContent = "Please complete all campaign fields and upload an image.";
    }
    return;
  }

  try {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("goal_amount", goalAmount);
    formData.append("goal_users", goalUsers);
    formData.append("image", imageFile);

    const response = await fetch(`${API_BASE}/api/campaigns`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appState.token}`
      },
      body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Failed to submit campaign.");
    }

    if (exists("campaignMsg")) {
      $("campaignMsg").textContent = "Campaign submitted for admin approval.";
    }

    if (exists("campaignForm")) $("campaignForm").reset();
    if (exists("campaignPreviewImageArea")) {
  $("campaignPreviewImageArea").innerHTML = '<span class="campaign-preview-icon">🌱</span>';
}
updateCampaignPreview();

    await loadMyCampaignStats();
    await loadMyCampaigns();
  } catch (error) {
    if (exists("campaignMsg")) {
      $("campaignMsg").textContent = error.message || "Failed to submit campaign.";
    }
  }
}

async function loadMyCampaignStats() {
  if (!appState.currentUser || !appState.token) return;

  try {
    const stats = await apiRequest("/api/my-campaign-stats");
    appState.campaignStats = stats || {
      active_count: 0,
      pending_count: 0,
      rejected_count: 0
    };

    if (exists("userActiveCampaigns")) {
      $("userActiveCampaigns").textContent = appState.campaignStats.active_count || 0;
    }
    if (exists("userPendingCampaigns")) {
      $("userPendingCampaigns").textContent = appState.campaignStats.pending_count || 0;
    }
    if (exists("userRejectedCampaigns")) {
      $("userRejectedCampaigns").textContent = appState.campaignStats.rejected_count || 0;
    }
  } catch (error) {
    console.error("Failed to load campaign stats:", error);
  }
}

async function loadMyCampaigns() {
  if (!appState.currentUser || !appState.token) return;

  try {
    const campaigns = await apiRequest("/api/my-campaigns");
    appState.myCampaigns = Array.isArray(campaigns) ? campaigns : [];
    renderMyCampaigns();
    renderImpactCategoryChart();
  } catch (error) {
    console.error("Failed to load my campaigns:", error);
  }
}

function renderMyCampaigns() {
  const container = $("myCampaignsList");
  if (!container) return;

  container.innerHTML = "";

  if (!appState.myCampaigns.length) {
    container.innerHTML = `<p class="small-muted">You have not submitted any campaigns yet.</p>`;
    return;
  }

  appState.myCampaigns.forEach((campaign) => {
    const item = document.createElement("div");
    item.className = "info-card";

    const statusClass =
      campaign.status === "active"
        ? "status-active"
        : campaign.status === "pending"
        ? "status-pending"
        : "status-rejected";

    item.innerHTML = `
      <div class="submitted-campaign-card">
        <div class="submitted-campaign-header">
          <h3>${campaign.title || "Untitled Campaign"}</h3>
          <span class="submitted-status-badge ${statusClass}">
            ${campaign.status || "unknown"}
          </span>
        </div>
        <p>${campaign.description || "No description available."}</p>
        <div class="submitted-campaign-meta">
          <span>📂 ${campaign.category || "General"}</span>
          <span>💰 Goal: ${campaign.goal_amount ?? 0}</span>
        </div>
        ${campaign.rejection_reason ? `<p class="rejection-note"><strong>Reason:</strong> ${campaign.rejection_reason}</p>` : ""}
      </div>
    `;

    container.appendChild(item);
  });
}

function getJoinedCampaignsStorageKey(user = appState.currentUser) {
  if (!user) return "joinedCampaigns_guest";
  return `joinedCampaigns_${user.email || user.id}`;
}

function loadJoinedCampaigns(user = appState.currentUser) {
  try {
    return JSON.parse(localStorage.getItem(getJoinedCampaignsStorageKey(user)) || "[]");
  } catch {
    return [];
  }
}

function saveJoinedCampaigns() {
  localStorage.setItem(
    getJoinedCampaignsStorageKey(),
    JSON.stringify(appState.joinedCampaigns)
  );
}


async function loadAdminPendingCampaigns() {
  if (!appState.currentUser || appState.currentUser.role !== "admin") return;

  try {
    const campaigns = await apiRequest("/api/admin/campaigns/pending");
    appState.adminPendingCampaigns = Array.isArray(campaigns) ? campaigns : [];
    renderAdminPendingCampaigns();
  } catch (error) {
    console.error("Failed to load admin pending campaigns:", error);
  }
}

function renderAdminPendingCampaigns() {
  const container = $("adminPendingCampaignsList");
  if (!container) return;

  container.innerHTML = "";

  if (!appState.adminPendingCampaigns.length) {
    container.innerHTML = `<p class="small-muted">No pending campaigns.</p>`;
    return;
  }

  appState.adminPendingCampaigns.forEach((campaign) => {
    const item = document.createElement("div");
    item.className = "info-card";
    item.innerHTML = `
      <h3>${campaign.title}</h3>
      <p>${campaign.description || "No description available."}</p>
      <p><strong>Category:</strong> ${campaign.category || "General"}</p>
      <p><strong>Status:</strong> ${campaign.status}</p>
      ${campaign.image_url ? `<img src="${campaign.image_url}" alt="${campaign.title}" style="max-width: 220px; border-radius: 12px; margin-top: 10px;">` : ""}
      <div style="margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn btn-primary" type="button" data-approve-id="${campaign.id}">Approve</button>
        <button class="btn btn-secondary" type="button" data-reject-id="${campaign.id}">Reject</button>
      </div>
    `;
    container.appendChild(item);
  });

  container.querySelectorAll("[data-approve-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await approveCampaign(btn.dataset.approveId);
    });
  });

  container.querySelectorAll("[data-reject-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const reason = prompt("Enter rejection reason (optional):") || "";
      await rejectCampaign(btn.dataset.rejectId, reason);
    });
  });
}

async function approveCampaign(campaignId) {
  try {
    await apiRequest(`/api/admin/campaigns/${campaignId}/approve`, {
      method: "PATCH"
    });
    await loadAdminPendingCampaigns();
    await loadCampaigns();
  } catch (error) {
    alert(error.message || "Failed to approve campaign.");
  }
}

async function rejectCampaign(campaignId, rejectionReason) {
  try {
    await apiRequest(`/api/admin/campaigns/${campaignId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejection_reason: rejectionReason })
    });
    await loadAdminPendingCampaigns();
  } catch (error) {
    alert(error.message || "Failed to reject campaign.");
  }
}


async function loadBusinesses() {
  if (exists("businessCountText")) {
    $("businessCountText").textContent = "Loading businesses...";
  }

  renderBusinessSkeletons(3);

  try {
    const businesses = await apiRequest("/api/businesses");
    appState.businesses = Array.isArray(businesses) ? businesses : [];
    renderBusinesses();
  } catch (error) {
    console.error("Failed to load businesses:", error);
    appState.businesses = [];

    if (exists("businessCountText")) {
      $("businessCountText").textContent = "Failed to load businesses.";
    }

    const businessGrid = $("businessGrid");
    if (businessGrid) {
      businessGrid.classList.remove("skeleton-grid");
      businessGrid.innerHTML = `<p class="small-muted">Could not load businesses right now.</p>`;
    }
  }
}

function renderBusinesses() {
  const businessGrid = $("businessGrid");
  if (!businessGrid) return;

  businessGrid.innerHTML = "";

  businessGrid.classList.remove("skeleton-grid");

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
    const displayTrending = business.trending || "New";
    const displayWebsite = business.website || "";

    card.innerHTML = `
      <div class="business-directory-image-wrap">
        <div class="business-directory-image" style="background-image: url('${displayImage}');"></div>
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
          ↗ View Business
        </button>
      </div>
    `;

    card.addEventListener("click", () => {
      showBusinessDetailsModal(business);
    });

    const visitBtn = card.querySelector(".business-visit-btn");
    if (visitBtn) {
      visitBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        if (displayWebsite) {
          window.open(displayWebsite, "_blank", "noopener,noreferrer");
        }
      });
    }

    businessGrid.appendChild(card);
  });
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
  const website = exists("businessWebsite") ? $("businessWebsite").value.trim() : "";
  const logoFile = exists("businessLogo") ? $("businessLogo").files[0] : null;

  if (exists("businessMsg")) $("businessMsg").textContent = "";

  if (!businessName || !description || !category || !website || !logoFile) {
    if (exists("businessMsg")) {
      $("businessMsg").textContent = "Please complete all business fields, add a website link, and upload a logo.";
    }
    return;
  }

  try {
    const formData = new FormData();
    formData.append("business_name", businessName);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("industry", category);
    formData.append("website", website);
    formData.append("trending", "New");
    formData.append("image", logoFile);

    const response = await fetch(`${API_BASE}/api/businesses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appState.token}`
      },
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

function updateCampaignImagePreview() {
  if (!exists("campaignImage") || !exists("campaignPreviewImageArea")) return;

  const file = $("campaignImage").files[0];

  if (!file) {
    $("campaignPreviewImageArea").innerHTML = '<span class="campaign-preview-icon">🌱</span>';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    $("campaignPreviewImageArea").innerHTML = `
      <img
        src="${reader.result}"
        alt="Campaign preview"
        class="campaign-preview-uploaded-image"
      >
    `;
  };

  reader.readAsDataURL(file);
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



function updateDashboard() {
  if (!exists("dashboardView")) return;

  const user = appState.currentUser;

  if (!user) {
    showView("authView");
    return;
  }

  const myBusinesses = appState.businesses.filter(
    (business) => Number(business.user_id) === Number(user.id)
  );

  const joinedCount = appState.joinedCampaigns.length;
  const promotedBusinessCount = myBusinesses.length;
  const activeCount = Number(appState.campaignStats.active_count || 0);
  const pendingCount = Number(appState.campaignStats.pending_count || 0);
  const rejectedCount = Number(appState.campaignStats.rejected_count || 0);

  const impactPoints =
    (joinedCount * 25) +
    (promotedBusinessCount * 40) +
    (activeCount * 60) +
    (pendingCount * 10);

  const volunteerHours = (joinedCount * 6) + (activeCount * 3);

  const level = Math.max(1, Math.floor(impactPoints / 100) + 1);
  const streakDays = Math.max(1, Math.min(30, joinedCount + activeCount));

  if (exists("dashboardName")) $("dashboardName").textContent = user.name;

  if (exists("dashboardMeta")) {
    $("dashboardMeta").textContent = user.role === "admin"
      ? "Admin • Impact Hub"
      : "Impact Maker";
  }

  const levelBadge = document.querySelector(".badge-level");
  if (levelBadge) levelBadge.textContent = `Level ${level}`;

  const streakBadge = document.querySelector(".badge-streak");
  if (streakBadge) streakBadge.textContent = `🔥 ${streakDays} Day Streak`;

  if (exists("statCampaigns")) $("statCampaigns").textContent = joinedCount;
  if (exists("statPoints")) $("statPoints").textContent = impactPoints;
  if (exists("statBusinesses")) $("statBusinesses").textContent = promotedBusinessCount;
  if (exists("statHours")) $("statHours").textContent = volunteerHours;

  const statCampaignsSub = document.querySelector("#statCampaigns")?.nextElementSibling?.nextElementSibling;
if (statCampaignsSub) statCampaignsSub.textContent = "Click to view joined campaigns";

  const statPointsSub = document.querySelector("#statPoints")?.nextElementSibling?.nextElementSibling;
  if (statPointsSub) statPointsSub.textContent = `${Math.max(0, level * 100 - impactPoints)} to next level`;

  const statBusinessesSub = document.querySelector("#statBusinesses")?.nextElementSibling?.nextElementSibling;
  if (statBusinessesSub) statBusinessesSub.textContent = promotedBusinessCount ? "Promoted by you" : "No businesses yet";

  const statHoursSub = document.querySelector("#statHours")?.nextElementSibling?.nextElementSibling;
  if (statHoursSub) statHoursSub.textContent = `${joinedCount} joined campaigns`;

  if (exists("userActiveCampaigns")) $("userActiveCampaigns").textContent = activeCount;
  if (exists("userPendingCampaigns")) $("userPendingCampaigns").textContent = pendingCount;
  if (exists("userRejectedCampaigns")) $("userRejectedCampaigns").textContent = rejectedCount;

  renderDashboardInterestTags();
  renderVolunteerHoursChart(joinedCount, activeCount, pendingCount);
  renderImpactCategoryChart();
}

function renderDashboardInterestTags() {
  const dashboardInterestTags = $("dashboardInterestTags");
  if (!dashboardInterestTags) return;

  dashboardInterestTags.innerHTML = "";

  if (!appState.selectedInterests || appState.selectedInterests.length === 0) {
    const empty = document.createElement("p");
    empty.className = "small-muted";
    empty.textContent = "No interests selected yet.";
    dashboardInterestTags.appendChild(empty);
    return;
  }

  appState.selectedInterests.forEach((interest) => {
    const tag = document.createElement("span");
    tag.className = "interest-tag";
    tag.textContent = getInterestLabel(interest);
    dashboardInterestTags.appendChild(tag);
  });
}

function renderVolunteerHoursChart(joinedCount, activeCount, pendingCount) {
  const points = [
    Math.max(2, joinedCount),
    Math.max(4, joinedCount + 1),
    Math.max(6, joinedCount + activeCount),
    Math.max(8, joinedCount + activeCount + 1),
    Math.max(10, joinedCount + activeCount + pendingCount),
    Math.max(12, joinedCount + activeCount + pendingCount + 2)
  ];

  const maxValue = Math.max(...points, 12);
  const svg = document.querySelector(".hours-chart-svg");
  if (!svg) return;

  const width = 520;
  const height = 240;
  const stepX = width / (points.length - 1);

  const linePoints = points.map((value, index) => {
    const x = index * stepX;
    const y = height - (value / maxValue) * 220;
    return `${x},${y}`;
  });

  const areaPath =
    `M${linePoints[0]} ` +
    linePoints.slice(1).map((p) => `L${p}`).join(" ") +
    ` L${width},240 L0,240 Z`;

  const linePath =
    `M${linePoints[0]} ` +
    linePoints.slice(1).map((p) => `L${p}`).join(" ");

  const area = svg.querySelector(".hours-area-fill");
  const line = svg.querySelector(".hours-line");

  if (area) area.setAttribute("d", areaPath);
  if (line) line.setAttribute("d", linePath);
}

function renderImpactCategoryChart() {
  const counts = {
    environment: 0,
    education: 0,
    community: 0,
    justice: 0
  };

  const normalizeCategory = (category) => {
    const value = String(category || "").toLowerCase();

    if (value.includes("environment")) return "environment";
    if (value.includes("education")) return "education";
    if (value.includes("community")) return "community";
    if (value.includes("equality") || value.includes("justice")) return "justice";
    if (value.includes("health")) return "community";
    if (value.includes("poverty")) return "community";
    return null;
  };

  appState.joinedCampaigns.forEach((campaign) => {
    const key = normalizeCategory(campaign.category);
    if (key) counts[key] += 1;
  });

  appState.myCampaigns.forEach((campaign) => {
    const key = normalizeCategory(campaign.category);
    if (key) counts[key] += 1;
  });

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;

  const env = (counts.environment / total) * 100;
  const edu = (counts.education / total) * 100;
  const comm = (counts.community / total) * 100;
  const just = (counts.justice / total) * 100;

  const pie = document.querySelector(".impact-pie-chart");
  if (pie) {
    pie.style.background = `conic-gradient(
      #34d399 0% ${env}%,
      #60a5fa ${env}% ${env + edu}%,
      #fbbf24 ${env + edu}% ${env + edu + comm}%,
      #f472b6 ${env + edu + comm}% 100%
    )`;
  }

  const labelEnvironment = document.querySelector(".label-environment");
  const labelEducation = document.querySelector(".label-education");
  const labelCommunity = document.querySelector(".label-community");
  const labelJustice = document.querySelector(".label-justice");

  if (labelEnvironment) labelEnvironment.textContent = `Environment ${counts.environment}`;
  if (labelEducation) labelEducation.textContent = `Education ${counts.education}`;
  if (labelCommunity) labelCommunity.textContent = `Community ${counts.community}`;
  if (labelJustice) labelJustice.textContent = `Justice ${counts.justice}`;
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

function renderCauseSkeletons(count = 3) {
  const causeGrid = $("causeGrid");
  if (!causeGrid) return;

  causeGrid.innerHTML = "";
  causeGrid.classList.add("skeleton-grid");

  for (let i = 0; i < count; i++) {
    const card = document.createElement("article");
    card.className = "skeleton-card";
    card.innerHTML = `
      <div class="skeleton-image"></div>
      <div class="skeleton-body">
        <div class="skeleton-line title"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line long"></div>
        <div class="skeleton-line medium"></div>
      </div>
    `;
    causeGrid.appendChild(card);
  }
}

function renderBusinessSkeletons(count = 3) {
  const businessGrid = $("businessGrid");
  if (!businessGrid) return;

  businessGrid.innerHTML = "";
  businessGrid.classList.add("skeleton-grid");

  for (let i = 0; i < count; i++) {
    const card = document.createElement("article");
    card.className = "skeleton-card";
    card.innerHTML = `
      <div class="skeleton-image"></div>
      <div class="skeleton-body">
        <div class="skeleton-line title"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line long"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line button"></div>
      </div>
    `;
    businessGrid.appendChild(card);
  }
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
    appState.joinedCampaigns = loadJoinedCampaigns(data.user);
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

function handleLogout() {
  clearSession();
  appState.selectedInterests = [];
  appState.joinedCampaigns = [];
  appState.myCampaigns = [];
  appState.adminPendingCampaigns = [];
  appState.campaignStats = {
    active_count: 0,
    pending_count: 0,
    rejected_count: 0
  };
  renderNav();
  showView("landingView");
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

  if (exists("discoverBtn")) {
    $("discoverBtn").addEventListener("click", scrollToCauses);
  }

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

  if (exists("campaignForm")) {
    $("campaignForm").addEventListener("submit", handleCampaignSubmit);
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

  if (exists("closeBusinessDetailModal")) {
  $("closeBusinessDetailModal").addEventListener("click", closeBusinessDetailsModal);
}


if (exists("businessDetailModal")) {
  $("businessDetailModal").addEventListener("click", (event) => {
    if (
      event.target.classList.contains("custom-modal-backdrop") ||
      event.target.id === "businessDetailModal"
    ) {
      closeBusinessDetailsModal();
    }
  });
}

if (exists("openJoinedCampaignsCard")) {
  $("openJoinedCampaignsCard").addEventListener("click", showJoinedCampaignsModal);
  $("openJoinedCampaignsCard").addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showJoinedCampaignsModal();
    }
  });
}

if (exists("closeJoinedCampaignsModal")) {
  $("closeJoinedCampaignsModal").addEventListener("click", closeJoinedCampaignsModal);
}

if (exists("joinedCampaignsModal")) {
  $("joinedCampaignsModal").addEventListener("click", (event) => {
    if (
      event.target.classList.contains("custom-modal-backdrop") ||
      event.target.id === "joinedCampaignsModal"
    ) {
      closeJoinedCampaignsModal();
    }
  });
}

if (exists("closeCampaignDetailModal")) {
  $("closeCampaignDetailModal").addEventListener("click", closeCampaignDetailsModal);
}

if (exists("campaignDetailModal")) {
  $("campaignDetailModal").addEventListener("click", (event) => {
    if (
      event.target.classList.contains("custom-modal-backdrop") ||
      event.target.id === "campaignDetailModal"
    ) {
      closeCampaignDetailsModal();
    }
  });
}

if (exists("openMyBusinessesCard")) {
  $("openMyBusinessesCard").addEventListener("click", showMyBusinessesModal);
  $("openMyBusinessesCard").addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showMyBusinessesModal();
    }
  });
}

if (exists("closeMyBusinessesModal")) {
  $("closeMyBusinessesModal").addEventListener("click", closeMyBusinessesModal);
}

if (exists("myBusinessesModal")) {
  $("myBusinessesModal").addEventListener("click", (event) => {
    if (
      event.target.classList.contains("custom-modal-backdrop") ||
      event.target.id === "myBusinessesModal"
    ) {
      closeMyBusinessesModal();
    }
  });
}

if (exists("campaignTitle")) $("campaignTitle").addEventListener("input", updateCampaignPreview);
if (exists("campaignDescription")) $("campaignDescription").addEventListener("input", updateCampaignPreview);
if (exists("campaignCategory")) $("campaignCategory").addEventListener("input", updateCampaignPreview);
if (exists("campaignGoalAmount")) $("campaignGoalAmount").addEventListener("input", updateCampaignPreview);
if (exists("campaignGoalUsers")) {
  $("campaignGoalUsers").addEventListener("input", updateCampaignPreview);
}
if (exists("campaignImage")) {
  $("campaignImage").addEventListener("change", updateCampaignImagePreview);
}

  setupFilters();
  setupViewButtons();
  setupMenuToggle();
  setupBusinessCategoryButtons();
  setupBusinessLogoPreview();
  setupCampaignCategoryButtons();
}


function init() {

  document.body.classList.remove("modal-open");
  
 if (appState.currentUser) {
  appState.selectedInterests = loadSelectedInterests(appState.currentUser);
  appState.joinedCampaigns = loadJoinedCampaigns(appState.currentUser);
} else {
  appState.joinedCampaigns = loadJoinedCampaigns(null);
}

  renderNav();
  loadCampaigns();
  loadBusinesses();
  updateBusinessPreview();
  updateCampaignPreview();
  bindEvents();

  if (appState.currentUser && exists("dashboardView")) {
    updateDashboard();
  }

  if (appState.currentUser?.role === "admin" && exists("adminDashboardView")) {
    loadAdminPendingCampaigns();
  }

  showView("landingView");
}

window.addEventListener("DOMContentLoaded", init);