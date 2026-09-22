document.addEventListener('DOMContentLoaded', () => {
    console.log('CRM App Initialized');

    // Load data for all tabs
    loadAccounts();
    loadLeads();
    loadContacts();
    loadCases();
    loadTasks();
    loadProducts();
    loadDeals();
    loadQuotes();
    renderDashboardCharts(); // Initialize charts

    // จัดการ Event สลับแท็บเมนู
    const tabButtons = document.querySelectorAll('#myTab button[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const tabPanes = document.querySelectorAll('.tab-pane');
            tabPanes.forEach(pane => pane.classList.remove('show', 'active'));

            const targetId = button.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetId);
            if (targetPane) {
                targetPane.classList.add('show', 'active');
            }

            switch (targetId) {
                case '#dashboard': 
                    loadDeals();
                    renderDashboardCharts(); // Re-render charts when dashboard tab is clicked
                    break;
                case '#accounts': loadAccounts(); break;
                case '#leads': loadLeads(); break;
                case '#contacts': loadContacts(); break;
                case '#cases': loadCases(); break;
                case '#tasks': loadTasks(); break;
                case '#products': loadProducts(); break;
                case '#deals': loadDeals(); break;
                case '#quotes': loadQuotes(); break;
            }
        });
    });
});

// Helper Function ป้องกันค่า null / undefined
const fmt = (val) => (val === null || val === undefined || val === '') ? '-' : val;

// Notification Helpers ( SweetAlert2 หรือ Fallback Alert )
const toastSuccess = (msg) => typeof Swal !== 'undefined' ? Swal.fire({ icon: 'success', title: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 }) : alert(msg);
const toastError = (msg) => typeof Swal !== 'undefined' ? Swal.fire({ icon: 'error', title: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 }) : alert(msg);

