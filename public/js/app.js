// app.js - ใช้จัดการฟังก์ชันเสริมหรือล้างค่าที่อาจก่อให้เกิดปัญหาการแสดงผลซ้ำซ้อน
// หมายเหตุ: ฟังก์ชันหลักส่วนใหญ่ถูกเขียนไว้ใน index.html แล้วเพื่อความรวดเร็วในการพัฒนา
// ในโปรเจกต์นี้ app.js จะทำหน้าที่ตรวจสอบความเรียบร้อยของ UI หลังโหลดหน้าเว็บ

document.addEventListener('DOMContentLoaded', () => {
    console.log('CRM App Initialized');
    
    // ตรวจสอบและป้องกันการสร้าง Tab ซ้ำในพื้นที่ Content (ถ้ามี)
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
        // ลบองค์ประกอบที่อาจถูกสร้างซ้ำซ้อนจากการรันสคริปต์ผิดพลาดในอดีต
        const redundantLinks = pane.querySelectorAll('a.nav-link');
        if (redundantLinks.length > 0) {
            console.warn('Found and removed redundant links in tab content');
            redundantLinks.forEach(link => link.remove());
        }
    });

    // ตั้งค่า event listener สำหรับแท็บเมนู
    const tabLinks = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabLinks.forEach(tab => {
        tab.addEventListener('shown.bs.tab', event => {
            const targetId = event.target.getAttribute('data-bs-target');
            switch (targetId) {
                case '#accounts': loadAccounts(); break;
                case '#leads': loadLeads(); break;
                case '#contacts': loadContacts(); break;
                case '#cases': loadCases(); break;
                case '#tasks': loadTasks(); break;
                case '#products': loadProducts(); break;
                case '#deals': loadDeals(); break;
            }
        });
    });
});
