const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');

if (fs.existsSync(appJsPath)) {
    const dndCode = `
// === ABSOLUTE DRAG & DROP FIX ===
setInterval(() => {
    // 1. บังคับให้การ์ดทุกใบ (ที่มี #ID และมี Dropdown) ลากได้ตลอดเวลา
    document.querySelectorAll('div').forEach(el => {
        if(el.querySelector('select') && (el.innerText.includes('ปิด:') || el.innerText.includes('#'))) {
            el.setAttribute('draggable', 'true');
            el.classList.add('kanban-card');
            el.style.cursor = 'grab';
            
            // ดึง ID ออกมาซ่อนไว้
            const match = el.innerText.match(/#(\\d+)/);
            if(match) el.dataset.dealId = match[1];
        }
    });

    // 2. บังคับกำหนดพื้นที่รับการ์ด (Drop Zone) ให้ทุกคอลัมน์
    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'];
    document.querySelectorAll('div').forEach(el => {
        stages.forEach(stage => {
            // สังเกตจากหน้าจอ: คอลัมน์จะขึ้นต้นด้วยชื่อ Stage และลงท้ายด้วยคำว่า "รวม:"
            if(el.innerText.trim().startsWith(stage) && el.innerText.includes('รวม:') && el.children.length > 0) {
                el.dataset.dropStage = stage;
                el.classList.add('kanban-column');
            }
        });
    });
}, 1000); // ทำซ้ำทุก 1 วินาที เพื่อกันเหนียวเวลาเปลี่ยนแท็บหรือรีโหลดข้อมูล

// 3. จัดการ Events การลากวาง
window.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.kanban-card');
    if (card && card.dataset.dealId) {
        e.dataTransfer.setData('text/plain', card.dataset.dealId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => card.style.opacity = '0.4', 0);
    }
});

window.addEventListener('dragend', (e) => {
    const card = e.target.closest('.kanban-card');
    if (card) {
        card.style.opacity = '1';
        document.querySelectorAll('.kanban-column').forEach(c => c.style.outline = '');
    }
});

window.addEventListener('dragover', (e) => {
    const col = e.target.closest('.kanban-column');
    if (col) {
        e.preventDefault(); // **สำคัญมาก** เบราว์เซอร์จะไม่ยอมให้ Drop ถ้าไม่มีบรรทัดนี้
        e.dataTransfer.dropEffect = 'move';
        col.style.outline = '2px dashed #0d6efd'; // ขึ้นกรอบประสีน้ำเงินเวลาลากผ่าน
    }
});

window.addEventListener('dragleave', (e) => {
    const col = e.target.closest('.kanban-column');
    if (col) col.style.outline = '';
});

window.addEventListener('drop', (e) => {
    e.preventDefault();
    const col = e.target.closest('.kanban-column');
    if (col) {
        col.style.outline = '';
        const dealId = e.dataTransfer.getData('text/plain');
        const newStage = col.dataset.dropStage;
        
        // ส่ง ID และ Stage ใหม่ไปให้ฟังก์ชัน forceUpdateDealStage (ที่ทำไว้ในสคริปต์ก่อนหน้า) จัดการ
        if (dealId && newStage && typeof forceUpdateDealStage === 'function') {
            forceUpdateDealStage(dealId, newStage);
        }
    }
});
// ================================
`;
    fs.appendFileSync(appJsPath, '\n' + dndCode);
    console.log('✅ Drag & Drop events successfully wired to app.js!');
} else {
    console.log('❌ Error: public/js/app.js not found!');
}