// ---- CONFIG: set this to your backend (use PC LAN IP or deployed URL for Android) ----
const API_BASE = "http://localhost:5000"; // <-- change to "http://192.168.1.100:5000" or your deployed URL

// ---- Credentials (saved on register) ----
let REGISTERED_USERNAME = localStorage.getItem("REGISTERED_USERNAME") || null;
let REGISTERED_PASSWORD = localStorage.getItem("REGISTERED_PASSWORD") || null;
let REGISTERED_MOBILE   = localStorage.getItem("REGISTERED_MOBILE") || null;

// ---- Session timeout (5 minutes) ----
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in ms

function setSessionActive() {
  localStorage.setItem("LOGGED_IN", "true");
  localStorage.setItem("LAST_LOGIN", Date.now().toString());
}

function isSessionValid() {
  const loggedIn = localStorage.getItem("LOGGED_IN") === "true";
  const lastLogin = parseInt(localStorage.getItem("LAST_LOGIN") || "0", 10);
  if (!loggedIn || !lastLogin) return false;
  return Date.now() - lastLogin <= SESSION_TIMEOUT;
}

function logout() {
  localStorage.removeItem("LOGGED_IN");
  localStorage.removeItem("LAST_LOGIN");
  document.getElementById("homePage").style.display = "none";
  document.getElementById("loginPage").style.display = "block";
}

// ---- File key generator ----
function buildFileKeys() {
  const base = [];
  for (let i = 1; i <= 33; i++) base.push(`namuna no ${i}`);

  const extras = [
    "gramnidhi", "MRE.GS", "15 va aayog", "panipuravatha",
    "16 va aayog", "dalit-vasti", "itar"
  ];

  const special = [];
  [5, 12].forEach((n) => {
    extras.forEach((x) => special.push(`namuna no ${n} ${x}`));
  });

  const extended = [
    "namuna no 34 takrar aarj",
    "namuna no 35 passbook",
    "namuna no 36 labharthi",
    "namuna no 37 gharbhandhakam",
    "namuna no 38 sammati-pattre",
    "namuna no 39 vikas-kame",
    "namuna no 40 audit report",
    "namuna no 41 vivah-nondh",
    "namuna no 42 masik-sabha",
    "namuna no 43 gram-sabha",
    "namuna no 44 itar",
  ];

  return [...base, ...special, ...extended];
}

const ALLOWED_KEYS = buildFileKeys().map((k) => k.toLowerCase());

// ---- Register function ----
function register() {
  const uEl = document.getElementById("regUsername");
  const pEl = document.getElementById("regPassword");
  const cEl = document.getElementById("regConfirm");
  const mEl = document.getElementById("regMobile");

  if (!uEl || !pEl || !cEl || !mEl) {
    alert("⚠️ Registration form inputs not found in HTML!");
    return;
  }

  const u = uEl.value.trim();
  const p = pEl.value.trim();
  const c = cEl.value.trim();
  const m = mEl.value.trim();

  if (!u || !p || !c || !m) {
    alert("All fields are required!");
    return;
  }
  if (p !== c) {
    alert("Passwords do not match!");
    return;
  }
  if (!/^[0-9]{10}$/.test(m)) {
    alert("Enter a valid 10-digit mobile number!");
    return;
  }

  // ✅ Save to memory & persist
  REGISTERED_USERNAME = u;
  REGISTERED_PASSWORD = p;
  REGISTERED_MOBILE = m;

  localStorage.setItem("REGISTERED_USERNAME", u);
  localStorage.setItem("REGISTERED_PASSWORD", p);
  localStorage.setItem("REGISTERED_MOBILE", m);

  alert("✅ Registration successful! Now login.");
  document.getElementById("registerPage").style.display = "none";
  document.getElementById("loginPage").style.display = "block";
}

// ---- Login function ----
function login() {
  const uEl = document.getElementById("username");
  const pEl = document.getElementById("password");

  if (!uEl || !pEl) {
    alert("⚠️ Login form inputs not found in HTML!");
    return;
  }

  const u = uEl.value.trim();
  const p = pEl.value.trim();

  if (u === REGISTERED_USERNAME && p === REGISTERED_PASSWORD) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("homePage").style.display = "block";
    loadYears();
    populateFileSuggestions();
    setSessionActive();
  } else {
    alert("❌ Invalid username or password!");
  }
}

