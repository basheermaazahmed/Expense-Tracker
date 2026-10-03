const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();


// ==========================================
// REGISTER USER
// ==========================================

router.post("/register", async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {

        return res.status(400).json({
            message: "Please fill in all fields."
        });

    }

    const db = req.app.get("db");

    try {

        // Check if email already exists
        db.query(
            "SELECT id FROM users WHERE email = ?",
            [email],
            async (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message: "Database error."
                    });

                }


                if (results.length > 0) {

                    return res.status(409).json({
                        message:
                            "Email already registered."
                    });

                }


                // Hash password
                const hashedPassword =
                    await bcrypt.hash(
                        password,
                        10
                    );


                // Insert user
                db.query(
                    `INSERT INTO users
                    (name, email, password)
                    VALUES (?, ?, ?)`,
                    [
                        name,
                        email,
                        hashedPassword
                    ],
                    (err, result) => {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                message:
                                    "Could not create account."
                            });

                        }


                        res.status(201).json({

                            message:
                                "Account created successfully!",

                            userId:
                                result.insertId

                        });

                    }
                );

            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error."
        });

    }

});


// ==========================================
// LOGIN USER
// ==========================================

router.post("/login", async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {

        return res.status(400).json({
            message:
                "Please enter your email and password."
        });

    }

    const db = req.app.get("db");

    try {

        // Find user
        db.query(
            `SELECT
                id,
                name,
                email,
                password
             FROM users
             WHERE email = ?`,
            [email],
            async (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                // User doesn't exist
                if (results.length === 0) {

                    return res.status(401).json({
                        message:
                            "Invalid email or password."
                    });

                }


                const user =
                    results[0];


                // Compare password
                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        user.password
                    );


                if (!passwordMatch) {

                    return res.status(401).json({
                        message:
                            "Invalid email or password."
                    });

                }


                // ==========================================
                // CREATE JWT TOKEN
                // ==========================================

                const token =
                    jwt.sign(

                        {
                            userId:
                                user.id,

                            email:
                                user.email

                        },

                        process.env.JWT_SECRET,

                        {
                            expiresIn: "1d"
                        }

                    );


                // Send token + user information
                res.status(200).json({

                    message:
                        "Login successful!",

                    token:
                        token,

                    user: {

                        id:
                            user.id,

                        name:
                            user.name,

                        email:
                            user.email

                    }

                });

            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error."
        });

    }

});


// ==========================================
// GET CURRENT LOGGED-IN USER
// ==========================================

router.get("/me", (req, res) => {

    const authHeader =
        req.headers.authorization;


    // =================================
    // CHECK TOKEN
    // =================================

    if (!authHeader) {

        return res.status(401).json({

            message:
                "Access denied. Please login first."

        });

    }


    const parts =
        authHeader.split(" ");


    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer"
    ) {

        return res.status(401).json({

            message:
                "Invalid authorization format."

        });

    }


    const token =
        parts[1];


    // =================================
    // VERIFY JWT
    // =================================

    try {

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        const userId =
            decoded.userId;


        // =================================
        // GET USER FROM MYSQL
        // =================================

        const db =
            req.app.get("db");


        const sql = `
            SELECT
                id,
                name,
                email,
                created_at
            FROM users
            WHERE id = ?
        `;


        db.query(
            sql,
            [userId],
            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        message:
                            "Could not fetch user profile."

                    });

                }


                if (results.length === 0) {

                    return res.status(404).json({

                        message:
                            "User not found."

                    });

                }


                const user =
                    results[0];


                // =================================
                // SEND USER DETAILS
                // =================================

                res.status(200).json({

                    id:
                        user.id,

                    name:
                        user.name,

                    email:
                        user.email,

                    created_at:
                        user.created_at

                });

            }
        );


    } catch (error) {

        console.error(error);

        return res.status(403).json({

            message:
                "Invalid or expired token."

        });

    }

});


// ==========================================
// EXPORT ROUTER
// ==========================================

router.put("/change-password", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Access denied. Please login first."
        });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({
            message: "Invalid authorization format."
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const userId = decoded.userId;

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Please fill in all password fields."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters."
            });
        }

        const db = req.app.get("db");

        db.query(
            "SELECT password FROM users WHERE id = ?",
            [userId],
            async (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Database error."
                    });
                }

                if (results.length === 0) {
                    return res.status(404).json({
                        message: "User not found."
                    });
                }

                const passwordMatch = await bcrypt.compare(
                    currentPassword,
                    results[0].password
                );

                if (!passwordMatch) {
                    return res.status(401).json({
                        message: "Current password is incorrect."
                    });
                }

                const hashedPassword = await bcrypt.hash(
                    newPassword,
                    10
                );

                db.query(
                    "UPDATE users SET password = ? WHERE id = ?",
                    [hashedPassword, userId],
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({
                                message: "Could not update password."
                            });
                        }

                        res.status(200).json({
                            message: "Password changed successfully!"
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error(error);

        return res.status(403).json({
            message: "Invalid or expired token."
        });
    }
});
router.put("/profile", async (req, res) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Access denied. Please login first."
        });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({
            message: "Invalid authorization format."
        });
    }

    const token = parts[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const userId = decoded.userId;

        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: "Name and email are required."
            });
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (trimmedName.length < 2) {
            return res.status(400).json({
                message: "Name must be at least 2 characters."
            });
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        const db = req.app.get("db");

        // Check whether another account already uses this email
        db.query(
            "SELECT id FROM users WHERE email = ? AND id != ?",
            [trimmedEmail, userId],
            (err, results) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        message: "Database error."
                    });
                }

                if (results.length > 0) {

                    return res.status(409).json({
                        message: "This email is already registered."
                    });

                }

                // Update profile
                db.query(
                    `UPDATE users
                     SET name = ?, email = ?
                     WHERE id = ?`,
                    [
                        trimmedName,
                        trimmedEmail,
                        userId
                    ],
                    (err) => {

                        if (err) {
                            console.error(err);

                            return res.status(500).json({
                                message: "Could not update profile."
                            });
                        }

                        res.status(200).json({
                            message: "Profile updated successfully!",
                            user: {
                                id: userId,
                                name: trimmedName,
                                email: trimmedEmail
                            }
                        });

                    }
                );

            }
        );

    } catch (error) {

        console.error(error);

        return res.status(403).json({
            message: "Invalid or expired token."
        });

    }

});
module.exports = router;
