/* =================================
   EXPENSE TRACKER - JAVASCRIPT
   REAL DATABASE VERSION
================================= */


// =================================
// GET HTML ELEMENTS
// =================================

const expenseForm =
    document.getElementById("expenseForm");

const expenseTableBody =
    document.getElementById("expenseTableBody");

const amountInput =
    document.getElementById("amount");

const categoryInput =
    document.getElementById("category");

const dateInput =
    document.getElementById("date");

const descriptionInput =
    document.getElementById("description");

const searchInput =
    document.getElementById("searchExpense");

const categoryFilter =
    document.getElementById("expenseCategoryFilter");


// =================================
// BACKEND URL
// =================================

const API_URL =
    "https://expense-tracker-backend-0sta.onrender.com/api/expenses";


// =================================
// GET JWT TOKEN
// =================================

const token =
    localStorage.getItem("token");


// =================================
// CHECK LOGIN
// =================================

if (!token) {

    alert("Please login first.");

    window.location.href =
        "login.html";

}


// =================================
// STORE REAL EXPENSES
// =================================

let expenses = [];


// =================================
// SET TODAY'S DATE
// =================================

const today =
    new Date();

const todayString =
    today.toISOString().split("T")[0];

if (dateInput) {

    dateInput.value =
        todayString;

}
// =================================
// LOAD EXPENSES FROM MYSQL
// =================================

async function loadExpenses() {

    try {

        const response =
            await fetch(API_URL, {

                method: "GET",

                headers: {

                    "Authorization":
                        "Bearer " + token

                }

            });


        const data =
            await response.json();


        // =================================
        // SESSION EXPIRED
        // =================================

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem("token");
            localStorage.removeItem("loggedInUser");

            alert(
                "Your session has expired. Please login again."
            );

            window.location.href =
                "login.html";

            return;

        }


        // =================================
        // SERVER ERROR
        // =================================

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not load expenses."
            );

        }


        // =================================
        // CONVERT DATABASE DATA
        // =================================

        expenses =
            data.map(function (expense) {

                return {

                    id:
                        expense.id,

                    amount:
                        Number(expense.amount),

                    category:
                        expense.category,

                    date:
                        expense.expense_date,

                    description:
                        expense.description || ""

                };

            });


        // =================================
        // UPDATE DASHBOARD
        // =================================

        renderExpenses();

        updateSummary();

        updateCategorySummary();

        updateAnalytics();


    } catch (error) {

    console.error("Error loading expenses:", error);

    alert(
        "LOAD ERROR:\n" +
        error.message
    );

}

}
// =================================
// ADD EXPENSE
// =================================

expenseForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // =================================
        // GET FORM VALUES
        // =================================

        const amount =
            Number(amountInput.value);

        const category =
            categoryInput.value;

        const date =
            dateInput.value;

        const description =
            descriptionInput.value.trim();


        // =================================
        // VALIDATION
        // =================================

        if (!amount || amount <= 0) {

            alert(
                "Please enter a valid amount."
            );

            return;

        }


        if (!category) {

            alert(
                "Please select a category."
            );

            return;

        }


        if (!date) {

            alert(
                "Please select a date."
            );

            return;

        }


        if (!description) {

            alert(
                "Please enter a description."
            );

            return;

        }


        // =================================
        // DISABLE BUTTON
        // =================================

        const submitButton =
            expenseForm.querySelector(
                'button[type="submit"]'
            );

        if (submitButton) {

            submitButton.disabled = true;

            submitButton.textContent =
                "Adding...";

        }


        try {

            // =================================
            // SEND EXPENSE TO MYSQL
            // =================================

            const response =
                await fetch(API_URL, {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token

                    },

                    body: JSON.stringify({

                        amount:
                            amount,

                        category:
                            category,

                        description:
                            description,

                        expense_date:
                            date

                    })

                });


            const data =
                await response.json();


            // =================================
            // SESSION EXPIRED
            // =================================

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem("token");
                localStorage.removeItem("loggedInUser");

                alert(
                    "Your session has expired. Please login again."
                );

                window.location.href =
                    "login.html";

                return;

            }


            // =================================
            // ADD SUCCESSFUL
            // =================================

            if (response.ok) {

                alert(
                    "Expense added successfully!"
                );


                // Clear form
                expenseForm.reset();


                // Restore today's date
                dateInput.value =
                    todayString;


                // Reload real data from MySQL
                await loadExpenses();

            }


            else {

                alert(
                    data.message ||
                    "Could not add expense."
                );

            }


        } catch (error) {

            console.error(
                "Add expense error:",
                error
            );

            alert(
                "Unable to connect to the server."
            );

        }


        // =================================
        // ENABLE BUTTON AGAIN
        // =================================

        finally {

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.textContent =
                    "Add Expense";

            }

        }

    }
);
// =================================
// DISPLAY EXPENSES
// =================================

