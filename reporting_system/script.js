/////////////////////////////
// ENUM
/////////////////////////////
const Severity = Object.freeze({
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High"
});

/////////////////////////////
// USERS
/////////////////////////////
const USERS = [
    { username: "Eliáš", password: "Heslo1" },
    { username: "Švarc", password: "Heslo2" },
    { username: "Gras", password: "Heslo3" }
];

const OWNER_IMAGES = {
    "Eliáš": "img/elias.png",
    "Švarc": "img/svarc.png",
    "Gras": "img/gras.png"
};

function loadImageAsDataURL(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement("canvas");

            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            resolve(canvas.toDataURL("image/png"));
        };

        img.onerror = () => {
            reject("Image could not be loaded: " + url);
        };

        img.src = url;
    });
}

/////////////////////////////
// CLASS
/////////////////////////////
class Report {
    constructor(name, type, severity, description, user, owner) {
        this.id = Date.now();
        this.name = name;
        this.type = type;
        this.severity = severity;
        this.description = description;
        this.timestamp = new Date().toISOString();
        this.user = user;
        this.owner = owner;
    }
}

/////////////////////////////
// DATA
/////////////////////////////
let reports = JSON.parse(localStorage.getItem("reports")) || [];
let editingId = null;
let deleteId = null;
let currentPage = 1;
let reportsPerPage = parseInt(localStorage.getItem("reportsPerPage")) || 5;

/////////////////////////////
// LOGIN
/////////////////////////////
function login() {
    const u = document.getElementById("username");
    const p = document.getElementById("password");
    const err = document.getElementById("loginError");

    err.innerText = "";

    const user = USERS.find(x =>
        x.username === u.value && x.password === p.value
    );

    if (!user) {
        err.innerText = "Incorrect username or password.";
        u.classList.add("input-error");
        p.classList.add("input-error");
        return;
    }

    localStorage.setItem("loggedUser", JSON.stringify({ username: u.value }));
    showApp();
}

function logout() {
    localStorage.removeItem("loggedUser");
    location.reload();
}

function currentUser() {
    return JSON.parse(localStorage.getItem("loggedUser"));
}

function showApp() {
    loginSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    reportsPerPageSelect.value = reportsPerPage;

    populateOwnerSelects();
    renderReports();
}

function populateOwnerSelects() {
    const selects = [reportOwner, editOwner, filterOwner];

    selects.forEach(select => {
        if (!select) return;

        const firstOpt = select.options[0];

        select.innerHTML = "";
        select.appendChild(firstOpt);

        USERS.forEach(u => {
            const opt = document.createElement("option");

            opt.value = u.username;
            opt.textContent = u.username;

            select.appendChild(opt);
        });
    });
}

/////////////////////////////
// SAVE
/////////////////////////////
function saveReport() {
    reports.push(new Report(
        reportName.value,
        reportType.value,
        reportSeverity.value,
        reportDescription.value,
        currentUser().username,
        reportOwner.value
    ));

    localStorage.setItem("reports", JSON.stringify(reports));

    reportName.value = "";
    reportType.value = "";
    reportSeverity.value = "";
    reportDescription.value = "";
    reportOwner.value = "";

    renderReports();
}

/////////////////////////////
// PAGINATION
/////////////////////////////
function changeReportsPerPage() {
    reportsPerPage = +reportsPerPageSelect.value;

    localStorage.setItem("reportsPerPage", reportsPerPage);

    currentPage = 1;

    renderReports();
}

function nextPage() {
    const totalPages = getTotalPages();

    if (currentPage < totalPages) {
        currentPage++;
        renderReports();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderReports();
    }
}

function getFilteredReports() {
    const name = filterName.value.toLowerCase().trim();
    const type = filterType.value.toLowerCase().trim();
    const user = filterUser.value.toLowerCase().trim();
    const owner = filterOwner.value.toLowerCase().trim();
    const desc = filterDescription.value.toLowerCase().trim();
    const severity = filterSeverity.value;

    return reports.filter(r => {
        return (
            (!name || r.name.toLowerCase().includes(name)) &&
            (!type || r.type.toLowerCase().includes(type)) &&
            (!user || r.user.toLowerCase().includes(user)) &&
            (!owner || (r.owner && r.owner.toLowerCase().includes(owner))) &&
            (!desc || r.description.toLowerCase().includes(desc)) &&
            (!severity || r.severity === severity)
        );
    });
}

