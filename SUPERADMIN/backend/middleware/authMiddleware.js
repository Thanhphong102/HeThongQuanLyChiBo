const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Không có token' });

  try {
    const bearer = token.split(' ')[1]; // Loại bỏ chữ "Bearer "
    const decoded = jwt.verify(bearer, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Middleware kiểm tra quyền SuperAdmin (Role 1)
exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 1) {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập (Yêu cầu SuperAdmin)' });
  }
  next();
};