function renderExpenses() {

    expenseTableBody.innerHTML = "";


    // =================================
    // SEARCH TEXT
    // =================================

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    // =================================
    // SELECTED CATEGORY
    // =================================

    const selectedCategory =
        categoryFilter.value;


    // =================================
    // FILTER EXPENSES
    // =================================

    const filteredExpenses =
        expenses.filter(
            function (expense) {

                const matchesSearch =
                    expense.description
                        .toLowerCase()
                        .includes(searchText);


                const matchesCategory =
                    selectedCategory === "all" ||
                    expense.category ===
                        selectedCategory;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    // =================================
    // NO EXPENSES
    // =================================

    if (
        filteredExpenses.length === 0
    ) {

        expenseTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    No expenses found.
                </td>
            </tr>
        `;

        return;

    }


    // =================================
    // CREATE TABLE ROWS
    // =================================

    filteredExpenses.forEach(
        function (expense, index) {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${formatDate(
                        expense.date
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        expense.description
                    )}
                </td>

                <td>
                    ${getCategoryIcon(
                        expense.category
                    )}

                    ${escapeHTML(
                        expense.category
                    )}
                </td>

                <td>
                    ₹${Number(
                        expense.amount
                    ).toFixed(2)}
                </td>

                <td>

    <button
        onclick="editExpense(${expense.id})"
        style="
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 16px;
            margin-right: 6px;
        "
        title="Edit expense"
    >
        ✏️
    </button>

    <button
        onclick="deleteExpense(${expense.id})"
        style="
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 16px;
        "
        title="Delete expense"
    >
        🗑️
    </button>

</td>

            `;


            expenseTableBody.appendChild(
                row
            );

        }
    );

}
// =================================
// EDIT EXPENSE
// =================================

async function editExpense(id) {

    const expense = expenses.find(
        function (item) {
            return Number(item.id) === Number(id);
        }
    );

    if (!expense) {
        alert("Expense not found.");
        return;
    }

    const newAmount = prompt(
        "Enter amount:",
        expense.amount
    );

    if (newAmount === null) return;

    const amount = Number(newAmount);

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    const newCategory = prompt(
        "Enter category (Food, Travel, Study, Shopping, Entertainment, Others):",
        expense.category
    );

    if (newCategory === null) return;

    const allowedCategories = [
        "Food",
        "Travel",
        "Study",
        "Shopping",
        "Entertainment",
        "Others"
    ];

    if (!allowedCategories.includes(newCategory)) {
        alert("Invalid category.");
        return;
    }

    const newDescription = prompt(
        "Enter description:",
        expense.description
    );

    if (newDescription === null) return;

    if (!newDescription.trim()) {
        alert("Description cannot be empty.");
        return;
    }

    const newDate = prompt(
        "Enter date (YYYY-MM-DD):",
        expense.date
    );

    if (newDate === null) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        alert("Use YYYY-MM-DD format.");
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify({
                    amount: amount,
                    category: newCategory,
                    description: newDescription.trim(),
                    expense_date: newDate
                })
            }
        );

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {

            localStorage.removeItem("token");
            localStorage.removeItem("loggedInUser");

            alert("Your session has expired. Please login again.");

            window.location.href = "login.html";

            return;
        }

        if (response.ok) {

            alert("Expense updated successfully!");

            await loadExpenses();

        } else {

            alert(
                data.message ||
                "Could not update expense."
            );

        }

    } catch (error) {

        console.error("Edit expense error:", error);

        alert("Unable to connect to the server.");

    }
}
// =================================
// DELETE EXPENSE
// =================================

