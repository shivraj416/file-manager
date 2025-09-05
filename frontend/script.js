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

  // ✅ Save in localStorage
  localStorage.setItem("username", u);
  localStorage.setItem("password", p);
  localStorage.setItem("mobile", m);

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

  const savedUser = localStorage.getItem("username");
  const savedPass = localStorage.getItem("password");

  if (u === savedUser && p === savedPass) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("homePage").style.display = "block";
    loadYears();
    populateFileSuggestions();
  } else {
    alert("❌ Invalid username or password!");
  }
}

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

  const savedMobile = localStorage.getItem("mobile");

  if (enteredMobile === savedMobile) {
    localStorage.setItem("password", newPass);
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

// ---- Year changed ----
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

// ---- Cancel file ----
function cancelFile() {
  const section = document.getElementById("fileSection");
  if (section) section.innerHTML = "";
}

// ---- Upload images/PDFs ----
function uploadImages(year, fileKey) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*,.pdf";
  input.multiple = true;

  input.onchange = async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    showLoader(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (file.type === "application/pdf" && file.size > 50 * 1024 * 1024) {
          alert(`PDF "${file.name}" exceeds 50 MB limit!`);
          return;
        }

        const formData = new FormData();
        formData.append("files", file);

        await fetch(
          `http://localhost:5000/upload/${encodeURIComponent(year)}/${encodeURIComponent(fileKey)}`,
          { method: "POST", body: formData }
        );
      });

      await Promise.all(uploadPromises);
      loadImages(year, fileKey);
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Some uploads failed! Check console.");
    } finally {
      showLoader(false);
    }
  };

  input.click();
}

// ---- Load images/PDFs ----
async function loadImages(year, fileKey) {
  const container = document.getElementById("imagesContainer");
  if (!container) return;
  container.innerHTML = "";

  const res = await fetch(`http://localhost:5000/files/${encodeURIComponent(year)}/${encodeURIComponent(fileKey)}`);
  const results = await res.json();

  results.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "inline-block";
    wrapper.style.margin = "10px";
    wrapper.style.textAlign = "center";

    if (item.fileUrl.endsWith(".pdf")) {
      const link = document.createElement("a");
      link.href = item.fileUrl;
      link.target = "_blank";
      link.textContent = "Open PDF";
      wrapper.appendChild(link);
    } else {
      const img = document.createElement("img");
      img.src = item.fileUrl;
      img.style.width = "100px";
      img.style.height = "100px";
      img.style.objectFit = "cover";
      img.style.cursor = "pointer";
      img.onclick = () => openModal(img.src);
      wrapper.appendChild(img);
    }

    const btn = document.createElement("button");
    btn.textContent = "Delete";
    btn.style.display = "block";
    btn.style.marginTop = "5px";
    btn.onclick = () => deleteFile(item._id, item.publicId, year, fileKey);

    wrapper.appendChild(btn);
    container.appendChild(wrapper);
  });
}

// ---- Delete file ----
async function deleteFile(id, publicId, year, fileKey) {
  try {
    showLoader(true);
    const res = await fetch("http://localhost:5000/file", {
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
