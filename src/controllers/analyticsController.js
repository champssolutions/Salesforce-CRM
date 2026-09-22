
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../../data/app.db');

exports.getDashboardStats = (req, res) => {
    const db = new sqlite3.Database(dbPath);
    const queries = {
        pipeline: "SELECT SUM(amount) as total FROM deals WHERE stage != 'Closed Lost'",
        openDeals: "SELECT COUNT(*) as count FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')",
        allDeals: "SELECT COUNT(*) as count FROM deals",
        wonDeals: "SELECT COUNT(*) as count FROM deals WHERE stage = 'Closed Won'",
        dealsStage: "SELECT stage, SUM(amount) as total FROM deals GROUP BY stage",
        casesStat: "SELECT status, COUNT(*) as count FROM cases GROUP BY status"
    };

    const results = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;

    Object.keys(queries).forEach(key => {
        db.all(queries[key], [], (err, rows) => {
            results[key] = err ? [] : rows;
            completed++;
            if (completed === totalQueries) {
                db.close();
                const allD = results.allDeals[0]?.count || 0;
                const wonD = results.wonDeals[0]?.count || 0;
                res.json({
                    quickStats: {
                        totalPipelineValue: results.pipeline[0]?.total || 0,
                        openDeals: results.openDeals[0]?.count || 0,
                        winRate: allD > 0 ? parseFloat(((wonD / allD) * 100).toFixed(1)) : 0
                    },
                    dealsByStage: results.dealsStage.reduce((acc, c) => ({ ...acc, [c.stage]: c.total }), {}),
                    casesByStatus: results.casesStat.reduce((acc, c) => ({ ...acc, [c.status]: c.count }), {})
                });
            }
        });
    });
};
