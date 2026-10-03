const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expense");

const app = express();

app.use(cors());
app.use(express.json());


// ==========================================
// MYSQL CONNECTION
// ==========================================

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {

    if (err) {
        console.error("❌ MySQL connection failed:", err.message);
        return;
    }

    console.log("✅ MySQL connected successfully!");

});

app.set("db", db);


// ==========================================
// ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/expenses", expenseRoutes);


// ==========================================
// TEST ROUTES
// ==========================================

app.get("/", (req, res) => {

    res.json({
        message: "Expense Tracker Backend is running!"
    });

});

app.get("/test-expense-route", (req, res) => {

    res.json({
        message: "Expense route is connected!"
    });

});


// ==========================================
// SERVER
// ==========================================

const PORT = 5000;

app.listen(PORT, () => {

    console.log(
        `🚀 Server running on http://localhost:${PORT}`
    );

});