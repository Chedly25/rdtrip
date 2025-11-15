const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const db = require('../db/connection');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 * Use this middleware on routes that require authentication
 */
async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is invalid or expired'
      });
    }

    // Fetch user from database to ensure they still exist
    const result = await db.query(
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    // Attach user to request object
    req.user = result.rows[0];

    // Continue to next middleware/route handler
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require authentication
 * Use this for routes that work differently for logged-in users
 */
async function optionalAuth(req, res, next) {
  try {
    console.log('🔐 [optionalAuth] Running...');
    console.log('   Authorization header:', req.headers.authorization ? 'Present' : 'Missing');

    const token = extractTokenFromHeader(req.headers.authorization);
    console.log('   Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');

    if (token) {
      const decoded = verifyToken(token);
      console.log('   Decoded token:', decoded ? `{id: ${decoded.id}}` : 'null (invalid/expired)');

      if (decoded) {
        // Fetch user from database
        const result = await db.query(
          'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
          [decoded.id]
        );
        console.log('   User query result:', result.rows.length > 0 ? `Found user ${result.rows[0].email}` : 'No user found');

        if (result.rows.length > 0) {
          req.user = result.rows[0];
          console.log('   ✅ req.user populated:', req.user.email);
        }
      }
    } else {
      console.log('   ⚠️ No token provided, continuing without user');
    }

    // Continue regardless of whether user is authenticated
    next();

  } catch (error) {
    console.error('❌ Optional auth error:', error);
    // Don't fail the request, just continue without user
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuth
};