async function deleteExpense(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this expense?"
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {

                    method: "DELETE",

                    headers: {

                        "Authorization":
                            "Bearer " + token

                    }

                }
            );


        const data =
            await response.json();


        // =================================
        // SESSION EXPIRED
        // =================================

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem("token");
            localStorage.removeItem("loggedInUser");

            alert(
                "Your session has expired. Please login again."
            );

            window.location.href =
                "login.html";

            return;

        }


        // =================================
        // DELETE SUCCESSFUL
        // =================================

        if (response.ok) {

            alert(
                "Expense deleted successfully."
            );


            // Reload real data from MySQL
            await loadExpenses();

        }


        else {

            alert(
                data.message ||
                "Could not delete expense."
            );

        }


    } catch (error) {

        console.error(
            "Delete expense error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );

    }

}
// =================================
// UPDATE SUMMARY CARDS
// =================================

function updateSummary() {

    const totalSpent =
        expenses.reduce(
            function (total, expense) {

                return (
                    total +
                    Number(expense.amount)
                );

            },
            0
        );


    const totalExpenses =
        expenses.length;


    const averageExpense =
        totalExpenses > 0
            ? totalSpent / totalExpenses
            : 0;


    // =================================
    // SUMMARY CARDS
    // =================================

    const summaryCards =
        document.querySelectorAll(
            ".summary-card"
        );


    if (summaryCards.length >= 4) {

        // Total Spent
        summaryCards[0]
            .querySelector("h2")
            .textContent =
            formatCurrency(
                totalSpent
            );


        // Current Month
        summaryCards[1]
            .querySelector("h2")
            .textContent =
            formatCurrency(
                getCurrentMonthTotal()
            );


        // Total Transactions
        summaryCards[2]
            .querySelector("h2")
            .textContent =
            totalExpenses;


        // Average Expense
        summaryCards[3]
            .querySelector("h2")
            .textContent =
            formatCurrency(
                averageExpense
            );

    }

}
// =================================
// CURRENT MONTH TOTAL
// =================================

function getCurrentMonthTotal() {

    const currentDate =
        new Date();


    const currentMonth =
        currentDate.getMonth();


    const currentYear =
        currentDate.getFullYear();


    return expenses.reduce(
        function (total, expense) {

            // Prevent timezone date shifting
            const expenseDate =
                new Date(
                    expense.date +
                    "T00:00:00"
                );


            if (
                expenseDate.getMonth() ===
                    currentMonth &&

                expenseDate.getFullYear() ===
                    currentYear
            ) {

                return (
                    total +
                    Number(expense.amount)
                );

            }


            return total;

        },
        0
    );

}
// =================================
// CATEGORY SUMMARY
// =================================

function updateCategorySummary() {

    const categoryTotals = {

        Food: 0,
        Travel: 0,
        Study: 0,
        Shopping: 0,
        Entertainment: 0,
        Others: 0

    };


    // =================================
    // CALCULATE CATEGORY TOTALS
    // =================================

    expenses.forEach(
        function (expense) {

            if (
                categoryTotals[
                    expense.category
                ] !== undefined
            ) {

                categoryTotals[
                    expense.category
                ] += Number(
                    expense.amount
                );

            }

        }
    );


    // =================================
    // UPDATE CATEGORY LIST
    // =================================

    const categoryItems =
        document.querySelectorAll(
            ".category-list div"
        );


    categoryItems.forEach(
        function (item) {

            const span =
                item.querySelector(
                    "span"
                );

            const strong =
                item.querySelector(
                    "strong"
                );


            if (!span || !strong) {

                return;

            }


            const text =
                span.textContent;


            const category =
                text
                    .replace(
                        /^[^a-zA-Z]+/,
                        ""
                    )
                    .trim();


            const amount =
                categoryTotals[
                    category
                ] || 0;


            strong.textContent =
                formatCurrency(
                    amount
                );

        }
    );


    // =================================
    // UPDATE DONUT CENTER
    // =================================

    const donutAmount =
        document.querySelector(
            ".donut-placeholder span"
        );


    if (donutAmount) {

        donutAmount.textContent =
            formatCurrency(
                getCurrentMonthTotal()
            );

    }

}
// =================================
// SEARCH
// =================================

searchInput.addEventListener(
    "input",
    renderExpenses
);


// =================================
// CATEGORY FILTER
// =================================

categoryFilter.addEventListener(
    "change",
    renderExpenses
);


// =================================
// FORMAT CURRENCY
// =================================

