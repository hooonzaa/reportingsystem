const Severity = Object.freeze({
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High"
});

// ==========================================
// CLASSES
// ==========================================

class User {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    checkPassword(inputPassword) {
        return this.password === inputPassword;
    }
}

class Report {
    constructor(name, type, severity, description, user) {
        this.id = Date.now();
        this.name = name;
        this.type = type;
        this.severity = severity;
        this.description = description;
        this.timestamp = new Date().toISOString();
        this.user = user;
    }
}


class ReportManager {
    constructor() {
        this.reports = JSON.parse(localStorage.getItem("reports")) || [];
    }

    saveToStorage() {
        localStorage.setItem("reports", JSON.stringify(this.reports));
    }

    addReport(name, type, severity, description, user) {
        const newReport = new Report(name, type, severity, description, user);
        this.reports.push(newReport);
        this.saveToStorage();
        return newReport;
    }

    updateReport(id, updatedFields) {
        const index = this.reports.findIndex(r => r.id === id);
        if (index === -1) return false;

        // Merge existing properties with updated fields safely
        this.reports[index] = { ...this.reports[index], ...updatedFields };
        this.saveToStorage();
        return true;
    }

    deleteReport(id) {
        this.reports = this.reports.filter(r => r.id !== id);
        this.saveToStorage();
    }

    findReport(id) {
        return this.reports.find(r => r.id === id);
    }

    getFilteredReports(filters) {
        const { name, type, user, desc, severity } = filters;
        return this.reports.filter(r => {
            return (
                (!name || r.name.toLowerCase().includes(name)) &&
                (!type || r.type.toLowerCase().includes(type)) &&
                (!user || r.user.toLowerCase().includes(user)) &&
                (!desc || r.description.toLowerCase().includes(desc)) &&
                (!severity || r.severity === severity)
            );
        });
    }
}


const USERS = [
    new User("Eliáš", "Heslo1"),
    new User("Švarc", "Heslo2"),
    new User("Gras", "Heslo3")
];

const reportManager = new ReportManager();

let editingId = null;
let deleteId = null;
let currentPage = 1;
let reportsPerPage = parseInt(localStorage.getItem("reportsPerPage")) || 5;

// ==========================================
// AUTHENTICATION
// ==========================================

function login() {
    const u = document.getElementById("username");
    const p = document.getElementById("password");
    const err = document.getElementById("loginError");

    err.innerText = "";

    const user = USERS.find(x => x.username === u.value && x.checkPassword(p.value));

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
    renderReports();
}

// ==========================================
// OPERATIONS
// ==========================================

function saveReport() {
    reportManager.addReport(
        reportName.value,
        reportType.value,
        reportSeverity.value,
        reportDescription.value,
        currentUser().username
    );

    renderReports();
}

function updateReport() {
    const success = reportManager.updateReport(editingId, {
        name: editName.value,
        type: editType.value,
        severity: editSeverity.value,
        description: editDescription.value
    });

    if (success) {
        closeEditModal();
        renderReports();
    }
}

function confirmDelete() {
    reportManager.deleteReport(deleteId);
    closeDeleteModal();
    renderReports();
}

// ==========================================
// PAGINATION
// ==========================================

function changeReportsPerPage() {
    reportsPerPage = +reportsPerPageSelect.value;
    localStorage.setItem("reportsPerPage", reportsPerPage);
    currentPage = 1;
    renderReports();
}

function nextPage() { currentPage++; renderReports(); }
function prevPage() { currentPage--; renderReports(); }

function renderReports() {
    const tbody = document.getElementById("reportTable");
    tbody.innerHTML = "";

    const filters = {
        name: filterName.value.toLowerCase().trim(),
        type: filterType.value.toLowerCase().trim(),
        user: filterUser.value.toLowerCase().trim(),
        desc: filterDescription.value.toLowerCase().trim(),
        severity: filterSeverity.value
    };

    const filtered = reportManager.getFilteredReports(filters);
    const totalPages = Math.max(1, Math.ceil(filtered.length / reportsPerPage));

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
            <td class="actions">
                <button onclick="editReport(${r.id})">Edit</button>
                <button class="delete-btn" onclick="openDelete(${r.id})">Delete</button>
                <button class="pdf-btn" onclick="exportPDF(${r.id})">PDF</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;
}

// ==========================================
// MODALS & AUXILIARY
// ==========================================

function editReport(id) {
    const r = reportManager.findReport(id);
    if (!r) return;

    editingId = id;
    editName.value = r.name;
    editType.value = r.type;
    editSeverity.value = r.severity;
    editDescription.value = r.description;

    editModal.classList.remove("hidden");
}

function closeEditModal() {
    editModal.classList.add("hidden");
    editingId = null;
}

function openDelete(id) {
    deleteId = id;
    deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
    deleteModal.classList.add("hidden");
    deleteId = null;
}

async function exportPDF(id) {
    const r = reportManager.findReport(id);
    if (!r) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("REPORT", 20, 20);
    doc.text(`ID: ${r.id}`, 20, 40);
    doc.text(`Name: ${r.name}`, 20, 50);
    doc.text(`Type: ${r.type}`, 20, 60);
    doc.text(`Severity: ${r.severity}`, 20, 70);
    doc.text(`User: ${r.user}`, 20, 80);

    doc.save(`report_${r.id}.pdf`);
}

// AUTO LOGIN
if (localStorage.getItem("loggedUser")) {
    showApp();
}
