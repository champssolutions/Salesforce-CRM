const { getQuery } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const pipelineResult = await getQuery("SELECT SUM(amount) as totalPipeline FROM deals WHERE stage != 'Closed Lost'");
    const openDealsResult = await getQuery("SELECT COUNT(*) as openDeals FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')");
    const allDealsResult = await getQuery("SELECT COUNT(*) as total FROM deals");
    const wonDealsResult = await getQuery("SELECT COUNT(*) as won FROM deals WHERE stage = 'Closed Won'");

    const totalPipeline = pipelineResult[0]?.totalPipeline || 0;
    const openDeals = openDealsResult[0]?.openDeals || 0;
    const total = allDealsResult[0]?.total || 0;
    const won = wonDealsResult[0]?.won || 0;
    const winRate = total > 0 ? ((won / total) * 100).toFixed(1) : 0;

    const dealsByStage = await getQuery("SELECT stage, SUM(amount) as total FROM deals GROUP BY stage");
    const casesByStatus = await getQuery("SELECT status, COUNT(*) as count FROM cases GROUP BY status");

    res.json({
      totalPipeline,
      openDeals,
      winRate: parseFloat(winRate),
      dealsByStage: dealsByStage || [],
      casesByStatus: casesByStatus || []
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ error: err.message });
  }
};
