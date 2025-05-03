module.exports = function checkAuth(req, res, next) {
    const { user_id } = req.body || req.params;
  
    if (!user_id) {
      return res.status(401).json({ error: 'User belum login' });
    }
  
    // Bisa ditambah validasi dari database jika ingin lebih aman
    next();
  };
  