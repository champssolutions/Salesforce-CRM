
const { getQuery } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const [pipeline, openDeals, allDeals, wonDeals, dealsStageRows, casesStatRows] = await Promise.all([
      getQuery("SELECT SUM(amount) as total FROM deals WHERE stage != 'Closed Lost'"),
      getQuery("SELECT COUNT(*) as count FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')"),
      getQuery("SELECT COUNT(*) as count FROM deals"),
      getQuery("SELECT COUNT(*) as count FROM deals WHERE stage = 'Closed Won'"),
      getQuery("SELECT stage, COUNT(*) as count FROM deals GROUP BY stage"),
      getQuery("SELECT status, COUNT(*) as count FROM cases GROUP BY status")
    ]);

    // getQuery returns an array of rows via db.all.
    const toRows = (v) => Array.isArray(v) ? v : (v ? [v] : []);
    const pipelineRows = toRows(pipeline);
    const openRows = toRows(openDeals);
    const allRows = toRows(allDeals);
    const wonRows = toRows(wonDeals);
    const dealsStage = toRows(dealsStageRows);
    const casesStat = toRows(casesStatRows);

    const allD = allRows[0]?.count || 0;
    const wonD = wonRows[0]?.count || 0;

    return res.json({
      quickStats: {
        totalPipelineValue: pipelineRows[0]?.total || 0,
        openDeals: openRows[0]?.count || 0,
        winRate: allD > 0 ? parseFloat(((wonD / allD) * 100).toFixed(1)) : 0
      },
      dealsByStage: (() => {
        const obj = {};
        dealsStage.forEach(r => { obj[r.stage] = Number(r.count) || 0; });
        return obj;
      })(),
      casesByStatus: (() => {
        const obj = {};
        casesStat.forEach(r => { obj[r.status] = Number(r.count) || 0; });
        return obj;
      })()
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
};
