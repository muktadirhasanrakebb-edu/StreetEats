-- Disable foreign key checks to allow dropping tables
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Create USERS table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('USER', 'VENDOR', 'ADMIN') NOT NULL DEFAULT 'USER',
    avatar VARCHAR(500) DEFAULT 'https://i.pravatar.cc/150?img=3',
    business_name VARCHAR(255), -- For Vendors
    food_type VARCHAR(255),     -- For Vendors
    status ENUM('approved', 'pending', 'denied') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create VENDORS table
-- Note: We include 'image' here because your frontend uses v.image
-- We DO NOT include 'rating' because your backend calculates it dynamically from reviews
CREATE TABLE vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lat DECIMAL(10, 8) DEFAULT 34.05223500,
    lng DECIMAL(11, 8) DEFAULT -118.24368300,
    image VARCHAR(500) DEFAULT 'https://placehold.co/600x400?text=Street+Food',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create MENU_ITEMS table
CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500) DEFAULT 'https://placehold.co/400x300?text=Yummy+Food',
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- 4. Create REVIEWS table
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vendor_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- =============================================
-- DUMMY DATA INSERTION
-- =============================================

-- 1. Insert Users
INSERT INTO users (id, name, email, password, role, business_name, food_type, status) VALUES
(1, 'Admin User', 'admin@email.com', 'password123', 'ADMIN', NULL, NULL, 'approved'),
(2, 'John Vendor', 'john@vendor.com', 'password123', 'VENDOR', 'Johns Tacos', 'Mexican', 'approved'),
(3, 'Alice User', 'alice@email.com', 'password123', 'USER', NULL, NULL, 'approved');

-- 2. Insert Vendor Profile for John
INSERT INTO vendors (id, user_id, lat, lng, image) VALUES
(1, 2, 34.0522, -118.2437, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80');

-- 3. Insert Menu Item
INSERT INTO menu_items (vendor_id, name, description, price, image) VALUES
(1, 'Spicy Taco', 'Beef taco with hot sauce', 3.50, 'https://placehold.co/400x300?text=Taco');

-- 4. Insert Review
INSERT INTO reviews (user_id, vendor_id, rating, comment) VALUES
(3, 1, 5, 'Amazing tacos!');