// ---- Auto login if registered & session valid ----
window.addEventListener("load", () => {
  if (REGISTERED_USERNAME && REGISTERED_PASSWORD && isSessionValid()) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("homePage").style.display = "block";
    loadYears();
    populateFileSuggestions();
  } else {
    logout();
  }
});

// ---- Forgot password functions ----
function showForgotPassword() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("forgotPage").style.display = "block";
}

function resetPassword() {
  const mEl = document.getElementById("forgotMobile");
  const npEl = document.getElementById("newPassword");

  if (!mEl || !npEl) {
    alert("⚠️ Forgot password form inputs not found!");
    return;
  }

  const enteredMobile = mEl.value.trim();
  const newPass = npEl.value.trim();

  if (!enteredMobile || !newPass) {
    alert("All fields are required!");
    return;
  }

  if (enteredMobile === REGISTERED_MOBILE) {
    REGISTERED_PASSWORD = newPass;
    localStorage.setItem("REGISTERED_PASSWORD", newPass); // ✅ persist
    alert("✅ Password reset successful! Please login.");
    document.getElementById("forgotPage").style.display = "none";
    document.getElementById("loginPage").style.display = "block";
  } else {
    alert("❌ Mobile number not found!");
  }
}

function backToLogin() {
  document.getElementById("forgotPage").style.display = "none";
  document.getElementById("loginPage").style.display = "block";
}

// ---- Show/Hide password toggle ----
function togglePassword(id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
}

// ---- Populate datalist suggestions ----
function populateFileSuggestions() {
  const dl = document.getElementById("fileSuggestions");
  if (!dl) return;
  dl.innerHTML = "";
  buildFileKeys().forEach((label) => {
    const opt = document.createElement("option");
    opt.value = label;
    dl.appendChild(opt);
  });
}

// ---- Load years ----
function loadYears() {
  const yearSelect = document.getElementById("yearSelect");
  if (!yearSelect) return;
  yearSelect.innerHTML = "";

  for (let y = 2010; y <= 2039; y++) {
    const safeValue = `${y}-${String(y + 1).slice(-2)}`;
    const prettyLabel = `${y} / ${String(y + 1).slice(-2)}`;
    const option = document.createElement("option");
    option.value = safeValue;
    option.textContent = prettyLabel;
    yearSelect.appendChild(option);
  }
}

function yearChanged() {
  const section = document.getElementById("fileSection");
  const input = document.getElementById("searchInput");
  if (section) section.innerHTML = "";
  if (input) input.value = "";
}

// ---- Search file ----
function searchFile() {
  const input = document.getElementById("searchInput");
  const yearSelect = document.getElementById("yearSelect");
  const section = document.getElementById("fileSection");

  if (!input || !yearSelect || !section) {
    alert("⚠️ Search inputs missing!");
    return;
  }

  const queryRaw = input.value.trim();
  const query = queryRaw.toLowerCase();
  const year = yearSelect.value;
  section.innerHTML = "";

  if (!ALLOWED_KEYS.includes(query)) {
    alert("Please choose a valid option from suggestions (e.g. namuna no 1).");
    return;
  }

  const headerLabel = `${queryRaw.toUpperCase()} (${year.replace("-", " / ")})`;

  const div = document.createElement("div");
  div.innerHTML = `
    <h3>${headerLabel}</h3>
    <button onclick="uploadImages('${year}', '${query}')">Upload</button>
    <button onclick="cancelFile()">Cancel</button>
    <div id="imagesContainer"></div>
  `;
  section.appendChild(div);
  loadImages(year, query);
}

function cancelFile() {
  const section = document.getElementById("fileSection");
  if (section) section.innerHTML = "";
}

