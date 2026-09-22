const { getQuery } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalAccounts,
      totalContacts,
      totalDeals,
      totalTasks,
      totalCases,
      totalProducts
    ] = await Promise.all([
      getQuery('SELECT COUNT(*) as count FROM accounts'),
      getQuery('SELECT COUNT(*) as count FROM contacts'),
      getQuery('SELECT COUNT(*) as count FROM deals'),
      getQuery('SELECT COUNT(*) as count FROM tasks'),
      getQuery('SELECT COUNT(*) as count FROM cases'),
      getQuery('SELECT COUNT(*) as count FROM products')
    ]);

    res.json({
      totalAccounts: totalAccounts.count,
      totalContacts: totalContacts.count,
      totalDeals: totalDeals.count,
      totalTasks: totalTasks.count,
      totalCases: totalCases.count,
      totalProducts: totalProducts.count
    });
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};
