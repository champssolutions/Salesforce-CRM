const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');

if (fs.existsSync(appJsPath)) {
    let appJs = fs.readFileSync(appJsPath, 'utf8');

    const fixCode = `
// --- FORCE FIX FOR DEAL STAGE (DROPDOWN & DRAG-DROP) ---
(function initDealStageFix() {
    // 1. ฟังก์ชันอัปเดต Stage แบบรวบยอด
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
            } else {
                console.error('Failed to update stage');
            }
        } catch (err) {
            console.error('API Error:', err);
        }
    };

    // 2. ดักจับการเปลี่ยน Dropdown บนการ์ดทุกใบ
    document.body.addEventListener('change', function(e) {
        if (e.target.tagName === 'SELECT') {
            // เช็กว่าเป็น Dropdown ของ Kanban หรือไม่
            const isKanbanDropdown = Array.from(e.target.options).some(opt => opt.value === 'Prospecting' || opt.value === 'Closed Won');
            
            if (isKanbanDropdown) {
                // ควานหา ID จากตัวการ์ด (เช่น #6)
                const card = e.target.closest('.kanban-card') || e.target.parentElement;
                let dealId = null;
                
                const textMatch = card.innerText.match(/#(\\d+)/);
                if (textMatch) dealId = textMatch[1];

                if (dealId) {
                    forceUpdateDealStage(dealId, e.target.value);
                }
            }
        }
    });

    // 3. ปรับปรุง Drag & Drop ให้ดึง ID ได้แม่นยำขึ้น
    document.body.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.kanban-card') || e.target.closest('div[draggable="true"]');
        if (card) {
            let dealId = card.dataset.dealId;
            if (!dealId) {
                const textMatch = card.innerText.match(/#(\\d+)/);
                if (textMatch) dealId = textMatch[1];
            }
            if (dealId) {
                e.dataTransfer.setData('text/plain', dealId);
                setTimeout(() => card.style.opacity = '0.5', 0);
            }
        }
    });

    document.body.addEventListener('drop', (e) => {
        const col = e.target.closest('[data-drop-stage]');
        if (col) {
            e.preventDefault();
            col.style.border = '';
            const dealId = e.dataTransfer.getData('text/plain');
            const newStage = col.dataset.dropStage;
            if (dealId && newStage) {
                forceUpdateDealStage(dealId, newStage);
            }
        }
    });
})();
// --------------------------------
`;
    // เขียนต่อท้ายไฟล์ app.js
    fs.appendFileSync(appJsPath, '\n' + fixCode);
    console.log('✅ Kanban Fix applied successfully to app.js!');
} else {
    console.log('❌ Error: public/js/app.js not found!');
}