let reports =
    JSON.parse(localStorage.getItem("reports")) || [];

let editingId = null;

let currentPage = 1;

const reportsPerPage = 5;

function currentUser(){

    return JSON.parse(
        localStorage.getItem("loggedUser")
    );
}

function login(){

    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;

    if(!username || !password){

        alert("Fill all fields");
        return;
    }

    localStorage.setItem(
        "loggedUser",
        JSON.stringify({ username })
    );

    showApp();
}

function logout(){

    localStorage.removeItem("loggedUser");

    location.reload();
}

function showApp(){

    document.getElementById("loginSection")
        .classList.add("hidden");

    document.getElementById("appSection")
        .classList.remove("hidden");

    renderReports();
}

function saveReport(){

    const name =
        document.getElementById("reportName").value;

    const type =
        document.getElementById("reportType").value;

    const severity =
        document.getElementById("reportSeverity").value;

    const description =
        document.getElementById("reportDescription").value;

    if(!name || !type || !severity){

        alert("Please fill required fields");
        return;
    }

    const report = {

        id: Date.now(),

        name,

        type,

        severity,

        description,

        timestamp: new Date().toISOString(),

        user: currentUser().username
    };

    reports.push(report);

    localStorage.setItem(
        "reports",
        JSON.stringify(reports)
    );

    clearForm();

    renderReports();
}

function clearForm(){

    document.getElementById("reportName").value = "";
    document.getElementById("reportType").value = "";
    document.getElementById("reportSeverity").value = "";
    document.getElementById("reportDescription").value = "";
}

function renderReports(){

    const tbody =
        document.getElementById("reportTable");

    tbody.innerHTML = "";

    const filterName =
        document.getElementById("filterName")
        .value.toLowerCase();

    const filterType =
        document.getElementById("filterType")
        .value.toLowerCase();

    const filterSeverity =
        document.getElementById("filterSeverity")
        .value;

    const filterFrom =
        document.getElementById("filterFrom")
        .value;

    const filterTo =
        document.getElementById("filterTo")
        .value;

    const globalFilter =
        document.getElementById("globalFilter")
        .value;

    let filtered = reports.filter(r => {

        const matchName =
            r.name.toLowerCase()
            .includes(filterName);

        const matchType =
            r.type.toLowerCase()
            .includes(filterType);

        const matchSeverity =
            !filterSeverity ||
            r.severity === filterSeverity;

        const reportDate =
            new Date(r.timestamp);

        const matchFrom =
            !filterFrom ||
            reportDate >= new Date(filterFrom);

        const matchTo =
            !filterTo ||
            reportDate <= new Date(filterTo + "T23:59:59");

        const matchUser =
            globalFilter === "all" ||
            r.user === currentUser().username;

        return (
            matchName &&
            matchType &&
            matchSeverity &&
            matchFrom &&
            matchTo &&
            matchUser
        );
    });

    const totalPages =
        Math.ceil(filtered.length / reportsPerPage);

    if(currentPage > totalPages){
        currentPage = totalPages || 1;
    }

    const start =
        (currentPage - 1) * reportsPerPage;

    const end =
        start + reportsPerPage;

    const paginatedReports =
        filtered.slice(start, end);

    paginatedReports.forEach(r => {

        const tr = document.createElement("tr");

        tr.innerHTML = `

            <td>${r.id}</td>

            <td>${r.name}</td>

            <td>${r.type}</td>

            <td>
                <span class="badge ${r.severity.toLowerCase()}">
                    ${r.severity}
                </span>
            </td>

            <td>
                ${new Date(r.timestamp).toLocaleString()}
            </td>

            <td>${r.description}</td>

            <td>${r.user}</td>

            <td class="actions">

                <button onclick="editReport(${r.id})">
                    Edit
                </button>

                <button class="delete-btn"
                    onclick="deleteReport(${r.id})">

                    Delete

                </button>

                <button onclick="exportPDF(${r.id})">
                    PDF
                </button>

            </td>
        `;

        tbody.appendChild(tr);
    });

    document.getElementById("pageInfo")
        .innerText =
        `Page ${currentPage} of ${totalPages || 1}`;
}

function editReport(id){

    const report =
        reports.find(r => r.id === id);

    if(!report) return;

    editingId = id;

    document.getElementById("editName").value =
        report.name;

    document.getElementById("editType").value =
        report.type;

    document.getElementById("editSeverity").value =
        report.severity;

    document.getElementById("editDescription").value =
        report.description;

    document.getElementById("editModal")
        .classList.remove("hidden");
}

function closeModal(){

    document.getElementById("editModal")
        .classList.add("hidden");

    editingId = null;
}

function updateReport(){

    const name =
        document.getElementById("editName").value;

    const type =
        document.getElementById("editType").value;

    const severity =
        document.getElementById("editSeverity").value;

    const description =
        document.getElementById("editDescription").value;

    const index =
        reports.findIndex(r => r.id === editingId);

    if(index === -1) return;

    reports[index] = {

        ...reports[index],

        name,

        type,

        severity,

        description
    };

    localStorage.setItem(
        "reports",
        JSON.stringify(reports)
    );

    closeModal();

    renderReports();
}

function deleteReport(id){

    editingId = id;

    document.getElementById("deleteModal")
        .classList.remove("hidden");
}

function confirmDelete(){

    reports = reports.filter(
        r => r.id !== editingId
    );

    localStorage.setItem(
        "reports",
        JSON.stringify(reports)
    );

    document.getElementById("deleteModal")
        .classList.add("hidden");

    editingId = null;

    renderReports();
}

function closeDeleteModal(){

    document.getElementById("deleteModal")
        .classList.add("hidden");

    editingId = null;
}

async function exportPDF(id){

    const report =
        reports.find(r => r.id === id);

    if(!report) return;

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    doc.setFontSize(22);

    doc.text("CUSTOM REPORT", 20, 20);

    doc.setFontSize(12);

    doc.text(`ID: ${report.id}`, 20, 40);
    doc.text(`Name: ${report.name}`, 20, 50);
    doc.text(`Type: ${report.type}`, 20, 60);
    doc.text(`Severity: ${report.severity}`, 20, 70);
    doc.text(`Timestamp: ${report.timestamp}`, 20, 80);
    doc.text(`User: ${report.user}`, 20, 90);

    doc.text("Description:", 20, 110);

    doc.text(report.description || "-", 20, 120);

    doc.save(`report_${report.id}.pdf`);
}

function nextPage(){

    const totalPages =
        Math.ceil(reports.length / reportsPerPage);

    if(currentPage < totalPages){

        currentPage++;

        renderReports();
    }
}

function prevPage(){

    if(currentPage > 1){

        currentPage--;

        renderReports();
    }
}

if(localStorage.getItem("loggedUser")){
    showApp();
}
