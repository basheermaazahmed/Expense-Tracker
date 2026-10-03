const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {

    // Get Authorization header
    const authHeader = req.headers.authorization;

    // Check if token exists
    if (!authHeader) {
        return res.status(401).json({
            message: "Access denied. Please login first."
        });
    }

    // Expected format:
    // Authorization: Bearer YOUR_TOKEN
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({
            message: "Invalid authorization format."
        });
    }

    const token = parts[1];

    try {

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store user information in request
        req.user = decoded;

        // Continue to the requested route
        next();

    } catch (error) {

        return res.status(403).json({
            message: "Invalid or expired token."
        });

    }
};

module.exports = authenticateToken;