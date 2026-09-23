
const { getQuery, runQuery } = require('../config/database');

const { db } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const [pipeline, openDeals, allDeals, wonDeals, dealsStageRows, casesStatRows] = await Promise.all([
      getQuery("SELECT SUM(amount) as total FROM deals WHERE stage != 'Closed Lost'"),
      getQuery("SELECT COUNT(*) as count FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')"),
      getQuery("SELECT COUNT(*) as count FROM deals"),
      getQuery("SELECT COUNT(*) as count FROM deals WHERE stage = 'Closed Won'"),
      getQuery("SELECT stage, SUM(amount) as total FROM deals GROUP BY stage"),
      getQuery("SELECT status, COUNT(*) as count FROM cases GROUP BY status")
    ]);

    // getQuery returns a single row (or null). For aggregation queries the value sits on the row.
    const pipelineRows = Array.isArray(pipeline) ? pipeline : (pipeline ? [pipeline] : []);
    const openRows = Array.isArray(openDeals) ? openDeals : (openDeals ? [openDeals] : []);
    const allRows = Array.isArray(allDeals) ? allDeals : (allDeals ? [allDeals] : []);
    const wonRows = Array.isArray(wonDeals) ? wonDeals : (wonDeals ? [wonDeals] : []);
    const dealsStage = Array.isArray(dealsStageRows) ? dealsStageRows : [];
    const casesStat = Array.isArray(casesStatRows) ? casesStatRows : [];

    const allD = allRows[0]?.count || 0;
    const wonD = wonRows[0]?.count || 0;

    return res.json({
      quickStats: {
        totalPipelineValue: pipelineRows[0]?.total || 0,
        openDeals: openRows[0]?.count || 0,
        winRate: allD > 0 ? parseFloat(((wonD / allD) * 100).toFixed(1)) : 0
      },
      dealsByStage: dealsStage.reduce((acc, c) => ({ ...acc, [c.stage]: c.total }), {}),
      casesByStatus: casesStat.reduce((acc, c) => ({ ...acc, [c.status]: c.count }), {})
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
};
