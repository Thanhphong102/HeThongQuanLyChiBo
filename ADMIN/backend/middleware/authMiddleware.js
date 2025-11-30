const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Không có token' });

  try {
    const bearer = token.split(' ')[1];
    const decoded = jwt.verify(bearer, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Middleware kiểm tra quyền Admin Chi bộ (Role 2)
exports.isBranchAdmin = (req, res, next) => {
  // Role 2 = Bí thư / Chi ủy
  if (req.user.role !== 2) {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập (Yêu cầu Chi ủy)' });
  }
  next();
};