async function confirmDeleteMsg() {
    if (typeof Swal !== 'undefined') {
        const res = await Swal.fire({ title: 'คุณต้องการลบข้อมูลนี้ใช่หรือไม่?', icon: 'warning', showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#dc3545' });
        return res.isConfirmed;
    }
    return confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?');
}

function hideModalAndReset(modalId, formId) {
    const modalEl = document.getElementById(modalId);
    if (modalEl && typeof bootstrap !== 'undefined') {
        const instance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        instance?.hide();
    }
    document.getElementById(formId)?.reset();
}

// ==================== LOAD FUNCTIONS ====================

async function loadAccounts() {
    try {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        populateSelect('dealAccount', items, 'id', 'name', '-- เลือก Account --');
        populateSelect('caseAccount', items, 'id', 'name', '-- เลือก Account --');
        populateSelect('dealFilterAccount', items, 'id', 'name', 'ทั้งหมด');
        populateSelect('quoteAccount', items, 'id', 'name', '-- เลือก Account --');

        const tbody = document.getElementById('accountsTable');
        if (!tbody) return;
        tbody.innerHTML = items.map(a => `
            <tr>
                <td>${fmt(a.id)}</td>
                <td>${fmt(a.name)}</td>
                <td>${fmt(a.industry)}</td>
                <td>${fmt(a.phone)}</td>
                <td>${fmt(a.website)}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteAccount(${a.id})">Delete</button></td>
            </tr>
        `).join('');
    } catch (e) { console.error('Error loadAccounts:', e); }
}

async function loadLeads() {
    try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        const tbody = document.getElementById('leadsTable');
        if (!tbody) return;
        tbody.innerHTML = items.map(l => `
            <tr>
                <td>${fmt(l.id)}</td>
                <td>${fmt(l.first_name)}</td>
                <td>${fmt(l.last_name)}</td>
                <td>${fmt(l.company)}</td>
                <td>${l.status === 'Converted' ? '<span class="badge bg-success">Converted</span>' : `<span class="badge bg-secondary">${fmt(l.status)}</span>`}</td>
                <td>${fmt(l.email)}</td>
                <td>${fmt(l.phone)}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="convertLead(${l.id})" ${l.status === 'Converted' ? 'disabled' : ''}>Convert</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteLead(${l.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error('Error loadLeads:', e); }
}

async function loadContacts() {
    try {
        const res = await fetch('/api/contacts');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        const formatName = c => `${fmt(c.first_name)} ${fmt(c.last_name)}`.trim();
        populateSelect('dealContact', items, 'id', formatName, '-- เลือก Contact --');
        populateSelect('caseContact', items, 'id', formatName, '-- เลือก Contact --');
        populateSelect('taskContact', items, 'id', formatName, '-- เลือก Contact --');

        const tbody = document.getElementById('contactsTable');
        if (!tbody) return;
        tbody.innerHTML = items.map(c => `
            <tr>
                <td>${fmt(c.id)}</td>
                <td>${fmt(c.first_name)}</td>
                <td>${fmt(c.last_name)}</td>
                <td>${fmt(c.email)}</td>
                <td>${fmt(c.phone)}</td>
                <td>${fmt(c.title)}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteContact(${c.id})">Delete</button></td>
            </tr>
        `).join('');
    } catch (e) { console.error('Error loadContacts:', e); }
}

async function loadCases() {
    try {
        const res = await fetch('/api/cases');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        const tbody = document.getElementById('casesTable');
        if (!tbody) return;
        tbody.innerHTML = items.map(c => {
            const priorityBadge = c.priority === 'High' ? 'danger' : (c.priority === 'Medium' ? 'warning' : 'secondary');
            const statusBadge = c.status === 'New' ? 'primary' : (c.status === 'Working' ? 'info' : 'success');
            return `
            <tr>
                <td>${fmt(c.id)}</td>
                <td>${fmt(c.subject || c.title)}</td>
                <td>${fmt(c.account_id)}</td>
                <td>${fmt(c.contact_id)}</td>
                <td><span class="badge bg-${priorityBadge}">${fmt(c.priority || 'Medium')}</span></td>
                <td><span class="badge bg-${statusBadge}">${fmt(c.status || 'New')}</span></td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteCase(${c.id})">Delete</button></td>
            </tr>
        `}).join('');
    } catch (e) { console.error('Error loadCases:', e); }
}

async function loadTasks() {
    try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        const tbody = document.getElementById('tasksTable');
        if (!tbody) return;
        tbody.innerHTML = items.map(t => {
            const priorityBadge = t.priority === 'High' ? 'danger' : (t.priority === 'Medium' ? 'warning' : 'secondary');
            const statusBadge = t.status === 'Not Started' ? 'secondary' : (t.status === 'In Progress' ? 'info' : 'success');
            const related = [t.deal_id ? `Deal #${t.deal_id}` : '', t.contact_id ? `Contact #${t.contact_id}` : ''].filter(Boolean).join(' / ');
            return `
            <tr>
                <td>${fmt(t.id)}</td>
                <td>${fmt(t.title)}</td>
                <td>${fmt(t.due_date)}</td>
                <td><span class="badge bg-${statusBadge}">${fmt(t.status || 'Not Started')}</span></td>
                <td><span class="badge bg-${priorityBadge}">${fmt(t.priority || 'Medium')}</span></td>
                <td>${fmt(related)}</td>
                <td>
                    ${t.status !== 'Completed' ? `<button class="btn btn-success btn-sm" onclick="completeTask(${t.id})">Complete</button>` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteTask(${t.id})">Delete</button>
                </td>
            </tr>
        `}).join('');
    } catch (e) { console.error('Error loadTasks:', e); }
}

async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        const tbody = document.getElementById('productsTable');
        if (!tbody) return;
        tbody.innerHTML = items.map(p => `
            <tr>
                <td>${fmt(p.id)}</td>
                <td>${fmt(p.name)}</td>
                <td>${fmt(p.code)}</td>
                <td>${fmt(p.price)}</td>
                <td>${fmt(p.description)}</td>
                <td>${p.is_active ? 'Yes' : 'No'}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Delete</button></td>
            </tr>
        `).join('');
    } catch (e) { console.error('Error loadProducts:', e); }
}

let dealsChartInstance = null;
let casesChartInstance = null;