function formatCurrency(amount) {

    const currency =
        localStorage.getItem("currency") || "INR";

    const currencySettings = {

        INR: {
            locale: "en-IN",
            currency: "INR"
        },

        USD: {
            locale: "en-US",
            currency: "USD"
        },

        EUR: {
            locale: "de-DE",
            currency: "EUR"
        }

    };

    const settings =
        currencySettings[currency] ||
        currencySettings.INR;

    return Number(amount).toLocaleString(
        settings.locale,
        {
            style: "currency",
            currency: settings.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}

// =================================
// FORMAT DATE
// =================================

// =================================
// FORMAT DATE
// =================================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    let date;

    // Handle MySQL DATE format: YYYY-MM-DD
    if (
        typeof dateString === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ) {

        const parts =
            dateString.split("-");

        date = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );

    }

    // Handle full date/time values
    else {

        date = new Date(dateString);

    }


    // Invalid date protection
    if (isNaN(date.getTime())) {

        return "-";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =================================
// CATEGORY ICON
// =================================

function getCategoryIcon(category) {

    const icons = {

        Food: "🍔",

        Travel: "🚌",

        Study: "📚",

        Shopping: "🛍️",

        Entertainment: "🎮",

        Others: "📦"

    };


    return (
        icons[category] ||
        "📦"
    );

}


// =================================
// ESCAPE HTML
// =================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value;


    return div.innerHTML;

}
// =================================
// ANALYTICS
// =================================

let categoryChartInstance = null;
let monthlyChartInstance = null;


// =================================
// UPDATE ANALYTICS
// =================================

function updateAnalytics() {

    // =================================
    // TOTAL SPENDING
    // =================================

    const totalSpending =
        expenses.reduce(
            function (total, expense) {

                return (
                    total +
                    Number(expense.amount)
                );

            },
            0
        );


    // =================================
    // TOTAL TRANSACTIONS
    // =================================

    const totalTransactions =
        expenses.length;

// =================================
// ADVANCED ANALYTICS
// =================================

let highestExpense = 0;
let lowestExpense = 0;

if (expenses.length > 0) {

    const amounts = expenses.map(function (expense) {
        return Number(expense.amount);
    });

    highestExpense = Math.max(...amounts);
    lowestExpense = Math.min(...amounts);
}


// =================================
// CURRENT MONTH SPENDING
// =================================

const today = new Date();

const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

const currentMonthExpenses =
    expenses.filter(function (expense) {

        const expenseDate =
            new Date(expense.date + "T00:00:00");

        return (
            expenseDate.getMonth() === currentMonth &&
            expenseDate.getFullYear() === currentYear
        );

    });

const currentMonthTotal =
    currentMonthExpenses.reduce(
        function (total, expense) {
            return total + Number(expense.amount);
        },
        0
    );


// =================================
// AVERAGE DAILY SPENDING
// =================================

const daysElapsed = today.getDate();

const averageDailySpending =
    daysElapsed > 0
        ? currentMonthTotal / daysElapsed
        : 0;


// =================================
// LAST MONTH SPENDING
// =================================

const lastMonthDate =
    new Date(
        currentYear,
        currentMonth - 1,
        1
    );

const lastMonth =
    lastMonthDate.getMonth();

const lastMonthYear =
    lastMonthDate.getFullYear();

const lastMonthTotal =
    expenses.reduce(
        function (total, expense) {

            const expenseDate =
                new Date(
                    expense.date + "T00:00:00"
                );

            if (
                expenseDate.getMonth() === lastMonth &&
                expenseDate.getFullYear() === lastMonthYear
            ) {
                return total + Number(expense.amount);
            }

            return total;

        },
        0
    );


// =================================
// MONTH COMPARISON
// =================================

let monthComparison = 0;

if (lastMonthTotal > 0) {

    monthComparison =
        (
            (currentMonthTotal - lastMonthTotal) /
            lastMonthTotal
        ) * 100;
}
    // =================================
    // CATEGORY TOTALS
    // =================================

    const categoryTotals = {

        Food: 0,
        Travel: 0,
        Study: 0,
        Shopping: 0,
        Entertainment: 0,
        Others: 0

    };


    expenses.forEach(
        function (expense) {

            if (
                categoryTotals[
                    expense.category
                ] !== undefined
            ) {

                categoryTotals[
                    expense.category
                ] += Number(
                    expense.amount
                );

            }

        }
    );


    // =================================
    // HIGHEST CATEGORY
    // =================================

    let highestCategory = "-";

    let highestAmount = 0;


    Object.keys(categoryTotals).forEach(
        function (category) {

            if (
                categoryTotals[category] >
                highestAmount
            ) {

                highestAmount =
                    categoryTotals[category];

                highestCategory =
                    category;

            }

        }
    );


    // =================================
    // UPDATE ANALYTICS CARDS
    // =================================

    const analyticsTotal =
        document.getElementById(
            "analyticsTotal"
        );


    const analyticsTransactions =
        document.getElementById(
            "analyticsTransactions"
        );


    const analyticsHighestCategory =
        document.getElementById(
            "analyticsHighestCategory"
        );


    if (analyticsTotal) {

        analyticsTotal.textContent =
            formatCurrency(
                totalSpending
            );

    }


    if (analyticsTransactions) {

        analyticsTransactions.textContent =
            totalTransactions;

    }


    if (analyticsHighestCategory) {

        analyticsHighestCategory.textContent =
            highestCategory;

    }

// =================================
// UPDATE ADVANCED ANALYTICS
// =================================

const analyticsHighestExpense =
    document.getElementById(
        "analyticsHighestExpense"
    );

const analyticsLowestExpense =
    document.getElementById(
        "analyticsLowestExpense"
    );

const analyticsDailyAverage =
    document.getElementById(
        "analyticsDailyAverage"
    );

const analyticsMonthComparison =
    document.getElementById(
        "analyticsMonthComparison"
    );


if (analyticsHighestExpense) {

    analyticsHighestExpense.textContent =
        formatCurrency(highestExpense);

}


if (analyticsLowestExpense) {

    analyticsLowestExpense.textContent =
        formatCurrency(lowestExpense);

}


if (analyticsDailyAverage) {

    analyticsDailyAverage.textContent =
        formatCurrency(averageDailySpending);

}


if (analyticsMonthComparison) {

    const sign =
        monthComparison > 0
            ? "+"
            : "";

    analyticsMonthComparison.textContent =
        sign +
        monthComparison.toFixed(1) +
        "%";

}
    // =================================
    // UPDATE CHARTS
    // =================================

    updateCategoryChart(
        categoryTotals
    );

    updateMonthlyChart();

}


// =================================
// CATEGORY CHART
// =================================

function updateCategoryChart(
    categoryTotals
) {

    const canvas =
        document.getElementById(
            "categoryChart"
        );


    if (!canvas) {

        return;

    }


    const labels = [

        "Food",
        "Travel",
        "Study",
        "Shopping",
        "Entertainment",
        "Others"

    ];


    const values =
        labels.map(
            function (category) {

                return categoryTotals[
                    category
                ];

            }
        );


    // Destroy old chart
    if (categoryChartInstance) {

        categoryChartInstance.destroy();

    }


    categoryChartInstance =
        new Chart(
            canvas,
            {

                type: "doughnut",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            data: values,

                            borderWidth: 2

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            position: "bottom"

                        }

                    }

                }

            }
        );

}


