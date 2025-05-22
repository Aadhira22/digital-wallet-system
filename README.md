# digital-wallet-system

A secure digital wallet system built with **Node.js**, **Express**, and **MongoDB**, supporting cash management, fraud detection, and admin reporting features.

---

## 📋 Project Overview

This project is a full-featured digital wallet platform that allows users to:

- Register and log in securely
- Deposit and withdraw virtual cash
- Transfer funds to other users
- View transaction history
- Be protected against fraud with basic rule-based detection
- Automatically handle deleted accounts and data retention

---

## 🔐 1. User Authentication & Session Management

- Passwords hashed using **bcrypt**
- Users authenticate via **JWT tokens**
- All protected routes require a valid token using an `auth` middleware
- Soft-deleted users are **prevented from logging in**
- Accounts are **auto-purged after 90 days** of deletion (with related `deposit`/`withdraw` transactions)

---

## 💰 2. Wallet Operations

- Users can **deposit** or **withdraw** virtual cash in `USD` or `INR`
- Users can **transfer funds** to other users using email
- Currency abstraction supported 
- Maintains **transaction history** for each user
- Supports **viewing balances** by currency

---

## 🔄 3. Transaction Processing & Validation

- All financial actions are **validated**:
  - Prevents negative or zero amounts
  - Prevents withdrawals exceeding available balance
- Transfers are **atomic** using Mongoose sessions
- Currency conversion validation logic in transfers

---

## 🚨 4. Basic Fraud Detection Logic

- Flags users for:
  - **Large withdrawals or transfers**
  - **Frequent transfers within 1 minute**
- Flags are stored on user objects
- Withdrawals or transfers over threshold are **blocked**, not just flagged
- Adds mock logs for suspicious activity

---

## ⚙️ 5. Admin & Reporting APIs

- View all **flagged users**
- See **total balances** across all users (USD & INR)
- List **top users by wallet balance**
- List **top users by transaction volume**
- Transactions are soft-deleted when users delete their accounts

---

## 🗑️ Soft Delete & Retention

- Users can **soft delete** their account (`isDeleted: true`)
- System auto-cleans **users + their withdraw/deposit transactions** after 90 days on login
- No restoration option available (as per project scope)

---

## 🧪 Testing

- All endpoints tested using **Postman**
- JWT-based auth headers used for authenticated routes

---

## 🚀 Tech Stack

- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **JWT** for session handling
- **bcrypt** for password hashing
- **Postman** for API testing

---


