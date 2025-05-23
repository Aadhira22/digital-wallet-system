// Restrict access to admin (default@example.com)
export default (req, res, next) => {
  // If not logged in or not the admin email, block access
  if (!req.user || req.user.email !== 'default@example.com') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next(); // Allow access
};