// =================================
// MONTHLY CHART
// =================================
// =================================
// MONTHLY CHART
// =================================

function updateMonthlyChart() {

    const canvas =
        document.getElementById("monthlyChart");

    if (!canvas) {
        return;
    }


    const monthlyTotals = {};


    // =================================
    // CALCULATE MONTHLY TOTALS
    // =================================

    expenses.forEach(function (expense) {

        let dateValue =
            String(expense.date || "").trim();


        if (!dateValue) {
            return;
        }


        // Get YYYY-MM directly
        // Works with:
        // 2026-10-03
        // 2026-10-03T00:00:00.000Z

        const yearMonth =
            dateValue.substring(0, 7);


        // Make sure it looks like YYYY-MM

        if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
            return;
        }


        const parts =
            yearMonth.split("-");


        const year =
            parts[0];

        const monthNumber =
            Number(parts[1]);


        const monthNames = [

            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"

        ];


        const monthName =
            monthNames[monthNumber - 1];


        if (!monthName) {
            return;
        }


        const label =
            monthName + " " + year;


        if (!monthlyTotals[label]) {

            monthlyTotals[label] = 0;

        }


        monthlyTotals[label] +=
            Number(expense.amount);

    });


    // =================================
    // CHART DATA
    // =================================

    const labels =
        Object.keys(monthlyTotals);


    const values =
        Object.values(monthlyTotals);


    // =================================
    // REMOVE OLD CHART
    // =================================

    if (monthlyChartInstance) {

        monthlyChartInstance.destroy();

    }


    // =================================
    // CREATE CHART
    // =================================

    monthlyChartInstance =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Monthly Spending",

                            data: values,

                            borderWidth: 1

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true

                        }

                    }

                }

            }
        );

}
// =================================
// INITIAL DASHBOARD
// =================================
// =============================
// CSV EXPORT
// =============================

