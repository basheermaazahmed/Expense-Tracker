const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// ADD EXPENSE
// ==========================================

router.post("/", authenticateToken, (req, res) => {

    const {
        amount,
        category,
        description,
        expense_date
    } = req.body;

    // Validate required fields
    if (!amount || !category || !expense_date) {
        return res.status(400).json({
            message: "Amount, category and date are required."
        });
    }

    const userId = req.user.userId;
    const db = req.app.get("db");

    const sql = `
        INSERT INTO expenses
        (user_id, amount, category, description, expense_date)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            userId,
            amount,
            category,
            description || null,
            expense_date
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Could not add expense."
                });

            }

            res.status(201).json({

                message: "Expense added successfully.",

                expenseId: result.insertId

            });

        }
    );

});


// ==========================================
// GET USER EXPENSES
// ==========================================

router.get("/", authenticateToken, (req, res) => {

    const userId = req.user.userId;

    const db = req.app.get("db");

    const sql = `
        SELECT
            id,
            amount,
            category,
            description,
            expense_date,
            created_at
        FROM expenses
        WHERE user_id = ?
        ORDER BY expense_date DESC, id DESC
    `;

    db.query(
        sql,
        [userId],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Could not fetch expenses."
                });

            }

            res.status(200).json(results);

        }
    );

});

// =================================
// UPDATE EXPENSE
// =================================

router.put("/:id", authenticateToken, (req, res) => {

    const db = req.app.get("db");

    const expenseId = req.params.id;
    const userId = req.user.userId;

    const {
        amount,
        category,
        description,
        expense_date
    } = req.body;

    // Validation
    if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
            message: "Please enter a valid amount."
        });
    }

    if (!category || !expense_date || !description) {
        return res.status(400).json({
            message: "All expense fields are required."
        });
    }

    const sql = `
        UPDATE expenses
        SET
            amount = ?,
            category = ?,
            description = ?,
            expense_date = ?
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        sql,
        [
            amount,
            category,
            description.trim(),
            expense_date,
            expenseId,
            userId
        ],
        (err, result) => {

            if (err) {
                console.error("Update expense error:", err);

                return res.status(500).json({
                    message: "Failed to update expense."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Expense not found."
                });
            }

            res.json({
                message: "Expense updated successfully."
            });
        }
    );
});
// ==========================================
// DELETE EXPENSE
// ==========================================

router.delete("/:id", authenticateToken, (req, res) => {

    const expenseId = req.params.id;
    const userId = req.user.userId;

    const db = req.app.get("db");

    const sql = `
        DELETE FROM expenses
        WHERE id = ? AND user_id = ?
    `;

    db.query(
        sql,
        [expenseId, userId],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Could not delete expense."
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Expense not found."
                });

            }

            res.status(200).json({
                message: "Expense deleted successfully."
            });

        }
    );

});


module.exports = router;