function getTotalPages() {
    const filtered = getFilteredReports();

    return Math.max(
        1,
        Math.ceil(filtered.length / reportsPerPage)
    );
}

function updatePaginationButtons(totalPages) {
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (!prevBtn || !nextBtn) return;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

/////////////////////////////
// RENDER
/////////////////////////////
function renderReports() {
    const tbody = document.getElementById("reportTable");

    tbody.innerHTML = "";

    const filtered = getFilteredReports();

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / reportsPerPage)
    );

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * reportsPerPage;
    const pageItems = filtered.slice(start, start + reportsPerPage);

    pageItems.forEach(r => {
        const sev = r.severity.toLowerCase();
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${r.id}</td>
            <td>${r.name}</td>
            <td>${r.type}</td>
            <td><span class="badge ${sev}">${r.severity}</span></td>
            <td>${new Date(r.timestamp).toLocaleString()}</td>
            <td>${r.description}</td>
            <td>${r.user}</td>
            <td>${r.owner || "-"}</td>
            <td class="actions">
                <button onclick="editReport(${r.id})">Edit</button>
                <button class="delete-btn" onclick="openDelete(${r.id})">Delete</button>
                <button class="pdf-btn" onclick="exportPDF(${r.id})">PDF</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;

    updatePaginationButtons(totalPages);
}

/////////////////////////////
// EDIT
/////////////////////////////
function editReport(id) {
    const r = reports.find(x => x.id === id);

    if (!r) return;

    editingId = id;

    editName.value = r.name;
    editType.value = r.type;
    editSeverity.value = r.severity;
    editDescription.value = r.description;
    editOwner.value = r.owner || "";

    editModal.classList.remove("hidden");
}

function closeEditModal() {
    editModal.classList.add("hidden");
    editingId = null;
}

function updateReport() {
    const i = reports.findIndex(r => r.id === editingId);

    if (i === -1) return;

    reports[i].name = editName.value;
    reports[i].type = editType.value;
    reports[i].severity = editSeverity.value;
    reports[i].description = editDescription.value;
    reports[i].owner = editOwner.value;

    localStorage.setItem("reports", JSON.stringify(reports));

    closeEditModal();
    renderReports();
}

/////////////////////////////
// DELETE
/////////////////////////////
function openDelete(id) {
    deleteId = id;
    deleteModal.classList.remove("hidden");
}

function confirmDelete() {
    reports = reports.filter(r => r.id !== deleteId);

    localStorage.setItem("reports", JSON.stringify(reports));

    deleteId = null;

    deleteModal.classList.add("hidden");

    renderReports();
}

function closeDeleteModal() {
    deleteModal.classList.add("hidden");
    deleteId = null;
}

/////////////////////////////
// PDF
/////////////////////////////
async function exportPDF(id) {
    const r = reports.find(x => x.id === id);

    if (!r) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("REPORT", 20, 20);

    doc.setFontSize(12);

    doc.text(`ID: ${r.id}`, 20, 40);
    doc.text(`Name: ${r.name}`, 20, 50);
    doc.text(`Type: ${r.type}`, 20, 60);
    doc.text(`Severity: ${r.severity}`, 20, 70);
    doc.text(`Created by: ${r.user}`, 20, 80);
    doc.text(`Owner: ${r.owner || "Unassigned"}`, 20, 90);

    if (r.owner && OWNER_IMAGES[r.owner]) {
        try {
            const imgData = await loadImageAsDataURL(
                OWNER_IMAGES[r.owner]
            );

            doc.addImage(
                imgData,
                "PNG",
                150,
                30,
                40,
                40
            );
        } catch (error) {
            console.error(
                "Failed to load owner image:",
                error
            );
        }
    }

    doc.text("Description:", 20, 110);

    doc.text(
        r.description || "-",
        20,
        120
    );

    doc.save(`report_${r.id}.pdf`);
}

/////////////////////////////
// AUTO LOGIN
/////////////////////////////
if (localStorage.getItem("loggedUser")) {
    showApp();
}