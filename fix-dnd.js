const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');

if (fs.existsSync(appJsPath)) {
    let appJs = fs.readFileSync(appJsPath, 'utf8');

    if (!appJs.includes('// --- ULTIMATE DRAG AND DROP ---')) {
        const dndCode = `
// --- ULTIMATE DRAG AND DROP ---
(function initDragAndDrop() {
    const setupKanban = () => {
        const stages = ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'];
        
        // 1. ระบุตัวคอลัมน์
        document.querySelectorAll('div, section').forEach(el => {
            stages.forEach(stage => {
                if (el.textContent.includes(stage) && el.children.length > 1) {
                    let target = el;
                    if (target.tagName.match(/^H\\d$/) || target.tagName === 'SPAN') target = target.parentElement;
                    target.dataset.dropStage = stage;
                }
            });
        });

        // 2. ระบุตัวการ์ดและกำหนดค่าให้ลากได้
        document.querySelectorAll('select').forEach(select => {
            if (select.innerHTML.includes('Prospecting')) {
                let card = select.parentElement;
                while (card && card.tagName !== 'BODY' && !card.classList.contains('kanban-card')) {
                    if (card.style || card.classList.contains('bg-white') || card.classList.contains('border')) {
                        card.classList.add('kanban-card');
                        break;
                    }
                    card = card.parentElement;
                }

                if (card && card !== document.body) {
                    card.setAttribute('draggable', 'true');
                    card.style.cursor = 'grab';
                    
                    // ดึง ID ออกมาจาก #1, #2 ตามภาพ
                    let dealId = select.getAttribute('onchange')?.match(/\\d+/)?.[0] || select.id?.match(/\\d+/)?.[0];
                    if (!dealId) {
                        const textMatch = card.innerText.match(/#(\\d+)/);
                        if (textMatch) dealId = textMatch[1];
                    }
                    card.dataset.dealId = dealId;
                }
            }
        });
    };

    // ติดตามความเปลี่ยนแปลงเผื่อมีการโหลดข้อมูลใหม่
    const observer = new MutationObserver(() => {
        if (!document.querySelector('.kanban-card') && document.querySelector('select')) {
            setupKanban();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Events ลาก-วาง
    document.body.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.kanban-card');
        if (card && card.dataset.dealId) {
            e.dataTransfer.setData('text/plain', card.dataset.dealId);
            setTimeout(() => card.style.opacity = '0.5', 0);
        }
    });

    document.body.addEventListener('dragend', (e) => {
        const card = e.target.closest('.kanban-card');
        if (card) {
            card.style.opacity = '1';
            document.querySelectorAll('[data-drop-stage]').forEach(c => c.style.border = '');
        }
    });

    document.body.addEventListener('dragover', (e) => {
        const col = e.target.closest('[data-drop-stage]');
        if (col) {
            e.preventDefault();
            col.style.border = '2px dashed #4F46E5'; // กรอบไฮไลต์ตอนลากผ่าน
        }
    });

    document.body.addEventListener('dragleave', (e) => {
        const col = e.target.closest('[data-drop-stage]');
        if (col) col.style.border = '';
    });

    document.body.addEventListener('drop', async (e) => {
        const col = e.target.closest('[data-drop-stage]');
        if (col) {
            e.preventDefault();
            col.style.border = '';
            const dealId = e.dataTransfer.getData('text/plain');
            const newStage = col.dataset.dropStage;

            if (dealId && newStage) {
                try {
                    const res = await fetch(\`/api/deals/\${dealId}\`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stage: newStage })
                    });
                    if (res.ok) {
                        if (typeof loadDeals === 'function') loadDeals();
                        else window.location.reload();
                    }
                } catch (err) {
                    console.error('Drag & Drop Update Error:', err);
                }
            }
        }
    });
})();
// --------------------------------
`;
        fs.appendFileSync(appJsPath, '\n' + dndCode);
        console.log('✅ Ultimate Drag-and-Drop Fix applied to public/js/app.js!');
    } else {
        console.log('⚠️ Fix already applied.');
    }
} else {
    console.log('❌ Error: public/js/app.js not found!');
}