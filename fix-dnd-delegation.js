const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');

if (fs.existsSync(appJsPath)) {
    let appJs = fs.readFileSync(appJsPath, 'utf8');

    // กวาดล้างโค้ด Drag & Drop ตัวเก่าออกทั้งหมดเพื่อความสะอาด
    appJs = appJs.split('// --- ULTIMATE DRAG AND DROP ---')[0];
    appJs = appJs.split('// === ABSOLUTE DRAG & DROP FIX ===')[0];
    appJs = appJs.split('// --- FORCE FIX FOR DEAL STAGE (DROPDOWN & DRAG-DROP) ---')[0];
    appJs = appJs.split('// --- CLEAN DRAG & DROP FIX ---')[0];
    appJs = appJs.split('// --- PERFECT DRAG & DROP ---')[0];
    appJs = appJs.split('// --- DELEGATION DND FIX ---')[0];

    const fixCode = `
// --- DELEGATION DND FIX ---
(function initDelegationDnD() {
    // 1. ฟังก์ชันบันทึกข้อมูลเมื่อมีการเปลี่ยน Stage
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

    // 2. ฝังคลาสให้การ์ดและคอลัมน์อย่างต่อเนื่องแบบไม่ทำลาย Event
    setInterval(() => {
        document.querySelectorAll('select').forEach(sel => {
            if(sel.innerHTML.includes('Prospecting')) {
                let card = sel.closest('div.bg-white, div.card, div.border') || sel.parentElement;
                if(card && card.tagName === 'DIV' && card.innerText.includes('#')) {
                    card.setAttribute('draggable', 'true');
                    card.style.cursor = 'grab';
                    card.classList.add('dnd-card');
                    const match = card.innerText.match(/#(\\d+)/);
                    if(match) card.dataset.dealId = match[1];
                }
            }
        });
        
        const stages = ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'];
        document.querySelectorAll('div').forEach(col => {
            stages.forEach(stage => {
                if(col.innerText && col.innerText.startsWith(stage) && col.innerText.includes('รวม:') && col.children.length > 0) {
                    col.classList.add('dnd-column');
                    col.dataset.stage = stage;
                }
            });
        });
    }, 1000);

    // 3. ควบคุม Event ลากวางที่ระดับ Document (ปลอดภัยจากการถูกลบเมื่อรีเฟรช)
    document.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.dnd-card');
        if(card && card.dataset.dealId) {
            e.dataTransfer.setData('text/plain', card.dataset.dealId);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => card.style.opacity = '0.5', 0);
        }
    });

    document.addEventListener('dragend', (e) => {
        const card = e.target.closest('.dnd-card');
        if(card) {
            card.style.opacity = '1';
            document.querySelectorAll('.dnd-column').forEach(c => c.style.backgroundColor = '');
        }
    });

    // ** หัวใจสำคัญ: ต้องมี preventDefault เพื่อให้เบราว์เซอร์ยอมรับการวาง **
    document.addEventListener('dragover', (e) => {
        const col = e.target.closest('.dnd-column');
        if(col) {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'move';
        }
    });

    document.addEventListener('dragenter', (e) => {
        const col = e.target.closest('.dnd-column');
        if(col) col.style.backgroundColor = 'rgba(0,0,0,0.02)'; // ไฮไลต์บางๆ ไม่ให้กวนตา
    });

    document.addEventListener('dragleave', (e) => {
        const col = e.target.closest('.dnd-column');
        if(col) col.style.backgroundColor = '';
    });

    document.addEventListener('drop', (e) => {
        const col = e.target.closest('.dnd-column');
        if(col) {
            e.preventDefault();
            col.style.backgroundColor = '';
            const dealId = e.dataTransfer.getData('text/plain');
            const newStage = col.dataset.stage;
            if(dealId && newStage) {
                forceUpdateDealStage(dealId, newStage);
            }
        }
    });

    // 4. ให้ Dropdown ใช้งานได้ด้วยเหมือนเดิม
    document.addEventListener('change', (e) => {
        if (e.target.tagName === 'SELECT' && e.target.innerHTML.includes('Prospecting')) {
            const card = e.target.closest('.dnd-card') || e.target.parentElement;
            let dealId = card?.dataset?.dealId;
            if (!dealId) {
                const match = card?.innerText?.match(/#(\\d+)/);
                if (match) dealId = match[1];
            }
            if (dealId) {
                forceUpdateDealStage(dealId, e.target.value);
            }
        }
    });
})();
// --------------------------------
`;
    // เขียนโค้ดลงไฟล์ app.js
    fs.writeFileSync(appJsPath, appJs.trim() + '\n\n' + fixCode);
    console.log('✅ Delegation DnD Fix successfully applied to app.js!');
} else {
    console.log('❌ Error: public/js/app.js not found!');
}