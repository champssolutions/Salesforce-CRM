document.addEventListener('DOMContentLoaded', () => {
    console.log('CRM App Initialized');

    // โหลดข้อมูลลงตารางทุกแท็บทันทีที่เปิดหน้า
    loadAccounts();
    loadContacts();
    loadProducts();
    loadDeals();

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
                case '#accounts': loadAccounts(); break;
                case '#contacts': loadContacts(); break;
                case '#products': loadProducts(); break;
                case '#deals': loadDeals(); break;
            }
        });
    });
});

// Helper Function ป้องกันค่า null / undefined
const fmt = (val) => (val === null || val === undefined || val === '') ? '-' : val;

// ==================== LOAD FUNCTIONS ====================

async function loadAccounts() {
    try {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
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

async function loadContacts() {
    try {
        const res = await fetch('/api/contacts');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
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

async function loadDeals() {
    try {
        const res = await fetch('/api/deals');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        const tbody = document.getElementById('dealsTable');
        if (!tbody) return;
        tbody.innerHTML = items.map(d => `
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
    } catch (e) { console.error('Error loadDeals:', e); }
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
            loadAccounts();
            const modalEl = document.getElementById('addAccountModal');
            if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
            document.getElementById('addAccountForm')?.reset();
        } else { alert('Failed to add account'); }
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
            loadContacts();
            const modalEl = document.getElementById('addContactModal');
            if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
            document.getElementById('addContactForm')?.reset();
        } else { alert('Failed to add contact'); }
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
            loadProducts();
            const modalEl = document.getElementById('addProductModal');
            if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
            document.getElementById('addProductForm')?.reset();
        } else { alert('Failed to add product'); }
    } catch (e) { console.error(e); }
};

window.addDeal = async function() {
    try {
        const body = {
            title: document.getElementById('dealTitle')?.value || '',
            amount: document.getElementById('dealAmount')?.value || 0,
            stage: document.getElementById('dealStage')?.value || 'Prospecting',
            close_date: document.getElementById('dealCloseDate')?.value || null
        };
        const res = await fetch('/api/deals', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if (res.ok) {
            loadDeals();
            const modalEl = document.getElementById('addDealModal');
            if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
            document.getElementById('addDealForm')?.reset();
        } else { alert('Failed to add deal'); }
    } catch (e) { console.error(e); }
};

// ==================== DELETE FUNCTIONS ====================

window.deleteAccount = async function(id) { if (confirm('Delete Account?')) { await fetch(`/api/accounts/${id}`, { method: 'DELETE' }); loadAccounts(); } };
window.deleteContact = async function(id) { if (confirm('Delete Contact?')) { await fetch(`/api/contacts/${id}`, { method: 'DELETE' }); loadContacts(); } };
window.deleteProduct = async function(id) { if (confirm('Delete Product?')) { await fetch(`/api/products/${id}`, { method: 'DELETE' }); loadProducts(); } };
window.deleteDeal = async function(id) { if (confirm('Delete Deal?')) { await fetch(`/api/deals/${id}`, { method: 'DELETE' }); loadDeals(); } };