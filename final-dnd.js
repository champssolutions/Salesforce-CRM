const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');

if (fs.existsSync(appJsPath)) {
    let appJs = fs.readFileSync(appJsPath, 'utf8');

    // ล้างโค้ดเก่าทั้งหมดเพื่อไม่ให้ตีกัน
    appJs = appJs.split('// --- ULTIMATE DRAG AND DROP ---')[0];
    appJs = appJs.split('// === ABSOLUTE DRAG & DROP FIX ===')[0];
    appJs = appJs.split('// --- FORCE FIX FOR DEAL STAGE (DROPDOWN & DRAG-DROP) ---')[0];
    appJs = appJs.split('// --- CLEAN DRAG & DROP FIX ---')[0];
    appJs = appJs.split('// --- PERFECT DRAG & DROP ---')[0];

    const fixCode = `
// --- PERFECT DRAG & DROP ---
(function initPerfectDnD() {
    // ฟังก์ชันยิง API อัปเดตข้อมูล
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

    // ลูปเช็กและฝังเซ็นเซอร์ให้ การ์ด และ คอลัมน์ (ทำงานอัตโนมัติเมื่อข้อมูลโหลดเสร็จ)
    setInterval(() => {
        const stages = ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'];
        
        // 1. ฝังเซ็นเซอร์ให้ "คอลัมน์" รับการตกของการ์ดได้ (Drop Zone)
        document.querySelectorAll('div').forEach(el => {
            stages.forEach(stage => {
                // คอลัมน์ที่แท้จริงต้องขึ้นต้นด้วยชื่อ Stage และมีคำว่า "รวม:"
                if (el.innerText && el.innerText.startsWith(stage) && el.innerText.includes('รวม:')) {
                    el.ondragover = (e) => e.preventDefault(); // บังคับให้เบราว์เซอร์ยอมรับการวาง
                    el.ondrop = (e) => {
                        e.preventDefault();
                        const dealId = e.dataTransfer.getData('dealId');
                        if (dealId) forceUpdateDealStage(dealId, stage); // ย้ายไป Stage ของคอลัมน์นี้ทันที
                    };
                }
            });
        });

        // 2. ฝังเซ็นเซอร์ให้ "การ์ด" ลากได้ (Draggable)
        document.querySelectorAll('select').forEach(select => {
            if (select.innerHTML.includes('Prospecting')) {
                let card = select.parentElement;
                while (card && card.tagName !== 'BODY') {
                    const match = card.innerText.match(/#(\\d+)/);
                    if (match) {
                        card.setAttribute('draggable', 'true');
                        card.style.cursor = 'grab';
                        card.dataset.dealId = match[1]; // เก็บ ID ซ่อนไว้ในการ์ด
                        
                        // เมื่อเริ่มลาก ให้จำ ID ไว้
                        card.ondragstart = (e) => {
                            e.dataTransfer.setData('dealId', match[1]);
                            setTimeout(() => card.style.opacity = '0.5', 0);
                        };
                        // เมื่อลากเสร็จ คืนค่าความโปร่งใส
                        card.ondragend = () => card.style.opacity = '1';
                        break; // เจอการ์ดแล้วหยุดลูปหา
                    }
                    card = card.parentElement;
                }
            }
        });
    }, 1000);

    // 3. ดักจับกรณีผู้ใช้เปลี่ยนข้อมูลผ่าน Dropdown บนการ์ดแทนการลาก
    if(!window.dropdownEventAttached) {
        document.body.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT' && e.target.innerHTML.includes('Prospecting')) {
                const card = e.target.closest('[data-deal-id]');
                if (card) {
                    forceUpdateDealStage(card.dataset.dealId, e.target.value);
                } else {
                    const match = e.target.parentElement.innerText.match(/#(\\d+)/);
                    if (match) forceUpdateDealStage(match[1], e.target.value);
                }
            }
        });
        window.dropdownEventAttached = true;
    }
})();
// --------------------------------
`;
    // เขียนทับด้วยโค้ดใหม่
    fs.writeFileSync(appJsPath, appJs.trim() + '\n\n' + fixCode);
    console.log('✅ Perfect Drag & Drop successfully applied to app.js!');
} else {
    console.log('❌ Error: public/js/app.js not found!');
}