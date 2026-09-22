const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');

if (fs.existsSync(appJsPath)) {
    let appJs = fs.readFileSync(appJsPath, 'utf8');

    // 1. ล้างสคริปต์เก่าที่ทำให้เส้นกรอบซ้อนกันออกให้หมด
    appJs = appJs.split('// --- ULTIMATE DRAG AND DROP ---')[0];
    appJs = appJs.split('// === ABSOLUTE DRAG & DROP FIX ===')[0];
    appJs = appJs.split('// --- FORCE FIX FOR DEAL STAGE (DROPDOWN & DRAG-DROP) ---')[0];
    appJs = appJs.split('// --- CLEAN DRAG & DROP FIX ---')[0];

    // 2. โค้ดชุดใหม่ที่สะอาด ไม่มีเส้นกรอบกวนใจ
    const cleanFix = `
// --- CLEAN DRAG & DROP FIX ---
(function initCleanDnD() {
    window.forceUpdateDealStage = async function(dealId, newStage) {
        if (!dealId || !newStage) return;
        try {
            const res = await fetch('/api/deals/' + dealId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: newStage })
            });
            if (res.ok) {
                if (typeof loadDeals === 'function') loadDeals();
                else window.location.reload();
            }
        } catch (err) { console.error('API Error:', err); }
    };

    // ดักการเลือก Dropdown
    document.body.addEventListener('change', function(e) {
        if (e.target.tagName === 'SELECT') {
            const isKanban = Array.from(e.target.options).some(o => o.value === 'Prospecting');
            if (isKanban) {
                const card = e.target.closest('div[draggable="true"]') || e.target.parentElement;
                const match = card.innerText.match(/#(\\d+)/);
                if (match) forceUpdateDealStage(match[1], e.target.value);
            }
        }
    });

    // กำหนดให้การ์ดลากได้ (แบบไม่ใช้ setInterval ลดภาระเครื่อง)
    const observer = new MutationObserver(() => {
        document.querySelectorAll('select').forEach(select => {
            if (select.innerHTML.includes('Prospecting')) {
                let card = select.parentElement;
                if (card && card.tagName === 'DIV' && !card.hasAttribute('draggable')) {
                    card.setAttribute('draggable', 'true');
                    card.style.cursor = 'grab';
                    card.classList.add('clean-kanban-card');
                    const match = card.innerText.match(/#(\\d+)/);
                    if (match) card.dataset.dealId = match[1];
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // จัดการลาก-วาง (ไม่มีเส้นกรอบกวนใจ)
    window.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.clean-kanban-card');
        if (card && card.dataset.dealId) {
            e.dataTransfer.setData('text/plain', card.dataset.dealId);
            setTimeout(() => card.style.opacity = '0.5', 0);
        }
    });

    window.addEventListener('dragend', (e) => {
        const card = e.target.closest('.clean-kanban-card');
        if (card) card.style.opacity = '1';
    });

    window.addEventListener('dragover', (e) => {
        e.preventDefault(); // ยอมให้วางได้
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        const dealId = e.dataTransfer.getData('text/plain');
        if (!dealId) return;

        // คำนวณหาคอลัมน์เป้าหมายตอนปล่อยเมาส์แบบฉลาด
        const stages = ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'];
        let targetCol = e.target;
        let newStage = null;

        while (targetCol && targetCol !== document.body) {
            if (targetCol.innerText) {
                for (let stage of stages) {
                    if (targetCol.innerText.includes(stage) && targetCol.innerText.includes('รวม:')) {
                        newStage = stage;
                        break;
                    }
                }
            }
            if (newStage) break;
            targetCol = targetCol.parentElement;
        }

        if (newStage) forceUpdateDealStage(dealId, newStage);
    });
})();
// --------------------------------
`;
    // เขียนทับไฟล์ app.js ให้สะอาดหมดจด
    fs.writeFileSync(appJsPath, appJs.trim() + '\n\n' + cleanFix);
    console.log('✅ Cleaned up old scripts and applied perfect Drag & Drop without borders!');
} else {
    console.log('❌ Error: public/js/app.js not found!');
}