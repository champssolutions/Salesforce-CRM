const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 1. แก้ไขชื่อ Key ให้ตรงกับที่หน้าเว็บ (app.js) ต้องการ เพื่อแก้บั๊ก NaN
const controllerPath = path.join(__dirname, 'src', 'controllers', 'analyticsController.js');
if (fs.existsSync(controllerPath)) {
    let code = fs.readFileSync(controllerPath, 'utf8');
    code = code.replace(/totalPipeline:/g, 'totalPipelineValue:');
    fs.writeFileSync(controllerPath, code);
    console.log('✅ Fixed Key: totalPipeline -> totalPipelineValue');
}

// 2. เพิ่มข้อมูลจำลอง (Mock Data) ลงฐานข้อมูล เพื่อให้กราฟมีข้อมูลไปวาด
const db = new sqlite3.Database('./data/app.db');

db.serialize(() => {
    // ใส่ข้อมูลจำลองลงตาราง Deals
    const deals = [
        ['Deal A', 50000, 'Prospecting'],
        ['Deal B', 80000, 'Qualification'],
        ['Deal C', 120000, 'Proposal'],
        ['Deal D', 200000, 'Closed Won'],
        ['Deal E', 30000, 'Closed Lost']
    ];
    const stmtDeal = db.prepare("INSERT INTO deals (title, amount, stage) VALUES (?, ?, ?)");
    deals.forEach(d => stmtDeal.run(d));
    stmtDeal.finalize();

    // ใส่ข้อมูลจำลองลงตาราง Cases
    const cases = [
        ['Login Issue', 'New'],
        ['Billing Bug', 'Working'],
        ['Feature Request', 'Closed'],
        ['Server Down', 'New']
    ];
    const stmtCase = db.prepare("INSERT INTO cases (subject, status) VALUES (?, ?)");
    cases.forEach(c => stmtCase.run(c));
    stmtCase.finalize();
});

db.close(() => {
    console.log("✅ Mock data inserted!");
    console.log("🎉 Ready! Please run 'npm start' and refresh your browser.");
});