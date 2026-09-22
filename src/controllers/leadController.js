const { getQuery, runQuery } = require('../config/database');

// GET /api/leads
exports.getAllLeads = async (req, res) => {
  try {
    const rows = await getQuery('SELECT * FROM leads ORDER BY id DESC');
    res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/leads/:id
exports.getLeadById = async (req, res) => {
  try {
    const lead = await getQuery('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/leads
exports.createLead = async (req, res) => {
  try {
    const { first_name, last_name, company, status, email, phone } = req.body;

    if (!first_name) {
      return res.status(400).json({ error: 'first_name is required' });
    }

    const finalStatus = status || 'New';

    const { lastID } = await runQuery(
      'INSERT INTO leads (first_name, last_name, company, status, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name || null, company || null, finalStatus, email || null, phone || null]
    );

    res.status(201).json({
      id: lastID,
      first_name,
      last_name: last_name || null,
      company: company || null,
      status: finalStatus,
      email: email || null,
      phone: phone || null,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/leads/:id
exports.updateLead = async (req, res) => {
  try {
    const { first_name, last_name, company, status, email, phone } = req.body;

    if (!first_name) {
      return res.status(400).json({ error: 'first_name is required' });
    }

    const lead = await getQuery('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const finalStatus = status || lead.status;
    const finalLastName = last_name !== undefined ? last_name : lead.last_name;
    const finalCompany = company !== undefined ? company : lead.company;
    const finalEmail = email !== undefined ? email : lead.email;
    const finalPhone = phone !== undefined ? phone : lead.phone;

    await runQuery(
      'UPDATE leads SET first_name = ?, last_name = ?, company = ?, status = ?, email = ?, phone = ? WHERE id = ?',
      [first_name, finalLastName || null, finalCompany || null, finalStatus, finalEmail || null, finalPhone || null, req.params.id]
    );

    res.json({
      id: Number(req.params.id),
      first_name,
      last_name: finalLastName || null,
      company: finalCompany || null,
      status: finalStatus,
      email: finalEmail || null,
      phone: finalPhone || null,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/leads/:id
exports.deleteLead = async (req, res) => {
  try {
    const { changes } = await runQuery('DELETE FROM leads WHERE id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/leads/:id/convert — แปลง Lead เป็น Account + Contact + Deal ใน transaction เดียว
exports.convertLead = async (req, res) => {
  try {
    const lead = await getQuery('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    if (lead.status === 'Converted') {
      return res.status(400).json({ error: 'Lead already converted' });
    }

    const VALID_STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'];

    const accountName = lead.company || `${lead.first_name} ${lead.last_name || ''}`.trim();
    const dealTitle = req.body.title || `${accountName} - New Deal`;
    const dealAmount = Number(req.body.amount) || 0;
    const dealStage = VALID_STAGES.includes(req.body.stage) ? req.body.stage : 'Prospecting';
    const closeDate = req.body.close_date || null;

    let accountId, contactId, dealId;

    try {
      await runQuery('BEGIN IMMEDIATE');

      const acc = await runQuery(
        'INSERT INTO accounts (name, industry, phone, website) VALUES (?, ?, ?, ?)',
        [accountName, null, lead.phone || null, null]
      );
      accountId = acc.lastID;

      const con = await runQuery(
        'INSERT INTO contacts (account_id, first_name, last_name, email, phone, title) VALUES (?, ?, ?, ?, ?, ?)',
        [accountId, lead.first_name, lead.last_name || null, lead.email || null, lead.phone || null, null]
      );
      contactId = con.lastID;

      const deal = await runQuery(
        'INSERT INTO deals (title, amount, stage, account_id, contact_id, close_date) VALUES (?, ?, ?, ?, ?, ?)',
        [dealTitle, dealAmount, dealStage, accountId, contactId, closeDate]
      );
      dealId = deal.lastID;

      await runQuery('UPDATE leads SET status = ? WHERE id = ?', ['Converted', req.params.id]);

      await runQuery('COMMIT');
    } catch (txErr) {
      try { await runQuery('ROLLBACK'); } catch (rbErr) { /* ignore rollback errors */ }
      throw txErr;
    }

    const updatedLead = await getQuery('SELECT * FROM leads WHERE id = ?', [req.params.id]);

    res.status(201).json({
      message: 'Lead converted successfully',
      lead: updatedLead,
      account: { id: accountId, name: accountName, phone: lead.phone || null },
      contact: { id: contactId, first_name: lead.first_name, last_name: lead.last_name || null },
      deal: { id: dealId, title: dealTitle, amount: dealAmount, stage: dealStage },
    });
  } catch (err) {
    console.error('convertLead Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
