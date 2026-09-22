const { getQuery, runQuery } = require('../config/database');

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

  try {
    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countResult = await getQuery(countQuery, params);
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    const dataQuery = `SELECT * FROM products ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const dataParams = [...params, limit, offset];
    const products = await getQuery(dataQuery, dataParams);

    res.json({
      data: products,
      pagination: { page, limit, total, totalPages }
    });
  } catch (err) {
    console.error('Error getting products:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await getQuery('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Error getting product:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { name, code, price, description, is_active } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required' });
    }

    const { lastID } = await runQuery(
      'INSERT INTO products (name, code, price, description, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, code, price !== undefined ? price : null, description || null, is_active !== undefined ? is_active : 1]
    );

    res.status(201).json({
      id: lastID,
      name,
      code,
      price: price !== undefined ? price : null,
      description: description || null,
      is_active: is_active !== undefined ? is_active : 1,
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Code already exists' });
    }
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// PUT /api/products/:id (Full Replace)
exports.updateProduct = async (req, res) => {
  try {
    const { name, code, price, description, is_active } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required' });
    }

    const product = await getQuery('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await runQuery(
      'UPDATE products SET name = ?, code = ?, price = ?, description = ?, is_active = ? WHERE id = ?',
      [name, code, price !== undefined ? price : null, description || null, is_active !== undefined ? is_active : 1, req.params.id]
    );

    res.json({
      id: Number(req.params.id),
      name,
      code,
      price: price !== undefined ? price : null,
      description: description || null,
      is_active: is_active !== undefined ? is_active : 1,
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// PATCH /api/products/:id (Partial Update)
exports.patchProduct = async (req, res) => {
  try {
    const { name, code, price, description, is_active } = req.body;

    const fields = {};
    if (name !== undefined) fields.name = name;
    if (code !== undefined) fields.code = code;
    if (price !== undefined) fields.price = price;
    if (description !== undefined) fields.description = description;
    if (is_active !== undefined) fields.is_active = is_active;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'At least one field must be provided' });
    }

    if (fields.name !== undefined && !fields.name) {
      return res.status(400).json({ error: 'name cannot be empty' });
    }

    if (fields.code !== undefined && !fields.code) {
      return res.status(400).json({ error: 'code cannot be empty' });
    }

    const product = await getQuery('SELECT * FROM products WHERE id = ?', [req.params.id]);
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

    await runQuery(query, values);

    const updated = {
      id: Number(req.params.id),
      name: fields.name !== undefined ? fields.name : product.name,
      code: fields.code !== undefined ? fields.code : product.code,
      price: fields.price !== undefined ? (fields.price !== undefined ? fields.price : null) : product.price,
      description: fields.description !== undefined ? (fields.description || null) : product.description,
      is_active: fields.is_active !== undefined ? fields.is_active : product.is_active,
    };
    res.json(updated);
  } catch (err) {
    console.error('Error patching product:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const { changes } = await runQuery('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Database error' });
  }
};
