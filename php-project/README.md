# City Con & Allied Health Sciences Nowshera Virkan
## Fee Management System (PHP & MySQL)

Address: Near AL-Fatah Resturent Mutto Bahikay Road Nowshera Virkan  
Mobile: 0302-6605216  ||  0321-8420446

---

### 🚀 How to Run this Project on XAMPP / WAMP

#### Step 1: Install & Start XAMPP
1. Download & Install [XAMPP](https://www.apachefriends.org/) (with Apache & MySQL).
2. Open XAMPP Control Panel and click **Start** for both **Apache** and **MySQL**.

#### Step 2: Create the Database
1. Open your browser and go to `http://localhost/phpmyadmin/`.
2. Click on **New** on the left sidebar to create a database.
3. Name the database `citycon_fee_db` and click **Create**.
4. Click on the **Import** tab at the top.
5. Choose the file `database.sql` from this folder and click **Import** (or **Go**).
   *(This creates the tables `students` and `fee_transactions` and inserts sample students & payments).*

#### Step 3: Put Files in `htdocs`
1. Copy this entire project folder into your XAMPP web root directory:
   - Windows: `C:\xampp\htdocs\citycon_fees\`
   - Mac / Linux: `/Applications/XAMPP/htdocs/citycon_fees/` or `/opt/lampp/htdocs/citycon_fees/`

#### Step 4: Verify Database Connection (`config.php`)
Open `config.php` and verify your MySQL settings (default XAMPP credentials):
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'citycon_fee_db');
define('DB_USER', 'root');
define('DB_PASS', '');
```

#### Step 5: Open in Browser
Visit in your web browser:
👉 `http://localhost/citycon_fees/`

---

### 📂 File Structure

| File | Description |
|------|-------------|
| `database.sql` | Complete MySQL schema with `students`, `fee_transactions`, and `users` tables with sample data. |
| `config.php` | Database PDO connection, institute constants, and PKR words/balance helper functions. |
| `auth.php` | Role access control middleware (Admin vs Staff permissions). |
| `login.php` | Sign In page with 1-click Quick Demo login buttons for Admin & Staff. |
| `signup.php` | Sign Up page to register new staff or admin with assigned role. |
| `logout.php` | User session termination and redirect. |
| `header.php` | Top institute branding, global search bar, user badge, and role-enforced nav bar. |
| `footer.php` | Institute footer with helpline and address. |
| `index.php` | Executive Dashboard with financial metrics, recent receipts, and course summary (Admin only). |
| `add_student.php` | **Requirement 1**: Student registration with agreed fee, discount, and initial installment (Admin & Staff). |
| `collect_fee.php` | **Requirement 2**: Fee collection page where cashier **only enters the current deposited amount** (Admin & Staff). |
| `student_history.php` | **Requirement 3**: Full student ledger maintaining all deposit installments chronologically (Admin only). |
| `receipt.php` | **Requirement 4**: Printable **Double Copy Voucher** (Student Copy & Office Copy) with scissors cut line and complete history of past deposits with remaining balance! |
| `defaulters.php` | Pending dues list with 1-click WhatsApp fee notice generator (Admin only). |
| `day_book.php` | Daily collection register with date filters (Today, Month, Custom Range) (Admin only). |
| `reports.php` | Monthly revenue collection reports and breakdown (Admin only). |

---

### 🔐 User Roles & Permissions

- **Admin Account**:
  - **Email**: `admin@citycon.edu.pk`
  - **Password**: `admin123`
  - **Permissions**: Full access to all modules (Dashboard, Add Student, Deposit Fee, Student Ledgers, Defaulters, Day Book, Monthly Reports, Database Management).

- **Staff Account**:
  - **Email**: `staff@citycon.edu.pk`
  - **Password**: `staff123`
  - **Permissions**: **Restricted** to **Deposit Fee** (`collect_fee.php`), **Add New Student** (`add_student.php`), and **Print Voucher** (`receipt.php`). Access to administrative reports and financial dashboards is strictly blocked.

---

### 🖨️ Printing Double Receipts
On `receipt.php`, click **Print Double Copy (A4)** or press `Ctrl + P`.  
The receipt is formatted with standard margins, high-contrast borders, and signature spaces.