function exportCSV() {
    if (!expenses || expenses.length === 0) {
        alert("There are no expenses to export.");
        return;
    }

    let csv = "Date,Category,Description,Amount\n";

    expenses.forEach(function (expense) {
        const date = expense.date || "";
        const category = expense.category || "";
        const description = (expense.description || "")
            .replace(/"/g, '""');
        const amount = Number(expense.amount) || 0;

        csv += `"${date}","${category}","${description}","${amount}"\n`;
    });

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "expense-report.csv";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
// =============================
// PDF EXPORT
// =============================

function exportPDF() {
    if (!expenses || expenses.length === 0) {
        alert("There are no expenses to export.");
        return;
    }

    if (!window.jspdf) {
        alert("PDF library could not be loaded. Please refresh the page.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const currency = localStorage.getItem("currency") || "INR";

    const currencySymbols = {
        INR: "Rs.",
        USD: "$",
        EUR: "€"
    };

    const symbol = currencySymbols[currency] || "Rs.";

    const user = JSON.parse(
        localStorage.getItem("loggedInUser") || "{}"
    );

    // =============================
    // TITLE
    // =============================

    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("Expense Tracker Report", 20, 20);

    doc.setFont(undefined, "normal");
    doc.setFontSize(11);

    doc.text(`Name: ${user.name || "User"}`, 20, 30);
    doc.text(`Email: ${user.email || ""}`, 20, 37);

    const reportDate = new Date().toLocaleDateString("en-IN");

    doc.text(`Generated: ${reportDate}`, 20, 44);

    // =============================
    // TOTAL EXPENSE
    // =============================

    const total = expenses.reduce(function (sum, expense) {
        return sum + Number(expense.amount || 0);
    }, 0);

    doc.setFontSize(13);
    doc.setFont(undefined, "bold");

    doc.text(
        `Total Expenses: ${symbol}${total.toLocaleString("en-IN", {
            maximumFractionDigits: 2
        })}`,
        20,
        56
    );

    doc.setFont(undefined, "normal");

    // =============================
    // TABLE HEADER
    // =============================

    let y = 72;

    doc.setFontSize(10);
    doc.setFont(undefined, "bold");

    doc.text("Date", 20, y);
    doc.text("Category", 55, y);
    doc.text("Description", 95, y);
    doc.text("Amount", 175, y);

    // Header line
    doc.line(20, y + 3, 195, y + 3);

    doc.setFont(undefined, "normal");

    y += 12;

    // =============================
    // EXPENSE ROWS
    // =============================

    expenses.forEach(function (expense) {

        if (y > 275) {
            doc.addPage();

            y = 20;

            doc.setFont(undefined, "bold");

            doc.text("Date", 20, y);
            doc.text("Category", 55, y);
            doc.text("Description", 95, y);
            doc.text("Amount", 175, y);

            doc.line(20, y + 3, 195, y + 3);

            doc.setFont(undefined, "normal");

            y += 12;
        }

        // Only show YYYY-MM-DD
        const date = String(expense.date || "")
            .substring(0, 10);

        const category = String(
            expense.category || "-"
        ).substring(0, 18);

        const description = String(
            expense.description || "-"
        ).substring(0, 35);

        const amount = Number(
            expense.amount || 0
        );

        doc.text(date, 20, y);
        doc.text(category, 55, y);
        doc.text(description, 95, y);

        doc.text(
            `${symbol}${amount.toLocaleString("en-IN", {
                maximumFractionDigits: 2
            })}`,
            175,
            y
        );

        y += 9;
    });

    // =============================
    // FOOTER
    // =============================

    doc.setFontSize(9);
    doc.setTextColor(100);

    doc.text(
        "Generated by Expense Tracker",
        20,
        290
    );

    doc.save("expense-report.pdf");
}
loadExpenses();