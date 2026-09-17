const db = require('../config/database');

// GET /api/products?page=1&limit=10&search=xxx
exports.getAllProducts = (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  let whereClause = '';
  const params = [];

  if (search) {
    whereClause = 'WHERE name LIKE ?';
    params.push(`%${search}%`);
  }

  const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    const dataQuery = `SELECT * FROM products ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const dataParams = [...params, limit, offset];

    db.all(dataQuery, dataParams, (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        data: products,
        pagination: { page, limit, total, totalPages }
      });
    });
  });
};

// GET /api/products/:id
exports.getProductById = (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });
};

// POST /api/products
exports.createProduct = (req, res) => {
  const { name, description, price } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  db.run(
    'INSERT INTO products (name, description, price) VALUES (?, ?, ?)',
    [name, description || null, price !== undefined ? price : null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        description: description || null,
        price: price !== undefined ? price : null,
      });
    }
  );
};

// PUT /api/products/:id (Full Replace)
exports.updateProduct = (req, res) => {
  const { name, description, price } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  db.get('SELECT id FROM products WHERE id = ?', [req.params.id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.run(
      'UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?',
      [name, description || null, price !== undefined ? price : null, req.params.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({
          id: Number(req.params.id),
          name,
          description: description || null,
          price: price !== undefined ? price : null,
        });
      }
    );
  });
};

// PATCH /api/products/:id (Partial Update)
exports.patchProduct = (req, res) => {
  const { name, description, price } = req.body;

  const fields = {};
  if (name !== undefined) fields.name = name;
  if (description !== undefined) fields.description = description;
  if (price !== undefined) fields.price = price;

  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ error: 'At least one field must be provided' });
  }

  if (fields.name !== undefined && !fields.name) {
    return res.status(400).json({ error: 'name cannot be empty' });
  }

  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const setClauses = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      setClauses.push(`${key} = ?`);
      values.push(value !== undefined ? value : null);
    }
    values.push(req.params.id);

    const query = `UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`;

    db.run(query, values, function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const updated = {
        id: Number(req.params.id),
        name: fields.name !== undefined ? fields.name : product.name,
        description: fields.description !== undefined ? (fields.description || null) : product.description,
        price: fields.price !== undefined ? (fields.price !== undefined ? fields.price : null) : product.price,
      };
      res.json(updated);
    });
  });
};

// DELETE /api/products/:id
exports.deleteProduct = (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  });
};