async function renderDashboardCharts() {
    try {
        // Only render if on dashboard tab
        const dashboardTab = document.getElementById('dashboard');
        if (!dashboardTab || !dashboardTab.classList.contains('active')) return;

        // Destroy existing charts if they exist
        if (dealsChartInstance) {
            dealsChartInstance.destroy();
            dealsChartInstance = null;
        }
        if (casesChartInstance) {
            casesChartInstance.destroy();
            casesChartInstance = null;
        }

        // Get chart data
        const res = await fetch('/api/analytics/dashboard');
        const data = await res.json();
        console.log("Dashboard API Response:", data);

        // Update Quick Stats
        if (data.quickStats) {
            document.getElementById('statTotalAmount').textContent = 
                data.quickStats.totalPipelineValue?.toLocaleString() || '0';
            document.getElementById('statDealCount').textContent = 
                data.quickStats.openDeals || '0';
            document.getElementById('statWinRate').textContent = 
                data.quickStats.winRate ? `${data.quickStats.winRate}%` : '0%';
        }

        // Render Deals Chart
        const dealsCanvas = document.getElementById('dealsChart');
        if (!dealsCanvas) {
            console.warn('Deals chart canvas not found');
            return;
        }
        
        const dealsCtx = dealsCanvas?.getContext('2d');
        if (!dealsCtx) {
            console.warn('Could not get 2D context for deals chart');
            return;
        }
        // Ensure we have data for all stages
        const allDealStages = ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'];
        const dealsLabels = allDealStages;
        const dealsData = allDealStages.map(stage => data.dealsByStage[stage] || 0);
        
        if (dealsChartInstance) {
            dealsChartInstance.destroy();
        }
        dealsChartInstance = new Chart(dealsCtx, {
            type: 'bar',
            data: {
                labels: dealsLabels,
                datasets: [{
                    label: 'Total Amount',
                    data: dealsData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Total Amount'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Deal Stage'
                        }
                    }
                }
            }
        });

        // Render Cases Chart
        const casesCanvas = document.getElementById('casesChart');
        if (!casesCanvas) return;
        
        const casesCtx = casesCanvas.getContext('2d');
        // Ensure we have data for all statuses
        const allCaseStatuses = ['New', 'Working', 'Closed'];
        const casesLabels = allCaseStatuses;
        const casesData = allCaseStatuses.map(status => data.casesByStatus[status] || 0);
        
        if (casesChartInstance) {
            casesChartInstance.destroy();
        }
        casesChartInstance = new Chart(casesCtx, {
            type: 'doughnut',
            data: {
                labels: casesLabels,
                datasets: [{
                    label: 'Cases by Status',
                    data: casesData,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                        'rgba(255, 159, 64, 0.5)'
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering dashboard charts:', error);
    }
}

async function loadDeals() {
    try {
        const res = await fetch('/api/deals');
        const data = await res.json();
        dealsCache = Array.isArray(data) ? data : (data.data || []);
        populateSelect('taskDeal', dealsCache, 'id', 'title', '-- เลือก Deal --');
        populateSelect('quoteDeal', dealsCache, 'id', 'title', '-- เลือก Deal --');
        renderDeals();
        renderDashboardCharts(); // Use the unified chart rendering function
    } catch (e) { console.error('Error loadDeals:', e); }
}


function populateSelect(elementId, items, valueKey, labelKey, defaultText) {
    const sel = document.getElementById(elementId);
    if (!sel) return;
    const current = sel.value;
    const options = (items || []).map(item => {
        const val = item[valueKey];
        const label = typeof labelKey === 'function' ? labelKey(item) : item[labelKey];
        return `<option value="${val}">${fmt(label)}</option>`;
    });
    sel.innerHTML = `<option value="">${defaultText}</option>` + options.join('');
    if (current) sel.value = current;
}

// ==================== ADD FUNCTIONS (Export to Global) ====================

window.addAccount = async function() {
    try {
        const body = {
            name: document.getElementById('accountName')?.value || '',
            industry: document.getElementById('accountIndustry')?.value || '',
            phone: document.getElementById('accountPhone')?.value || '',
            website: document.getElementById('accountWebsite')?.value || ''
        };
        const res = await fetch('/api/accounts', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if (res.ok) {
            toastSuccess('เพิ่ม Account สำเร็จ');
            loadAccounts();
            hideModalAndReset('addAccountModal', 'addAccountForm');
        } else { toastError('Failed to add account'); }
    } catch (e) { console.error(e); }
};

window.addLead = async function() {
    try {
        const body = {
            first_name: document.getElementById('leadFirstName')?.value || '',
            last_name: document.getElementById('leadLastName')?.value || '',
            company: document.getElementById('leadCompany')?.value || '',
            email: document.getElementById('leadEmail')?.value || '',
            phone: document.getElementById('leadPhone')?.value || '',
            status: document.getElementById('leadStatus')?.value || 'New'
        };
        const res = await fetch('/api/leads', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if (res.ok) {
            toastSuccess('เพิ่ม Lead สำเร็จ');
            loadLeads();
            hideModalAndReset('addLeadModal', 'addLeadForm');
        } else { toastError('Failed to add lead'); }
    } catch (e) { console.error(e); }
};

window.addContact = async function() {
    try {
        const body = {
            first_name: document.getElementById('contactFirstName')?.value || '',
            last_name: document.getElementById('contactLastName')?.value || '',
            email: document.getElementById('contactEmail')?.value || '',
            phone: document.getElementById('contactPhone')?.value || '',
            title: document.getElementById('contactTitle')?.value || ''
        };
        const res = await fetch('/api/contacts', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if (res.ok) {
            toastSuccess('เพิ่ม Contact สำเร็จ');
            loadContacts();
            hideModalAndReset('addContactModal', 'addContactForm');
        } else { toastError('Failed to add contact'); }
    } catch (e) { console.error(e); }
};

window.addCase = async function() {
    try {
        const subjectVal = document.getElementById('caseSubject')?.value || document.getElementById('caseTitle')?.value || '';
        const body = {
            subject: subjectVal,
            title: subjectVal,
            account_id: document.getElementById('caseAccount')?.value || null,
            contact_id: document.getElementById('caseContact')?.value || null,
            description: document.getElementById('caseDescription')?.value || '',
            priority: document.getElementById('casePriority')?.value || 'Medium',
            status: document.getElementById('caseStatus')?.value || 'New'
        };
        const res = await fetch('/api/cases', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if (res.ok) {
            toastSuccess('เพิ่ม Case สำเร็จ');
            loadCases();
            hideModalAndReset('addCaseModal', 'addCaseForm');
        } else { toastError('Failed to add case'); }
    } catch (e) { console.error(e); }
};

window.addTask = async function() {
    try {
        const titleVal = document.getElementById('taskTitle')?.value || '';
        const body = {
            title: titleVal,
            description: document.getElementById('taskDescription')?.value || titleVal,
            due_date: document.getElementById('taskDueDate')?.value || null,
            status: document.getElementById('taskStatus')?.value || 'Not Started',
            priority: document.getElementById('taskPriority')?.value || 'Medium',
            deal_id: document.getElementById('taskDeal')?.value || null,
            contact_id: document.getElementById('taskContact')?.value || null
        };
        const res = await fetch('/api/tasks', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if (res.ok) {
            toastSuccess('เพิ่ม Task สำเร็จ');
            loadTasks();
            hideModalAndReset('addTaskModal', 'addTaskForm');
        } else { toastError('Failed to add task'); }
    } catch (e) { console.error(e); }
};

window.addProduct = async function() {
    try {
        const body = {
            name: document.getElementById('productName')?.value || '',
            code: document.getElementById('productCode')?.value || '',
            price: document.getElementById('productPrice')?.value || '',
            description: document.getElementById('productDescription')?.value || '',
            is_active: document.getElementById('productIsActive')?.value === 'true'
        };
        const res = await fetch('/api/products', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if (res.ok) {
            toastSuccess('เพิ่ม Product สำเร็จ');
            loadProducts();
            hideModalAndReset('addProductModal', 'addProductForm');
        } else { toastError('Failed to add product'); }
    } catch (e) { console.error(e); }
};

window.addDeal = async function() {
    try {
        const body = {
            title: document.getElementById('dealTitle')?.value || '',
            amount: document.getElementById('dealAmount')?.value || 0,
            stage: document.getElementById('dealStage')?.value || 'Prospecting',
            account_id: document.getElementById('dealAccount')?.value || null,
            contact_id: document.getElementById('dealContact')?.value || null,
            close_date: document.getElementById('dealCloseDate')?.value || null
        };
        const res = await fetch('/api/deals', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if (res.ok) {
            toastSuccess('เพิ่ม Deal สำเร็จ');
            loadDeals();
            hideModalAndReset('addDealModal', 'addDealForm');
        } else { toastError('Failed to add deal'); }
    } catch (e) { console.error(e); }
};

window.completeTask = async function(id) {
    try {
        const res = await fetch(`/api/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Completed' }) });
        if (res.ok) { toastSuccess('Task completed'); loadTasks(); }
    } catch (e) { console.error(e); }
};

window.convertLead = async function(id) {
    if (await confirmDeleteMsg()) {
        const res = await fetch(`/api/leads/${id}/convert`, { method: 'POST' });
        if (res.ok) { toastSuccess('แปลงข้อมูลสำเร็จ'); loadLeads(); }
    }
};

// ==================== DELETE FUNCTIONS ====================

window.deleteAccount = async function(id) { if (await confirmDeleteMsg()) { await fetch(`/api/accounts/${id}`, { method: 'DELETE' }); loadAccounts(); } };
window.deleteLead = async function(id) { if (await confirmDeleteMsg()) { await fetch(`/api/leads/${id}`, { method: 'DELETE' }); loadLeads(); } };
window.deleteContact = async function(id) { if (await confirmDeleteMsg()) { await fetch(`/api/contacts/${id}`, { method: 'DELETE' }); loadContacts(); } };
window.deleteCase = async function(id) { if (await confirmDeleteMsg()) { await fetch(`/api/cases/${id}`, { method: 'DELETE' }); loadCases(); } };
window.deleteTask = async function(id) { if (await confirmDeleteMsg()) { await fetch(`/api/tasks/${id}`, { method: 'DELETE' }); loadTasks(); } };
window.deleteProduct = async function(id) { if (await confirmDeleteMsg()) { await fetch(`/api/products/${id}`, { method: 'DELETE' }); loadProducts(); } };
window.deleteDeal = async function(id) { if (await confirmDeleteMsg()) { await fetch(`/api/deals/${id}`, { method: 'DELETE' }); loadDeals(); } };

// ==================== QUOTE FUNCTIONS ====================

async function loadQuotes() {
    try {
        const res = await fetch('/api/quotes');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        
        const tbody = document.getElementById('quotesTable');
        if (!tbody) return;
        
        tbody.innerHTML = items.map(q => {
            const statusClass = q.status === 'Draft' ? 'secondary' : 
                              q.status === 'Sent' ? 'info' : 
                              q.status === 'Accepted' ? 'success' : 
                              q.status === 'Rejected' ? 'danger' : 'secondary';
            return `
            <tr>
                <td>${fmt(q.id)}</td>
                <td>${fmt(q.quote_number)}</td>
                <td>${fmt(q.deal_title)}</td>
                <td>${fmt(q.total_amount)}</td>
                <td><span class="badge bg-${statusClass}">${fmt(q.status || 'Draft')}</span></td>
                <td>${fmt(q.expiration_date)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteQuote(${q.id})">Delete</button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (e) { 
        console.error('Error loading quotes:', e);
        toastError('Failed to load quotes');
    }
}

window.addQuote = async function() {
    try {
        const quoteNumber = document.getElementById('quoteNumber')?.value;
        const dealId = document.getElementById('quoteDeal')?.value;
        const totalAmount = document.getElementById('quoteAmount')?.value;
        const status = document.getElementById('quoteStatus')?.value;
        const expirationDate = document.getElementById('quoteExpiration')?.value;

        if (!quoteNumber || !dealId || !totalAmount || !status) {
            toastError('Please fill all required fields');
            return;
        }

        const payload = {
            quote_number: quoteNumber,
            deal_id: dealId,
            total_amount: totalAmount,
            status: status || 'Draft',  // Default to Draft if no status provided
            expiration_date: expirationDate || null
        };

        const res = await fetch('/api/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            toastSuccess('Quote created successfully');
            loadQuotes();
            hideModalAndReset('addQuoteModal', 'addQuoteForm');
        } else {
            const error = await res.json();
            toastError(error.error || 'Failed to create quote');
        }
    } catch (e) {
        console.error('Error creating quote:', e);
        toastError('Failed to create quote');
    }
};

window.deleteQuote = async function(id) { 
    if (await confirmDeleteMsg()) { 
        try {
            const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toastSuccess('Quote deleted successfully');
                loadQuotes();
            } else {
                toastError('Failed to delete quote');
            }
        } catch (e) {
            console.error('Error deleting quote:', e);
            toastError('Failed to delete quote');
        }
    } 
};

// Initialize quote functionality when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load quotes along with other data
    loadQuotes();
    
    // Populate deal dropdown in quote modal
    document.getElementById('addQuoteModal')?.addEventListener('show.bs.modal', async () => {
        try {
            const res = await fetch('/api/deals');
            const data = await res.json();
            const deals = Array.isArray(data) ? data : (data.data || []);
            const select = document.getElementById('quoteDeal');
            if (select) {
                select.innerHTML = '<option value="">-- Select Deal --</option>' + 
                    deals.map(d => `<option value="${d.id}">${d.title} (${d.amount})</option>`).join('');
            }
        } catch (e) {
            console.error('Error loading deals for quote modal:', e);
        }
    });
});

// ==================== KANBAN & PIPELINE ====================

const DEAL_STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'];
let dealsView = 'table';
let dealsCache = [];
let draggedDealId = null;
let dealsFilter = { account: '', from: '', to: '' };

window.setDealsView = function(view) {
    dealsView = view;
    document.getElementById('dealsTableView')?.classList.toggle('d-none', view !== 'table');
    document.getElementById('dealsKanbanView')?.classList.toggle('d-none', view !== 'kanban');
    document.getElementById('dealsTableViewBtn')?.classList.toggle('active', view === 'table');
    document.getElementById('dealsKanbanViewBtn')?.classList.toggle('active', view === 'kanban');
    if (view === 'kanban') renderKanban(filteredDeals());
};

function updateDealsAnalytics(deals) {
    const list = Array.isArray(deals) ? deals : [];
    const total = list.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const won = list.filter(d => d.stage === 'Closed Won').length;
    const winRate = list.length ? (won / list.length) * 100 : 0;
    const statTotal = document.getElementById('statTotalAmount');
    const statWin = document.getElementById('statWinRate');
    const statCount = document.getElementById('statDealCount');
    if (statTotal) statTotal.textContent = total.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (statWin) statWin.textContent = winRate.toFixed(1) + '%';
    if (statCount) statCount.textContent = list.length;
}

function filteredDeals() {
    return dealsCache.filter(d => {
        if (dealsFilter.account !== '' && String(d.account_id) !== String(dealsFilter.account)) return false;
        if (dealsFilter.from && (!d.close_date || String(d.close_date).slice(0, 10) < dealsFilter.from)) return false;
        if (dealsFilter.to && (!d.close_date || String(d.close_date).slice(0, 10) > dealsFilter.to)) return false;
        return true;
    });
}

window.applyDealFilters = function() {
    dealsFilter.account = document.getElementById('dealFilterAccount')?.value || '';
    dealsFilter.from = document.getElementById('dealFilterFrom')?.value || '';
    dealsFilter.to = document.getElementById('dealFilterTo')?.value || '';
    renderDeals();
};

window.resetDealFilters = function() {
    if (document.getElementById('dealFilterAccount')) document.getElementById('dealFilterAccount').value = '';
    if (document.getElementById('dealFilterFrom')) document.getElementById('dealFilterFrom').value = '';
    if (document.getElementById('dealFilterTo')) document.getElementById('dealFilterTo').value = '';
    window.applyDealFilters();
};

function renderDeals() {
    const list = filteredDeals();
    updateDealsAnalytics(list);
    if (dealsView === 'kanban') renderKanban(list);
    const tbody = document.getElementById('dealsTable');
    if (!tbody) return;
    tbody.innerHTML = list.map(d => `
        <tr>
            <td>${fmt(d.id)}</td>
            <td>${fmt(d.title)}</td>
            <td>${fmt(d.amount)}</td>
            <td>${fmt(d.stage)}</td>
            <td>${fmt(d.account_id)}</td>
            <td>${fmt(d.contact_id)}</td>
            <td>${fmt(d.close_date)}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteDeal(${d.id})">Delete</button></td>
        </tr>
    `).join('');
}

function renderKanban(deals) {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;
    const list = Array.isArray(deals) ? deals : [];
    board.innerHTML = DEAL_STAGES.map(stage => {
        const items = list.filter(d => d.stage === stage);
        const sum = items.reduce((s, d) => s + (Number(d.amount) || 0), 0);
        const cards = items.map(kanbanCard).join('') || '<div class="text-muted small px-1">—</div>';
        return `
            <div class="kanban-col" data-stage="${stage}" ondragover="onKanbanDragOver(event)" ondragleave="onKanbanDragLeave(event)" ondrop="onKanbanDrop(event, '${stage}')">
                <div class="kanban-col-header"><span>${stage}</span><span class="badge bg-dark">${items.length}</span></div>
                <div class="kanban-col-body">${cards}</div>
                <div class="text-muted small mt-2">รวม: ${sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>`;
    }).join('');
}

function kanbanCard(d) {
    const amount = (d.amount === null || d.amount === undefined) ? '-' : Number(d.amount).toLocaleString(undefined, { maximumFractionDigits: 2 });
    const options = DEAL_STAGES.map(s => `<option value="${s}"${s === d.stage ? ' selected' : ''}>${s}</option>`).join('');
    return `
        <div class="kanban-card" draggable="true" data-deal-id="${d.id}" ondragstart="onKanbanDragStart(event, ${d.id})" ondragend="onKanbanDragEnd(event)">
            <div class="fw-semibold">${fmt(d.title)}</div>
            <div class="deal-amount">${amount}</div>
            <div class="text-muted small">#${d.id} • ปิด: ${fmt(d.close_date)}</div>
            <select class="form-select form-select-sm kanban-stage-select mt-2" onchange="changeDealStage(${d.id}, this.value)">${options}</select>
        </div>`;
}

window.onKanbanDragStart = function(e, id) { draggedDealId = id; e.currentTarget.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(id)); };
window.onKanbanDragEnd = function(e) { e.currentTarget.classList.remove('dragging'); document.querySelectorAll('.kanban-col.drag-over').forEach(el => el.classList.remove('drag-over')); };
window.onKanbanDragOver = function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('drag-over'); };
window.onKanbanDragLeave = function(e) { e.currentTarget.classList.remove('drag-over'); };
window.onKanbanDrop = async function(e, stage) {
    e.preventDefault(); e.currentTarget.classList.remove('drag-over');
    let id = draggedDealId || Number(e.dataTransfer.getData('text/plain'));
    draggedDealId = null;
    if (id) await window.changeDealStage(id, stage);
};

window.changeDealStage = async function(id, stage) {
    if (!DEAL_STAGES.includes(stage)) return;
    try {
        await fetch(`/api/deals/${id}/stage`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }) });
    } catch (e) {}
    loadDeals();
};

window.exportPipeline = function() {
    const list = filteredDeals();
    if (!list.length) { toastError('ไม่มีข้อมูลสำหรับ export'); return; }
    const headers = ['ID', 'Title', 'Amount', 'Stage', 'Account ID', 'Contact ID', 'Close Date'];
    const esc = (v) => '"' + ((v === null || v === undefined) ? '' : String(v)).replace(/"/g, '""') + '"';
    const rows = list.map(d => [d.id, d.title, d.amount, d.stage, d.account_id, d.contact_id, d.close_date].map(esc).join(','));
    const csv = [headers.map(esc).join(',')].concat(rows).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deals-pipeline-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastSuccess('Export pipeline สำเร็จ');
};
