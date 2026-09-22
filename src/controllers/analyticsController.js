const { getQuery } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      accounts,
      contacts,
      deals,
      tasks,
      cases,
      products
    ] = await Promise.all([
      getQuery('SELECT COUNT(*) as count FROM accounts'),
      getQuery('SELECT COUNT(*) as count FROM contacts'),
      getQuery('SELECT COUNT(*) as count FROM deals'),
      getQuery('SELECT COUNT(*) as count FROM tasks'),
      getQuery('SELECT COUNT(*) as count FROM cases'),
      getQuery('SELECT COUNT(*) as count FROM products')
    ]);

    res.json({
      totalAccounts: accounts.count,
      totalContacts: contacts.count,
      totalDeals: deals.count,
      totalTasks: tasks.count,
      totalCases: cases.count,
      totalProducts: products.count
    });
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    res.status(500).json({ 
      error: 'Failed to get dashboard stats',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
};
