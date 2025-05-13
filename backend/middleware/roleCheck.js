/**
 * Role-based access control middleware
 * @param  {...string} roles - List of allowed roles
 */
module.exports = (...roles) => {
  return (req, res, next) => {
    // Ensure auth middleware has run first
    if (!req.user) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }
    
    // Check if user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    next();
  };
};