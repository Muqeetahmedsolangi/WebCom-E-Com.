# WebCom - E-Commerce Platform

WebCom is a robust and scalable e-commerce platform built with **Node.js**, **Express**, and **Sequelize ORM**. It provides a comprehensive suite of features for **customers**, **sellers**, and **administrators**, making it suitable for any online retail business.

---

## 🚀 Features

* **User Management**: Registration, authentication (JWT), and profile management
* **Product Catalog**: Browse, search, and filter products by categories
* **Admin Dashboard**: Admin interface for managing products, categories, users, and orders
* **Reviews & Comments**: Comment system with review and approval workflow
* **Order Management**: Cart functionality and order processing

---

## 🛠 Tech Stack

* **Backend**: Node.js, Express.js
* **Database**: SQL (MySQL, PostgreSQL, SQLite, etc.) via Sequelize ORM
* **Authentication**: JWT (JSON Web Tokens)
* **Documentation**: Swagger UI
* **File Storage**: Local file system (with future cloud storage support)

---

## 📦 Prerequisites

* Node.js (v14 or higher)
* pnpm or npm
* MySQL, PostgreSQL, or any SQL-compatible database supported by Sequelize

---

## ⚙️ Installation

```bash
# Clone the repository
git clone https://github.com/your-username/webcom.git
cd webcom

# Install dependencies
pnpm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory and set up the following variables:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=webcom_db
JWT_SECRET=your_jwt_secret
```

---

## 🧱 Database Setup

```bash
# Run migrations
pnpm sequelize db:migrate

# Seed initial data
pnpm sequelize db:seed:all
```

### Sequelize Commands (with pnpm)

| Task                 | Command                                                     |
| -------------------- | ----------------------------------------------------------- |
| Generate a migration | `pnpm sequelize migration:generate --name <migration-name>` |
| Apply all migrations | `pnpm sequelize db:migrate`                                 |
| Undo last migration  | `pnpm sequelize db:migrate:undo`                            |
| Undo all migrations  | `pnpm sequelize db:migrate:undo:all`                        |
| Generate a seeder    | `pnpm sequelize seed:generate --name <seeder-name>`         |
| Run all seeders      | `pnpm sequelize db:seed:all`                                |
| Undo last seeder     | `pnpm sequelize db:seed:undo`                               |
| Undo all seeders     | `pnpm sequelize db:seed:undo:all`                           |

---

## 🧪 Running the Application

### Development Mode

```bash
pnpm run dev
```

### Production Mode

```bash
pnpm run build
pnpm start
```

---

## 📘 API Documentation

Swagger UI available at: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

---

## 🔑 Key API Endpoints

### Public Routes

* `GET /api/v1/products`
* `GET /api/v1/categories`
* `POST /api/v1/auth/login`
* `POST /api/v1/auth/register`

### User Routes (Authentication Required)

* `GET /api/v1/user/profile`
* `POST /api/v1/user/orders`
* `POST /api/v1/user/comments`

### Admin Routes (Admin Access Required)

* `GET /api/v1/admin/dashboard`
* `POST /api/v1/admin/products`
* `DELETE /api/v1/admin/users/:id`

---

## 🗂 Project Structure

```
webcom/
├── controllers/     # Request handlers
├── models/          # Sequelize models and associations
├── routes/          # API route definitions
├── services/        # Business logic
├── middlewares/     # JWT auth, error handling
├── config/          # DB and app configurations
├── seeders/         # Seeder files for initial data
└── migrations/      # Migration files
```

---

## 🔁 Development Workflow

```bash
# Create migration
pnpm sequelize migration:generate --name add-new-feature

# Run migrations
pnpm sequelize db:migrate

# Undo last migration
pnpm sequelize db:migrate:undo

# Create seeder
pnpm sequelize seed:generate --name seed-initial-data

# Run seeders
pnpm sequelize db:seed:all
```

---

## 🚀 Deployment

1. Set environment variables for production
2. Run migrations: `pnpm sequelize db:migrate`
3. Start server: `pnpm start`

---

## 🤝 Contributing

1. Fork the project
2. Create a new branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Add new feature"`
4. Push to branch: `git push origin feature-name`
5. Open a pull request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

Happy Coding 💻✨