// ---- Upload images/PDFs ----
// NOTE: this function now does robust per-file uploads, sequentially, with timeouts and friendly errors.
function uploadImages(year, fileKey) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*,.pdf";
  input.multiple = true;

  input.onchange = async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    if (!navigator.onLine) {
      alert("You are offline. Please connect to the internet and try again.");
      return;
    }

    showLoader(true);

    const failed = [];
    const uploaded = [];

    // Upload sequentially to reduce memory pressure on server (safer for mobile)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type === "application/pdf" && file.size > 50 * 1024 * 1024) {
        failed.push({ name: file.name, reason: "PDF exceeds 50 MB limit" });
        continue;
      }

      // create small timeout wrapper for fetch using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60 * 1000); // 60s timeout

      try {
        const formData = new FormData();
        formData.append("files", file);

        // use encodeURIComponent on path pieces
        const url = `${API_BASE}/upload/${encodeURIComponent(year)}/${encodeURIComponent(fileKey)}`;

        const res = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          // try to parse JSON message if present
          let errText = `HTTP ${res.status}`;
          try {
            const json = await res.json();
            if (json && json.error) errText = json.error;
            else if (json && json.message) errText = json.message;
          } catch (parseErr) {
            // ignore parse error
          }
          failed.push({ name: file.name, reason: errText });
          console.error("Upload failed for", file.name, errText);
        } else {
          uploaded.push(file.name);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        const reason = err.name === "AbortError" ? "Upload timed out" : err.message || "Network error";
        failed.push({ name: file.name, reason });
        console.error("Upload error for", file.name, err);
      }
    }

    showLoader(false);

    // Reload images (best effort)
    loadImages(year, fileKey);

    // Summary to user
    if (uploaded.length > 0 && failed.length === 0) {
      alert(`✅ Uploaded ${uploaded.length} file(s) successfully.`);
    } else if (uploaded.length > 0 && failed.length > 0) {
      alert(`⚠️ ${uploaded.length} uploaded, ${failed.length} failed.\nFailed: ${failed.map(f => `${f.name} (${f.reason})`).join(", ")}`);
    } else {
      alert(`❌ All uploads failed. Reason(s): ${failed.map(f => `${f.name} (${f.reason})`).join(", ")}`);
    }
  };

  input.click();
}

// ---- Load images/PDFs ----
async function loadImages(year, fileKey) {
  const container = document.getElementById("imagesContainer");
  if (!container) return;
  container.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/files/${encodeURIComponent(year)}/${encodeURIComponent(fileKey)}`);
    if (!res.ok) {
      const text = await res.text().catch(()=>null);
      console.error("Files fetch failed:", res.status, text);
      container.innerHTML = "<p>Error loading files.</p>";
      return;
    }
    const results = await res.json();

    if (!Array.isArray(results) || results.length === 0) {
      container.innerHTML = "<p>No files yet.</p>";
      return;
    }

    results.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.style.display = "inline-block";
      wrapper.style.margin = "10px";
      wrapper.style.textAlign = "center";

      if (item.fileUrl && item.fileUrl.endsWith(".pdf")) {
        const link = document.createElement("a");
        link.href = item.fileUrl;
        link.target = "_blank";
        link.textContent = "Open PDF";
        wrapper.appendChild(link);
      } else if (item.fileUrl) {
        const img = document.createElement("img");
        img.src = item.fileUrl;
        img.style.width = "100px";
        img.style.height = "100px";
        img.style.objectFit = "cover";
        img.style.cursor = "pointer";
        img.onclick = () => openModal(img.src);
        wrapper.appendChild(img);
      } else {
        const span = document.createElement("div");
        span.textContent = "Unknown file";
        wrapper.appendChild(span);
      }

      const btn = document.createElement("button");
      btn.textContent = "Delete";
      btn.style.display = "block";
      btn.style.marginTop = "5px";
      btn.onclick = () => deleteFile(item._id, item.publicId, year, fileKey);

      wrapper.appendChild(btn);
      container.appendChild(wrapper);
    });
  } catch (err) {
    console.error("❌ Load images error:", err);
    container.innerHTML = "<p>Error loading files. Check server.</p>";
  }
}

// ---- Delete file ----
async function deleteFile(id, publicId, year, fileKey) {
  try {
    showLoader(true);
    const res = await fetch(`${API_BASE}/file`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, publicId }),
    });

    const data = await res.json();
    if (data.success) {
      loadImages(year, fileKey);
    } else {
      alert("❌ Delete failed: " + JSON.stringify(data));
    }
  } catch (err) {
    console.error("❌ Delete error:", err);
    alert("Error deleting file. Check server logs.");
  } finally {
    showLoader(false);
  }
}

// ---- Modal ----
function openModal(src) {
  const modalImg = document.getElementById("modalImg");
  const modal = document.getElementById("imageModal");
  if (!modalImg || !modal) return;
  modalImg.src = src;
  modal.style.display = "flex";
}
function closeModal() {
  const modal = document.getElementById("imageModal");
  if (modal) modal.style.display = "none";
}
function printImage() {
  const img = document.getElementById("modalImg");
  if (!img) return;
  const w = window.open("");
  w.document.write('<img src="' + img.src + '" style="width:100%">');
  w.print();
}

// ---- Loader ----
function showLoader(show) {
  const loader = document.getElementById("loader");
  if (!loader) return;
  loader.style.display = show ? "flex" : "none";
}
