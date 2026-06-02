/////////////////////////////
// ENUMS & CONSTANTS
/////////////////////////////
const Severity = Object.freeze({
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High"
});

const USERS = [
    { username: "Eliáš" },
    { username: "Švarc" },
    { username: "Gras" }
];

const OWNER_IMAGES = {
    "Eliáš": "img/elias.png",
    "Švarc": "img/svarc.png",
    "Gras": "img/gras.png"
};

const BASE_URL = 'https://localhost:7190/ReportSystem';

/////////////////////////////
// STATE VARIABLES
/////////////////////////////
let reports = []; 
let editingId = null;
let deleteId = null;
let currentPage = 1;
let reportsPerPage = parseInt(localStorage.getItem("reportsPerPage")) || 5;

/////////////////////////////
// LOGIN / LOGOUT
/////////////////////////////
async function login() {
    const u = document.getElementById("username");
    const p = document.getElementById("password");
    const err = document.getElementById("loginError");

    err.innerText = "";
    u.classList.remove("input-error");
    p.classList.remove("input-error");

    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u.value, password: p.value })
        });

        if (!response.ok) {
            err.innerText = "Incorrect username or password.";
            u.classList.add("input-error");
            p.classList.add("input-error");
            return;
        }

        const data = await response.json();
        
        const loggedInName = data.nickname || data.Nickname || u.value;
        localStorage.setItem("loggedUser", JSON.stringify({ username: loggedInName }));
        
        showApp();
    } catch (error) {
        console.error('API call failed:', error);
        err.innerText = "Cannot connect to the server.";
    }
}

function logout() {
    localStorage.removeItem("loggedUser");
    location.reload();
}

function loggedUser() {
    return JSON.parse(localStorage.getItem("loggedUser"));
}

/////////////////////////////
// INITIALIZATION
/////////////////////////////
function showApp() {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("appSection").classList.remove("hidden");
    
    if(document.getElementById("reportsPerPageSelect")) {
        document.getElementById("reportsPerPageSelect").value = reportsPerPage;
    }

    populateOwnerSelects();
    fetchReports();
}

function populateOwnerSelects() {
    const selects = [
        document.getElementById("reportOwner"), 
        document.getElementById("editOwner"), 
        document.getElementById("filterOwner")
    ];

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
// CRUD OPERATIONS (API CALLS)
/////////////////////////////
async function fetchReports() {
    try {
        const response = await fetch(`${BASE_URL}/reports`);
        reports = await response.json();
        renderReports();
    } catch (error) {
        console.error("Failed to load reports:", error);
    }
}

async function saveReport() {
    const newReport = {
        name: document.getElementById("reportName").value,
        type: document.getElementById("reportType").value,
        severity: document.getElementById("reportSeverity").value,
        description: document.getElementById("reportDescription").value,
        user: loggedUser().username,
        owner: document.getElementById("reportOwner").value
    };

    try {
        await fetch(`${BASE_URL}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newReport)
        });

        // Clear inputs
        document.getElementById("reportName").value = "";
        document.getElementById("reportType").value = "";
        document.getElementById("reportSeverity").value = "";
        document.getElementById("reportDescription").value = "";
        document.getElementById("reportOwner").value = "";

        fetchReports();
    } catch (error) {
        console.error("Failed to save report:", error);
    }
}

function editReport(id) {
    const r = reports.find(x => x.id === id);
    if (!r) return;

    editingId = id;
    document.getElementById("editName").value = r.name;
    document.getElementById("editType").value = r.type;
    document.getElementById("editSeverity").value = r.severity;
    document.getElementById("editDescription").value = r.description;
    document.getElementById("editOwner").value = r.owner || "";

    document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
    document.getElementById("editModal").classList.add("hidden");
    editingId = null;
}

async function updateReport() {
    const r = reports.find(x => x.id === editingId);
    if (!r) return;

    const updatedData = {
        id: r.id,
        name: document.getElementById("editName").value,
        type: document.getElementById("editType").value,
        severity: document.getElementById("editSeverity").value,
        description: document.getElementById("editDescription").value,
        owner: document.getElementById("editOwner").value,
        user: r.user,
        timestamp: r.timestamp
    };

    try {
        await fetch(`${BASE_URL}/reports/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        closeEditModal();
        fetchReports();
    } catch (error) {
        console.error("Failed to update report:", error);
    }
}

function openDelete(id) {
    deleteId = id;
    document.getElementById("deleteModal").classList.remove("hidden");
}

function closeDeleteModal() {
    document.getElementById("deleteModal").classList.add("hidden");
    deleteId = null;
}

async function confirmDelete() {
    try {
        await fetch(`${BASE_URL}/reports/${deleteId}`, {
            method: 'DELETE'
        });

        closeDeleteModal();
        fetchReports();
    } catch (error) {
        console.error("Failed to delete report:", error);
    }
}

/////////////////////////////
// FILTERING & PAGINATION
/////////////////////////////
function changeReportsPerPage() {
    reportsPerPage = +document.getElementById("reportsPerPageSelect").value;
    localStorage.setItem("reportsPerPage", reportsPerPage);
    currentPage = 1;
    renderReports();
}

function nextPage() {
    if (currentPage < getTotalPages()) {
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
    const name = (document.getElementById("filterName")?.value || "").toLowerCase().trim();
    const type = (document.getElementById("filterType")?.value || "").toLowerCase().trim();
    const user = (document.getElementById("filterUser")?.value || "").toLowerCase().trim();
    const owner = (document.getElementById("filterOwner")?.value || "").toLowerCase().trim();
    const desc = (document.getElementById("filterDescription")?.value || "").toLowerCase().trim();
    const severity = document.getElementById("filterSeverity")?.value || "";

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
    return Math.max(1, Math.ceil(filtered.length / reportsPerPage));
}

function updatePaginationButtons(totalPages) {
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

/////////////////////////////
// RENDER TABLE
/////////////////////////////
function renderReports() {
    const tbody = document.getElementById("reportTable");
    if(!tbody) return;
    tbody.innerHTML = "";

    const filtered = getFilteredReports();
    const totalPages = getTotalPages();

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

    const pageInfo = document.getElementById("pageInfo");
    if(pageInfo) pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;
    updatePaginationButtons(totalPages);
}

/////////////////////////////
// PDF EXPORT
/////////////////////////////
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
        img.onerror = () => reject("Image could not be loaded: " + url);
        img.src = url;
    });
}

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
            const imgData = await loadImageAsDataURL(OWNER_IMAGES[r.owner]);
            doc.addImage(imgData, "PNG", 150, 30, 40, 40);
        } catch (error) {
            console.error("Failed to load owner image:", error);
        }
    }

    doc.text("Description:", 20, 110);
    doc.text(r.description || "-", 20, 120);
    doc.save(`report_${r.id}.pdf`);
}

/////////////////////////////
// AUTO LOGIN CHECK
/////////////////////////////
if (localStorage.getItem("loggedUser")) {
    showApp();
}