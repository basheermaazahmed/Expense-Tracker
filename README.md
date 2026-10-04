# 💰 Expense Tracker

A full-stack web application designed to help users securely record, manage, and track their daily expenses in one centralized platform.

## 🎯 Objective

The main objective of this project is to provide users with a simple and secure way to manage their personal expenses digitally.

Users can create an account, log in securely, and manage their own expense records using a real MySQL database.

## ✨ Features

- 🔐 User Registration & Login
- 🔑 JWT-based Authentication
- 💰 Add Expenses
- 📋 View Expenses
- ✏️ Edit Expenses
- 🗑️ Delete Expenses
- 👤 User-specific Expense Data
- 🗄️ Real MySQL Database
- 📱 Responsive & Mobile-Friendly UI
- 🌐 REST API
- ☁️ Deployed Frontend & Backend

## 🛠️ Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MySQL
- Aiven

### Authentication
- JSON Web Token (JWT)
- bcrypt

### Deployment
- Render

### Version Control
- Git
- GitHub

## 🔄 How It Works

1. User creates an account.
2. User logs in using their email and password.
3. A JWT token is generated after successful authentication.
4. The user can add and manage their expenses.
5. Expense data is stored in the MySQL database.
6. Each user can access only their own expenses.
7. Users can edit or delete their expense records whenever required.

## 🔒 Security

The application uses JWT-based authentication to protect user-specific API routes.

Passwords are securely hashed before being stored in the database.

User expenses are associated with their respective user accounts, preventing users from accessing other users' expense records.

## 🌐 Live Demo

https://expense-tracker-frontend-fumx.onrender.com

## 📂 Project Structure

```text
Expense-Tracker/
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── middleware/
│   ├── package.json
│   └── .env
│
└── README.md
