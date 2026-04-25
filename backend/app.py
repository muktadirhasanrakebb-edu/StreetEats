from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains


DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'streeteats'
}


def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None


# ==========================================
# AUTHENTICATION ROUTES
# ==========================================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')  # In production, hash this!
    role = data.get('role', 'USER')

    # Vendor specific fields
    business_name = data.get('businessName')
    food_type = data.get('foodType')
    # Vendors default to pending, Users/Admins default to approved
    status = 'pending' if role == 'VENDOR' else 'approved'

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # Check if email exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"message": "Email already registered"}), 409

        # Insert User
        cursor.execute(
            "INSERT INTO users (name, email, password, role, business_name, food_type, status) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (name, email, password, role, business_name, food_type, status)
        )
        user_id = cursor.lastrowid

        # If Vendor, create profile entry immediately
        if role == 'VENDOR':
            cursor.execute("INSERT INTO vendors (user_id) VALUES (%s)", (user_id,))

        conn.commit()
        return jsonify({"message": "Registration successful", "role": role}), 201
    except Error as e:
        print(f"Register Error: {e}")
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))
        user = cursor.fetchone()

        if user:
            # If user is a vendor, fetch their VENDOR ID to prevent ID mismatch errors
            vendor_id = None
            if user['role'] == 'VENDOR':
                cursor.execute("SELECT id FROM vendors WHERE user_id = %s", (user['id'],))
                vendor_record = cursor.fetchone()
                if vendor_record:
                    vendor_id = str(vendor_record['id'])

            # Return user info
            user_data = {
                "id": str(user['id']),
                "name": user['name'],
                "email": user['email'],
                "avatar": user['avatar'],
                "status": user['status'],
                "businessName": user['business_name'],
                "vendorId": vendor_id  # Send real vendor ID to frontend
            }
            return jsonify({"message": "Login successful", "user": user_data, "role": user['role']}), 200
        else:
            return jsonify({"message": "Invalid credentials"}), 401
    finally:
        cursor.close()
        conn.close()


# ==========================================
# HELPER ROUTES
# ==========================================

@app.route('/api/vendor-lookup/<int:user_id>', methods=['GET'])
def get_vendor_id(user_id):
    """Finds the Vendor ID associated with a User ID."""
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "DB Error"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM vendors WHERE user_id = %s", (user_id,))
        vendor = cursor.fetchone()
        if vendor:
            return jsonify({"vendorId": str(vendor['id'])}), 200
        else:
            return jsonify({"message": "Vendor not found"}), 404
    finally:
        cursor.close()
        conn.close()


# ==========================================
# VENDOR ROUTES
# ==========================================

@app.route('/api/vendors', methods=['GET'])
def get_vendors():
    conn = get_db_connection()
    if not conn:
        return jsonify([]), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # FIX: We calculate average rating dynamically using a subquery.
        # This prevents the "Unknown column 'v.rating'" error.
        query = """
            SELECT v.id, v.user_id, v.lat, v.lng, v.image, 
                   u.name, u.business_name, u.food_type, u.status,
                   (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE vendor_id = v.id) as rating
            FROM vendors v
            JOIN users u ON v.user_id = u.id
            WHERE u.status = 'approved'
        """
        cursor.execute(query)
        vendors = cursor.fetchall()

        # Format for frontend
        result = []
        for v in vendors:
            # CRITICAL FIX: Handle NULL coordinates safely
            # If a new vendor hasn't set a location, default to LA center to prevent crash
            lat = float(v['lat']) if v['lat'] is not None else 34.0522
            lng = float(v['lng']) if v['lng'] is not None else -118.2437

            # Handle potential NULL rating from calculation
            rating = float(v['rating']) if v['rating'] is not None else 0.0

            result.append({
                "id": str(v['id']),
                "user_id": str(v['user_id']),
                "name": v['name'],
                "businessName": v['business_name'],
                "foodType": v['food_type'],
                "coords": {"lat": lat, "lng": lng},
                "rating": rating,
                "image": v['image']
            })

        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching vendors: {e}")
        return jsonify([]), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/vendors/<int:vendor_id>/menu', methods=['GET', 'POST'])
def vendor_menu(vendor_id):
    conn = get_db_connection()
    if not conn:
        return jsonify([]), 500
    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("SELECT * FROM menu_items WHERE vendor_id = %s", (vendor_id,))
            items = cursor.fetchall()
            return jsonify([
                {
                    "id": str(i['id']),
                    "name": i['name'],
                    "description": i['description'],
                    "price": float(i['price']),
                    "image": i['image']
                } for i in items
            ]), 200

        elif request.method == 'POST':
            data = request.get_json()
            cursor.execute(
                "INSERT INTO menu_items (vendor_id, name, description, price) VALUES (%s, %s, %s, %s)",
                (vendor_id, data['name'], data['description'], data['price'])
            )
            conn.commit()

            # Return the created item
            new_id = cursor.lastrowid
            cursor.execute("SELECT * FROM menu_items WHERE id = %s", (new_id,))
            new_item = cursor.fetchone()
            return jsonify({
                "id": str(new_item['id']),
                "name": new_item['name'],
                "description": new_item['description'],
                "price": float(new_item['price']),
                "image": new_item['image']
            }), 201

    except Error as e:
        print(e)
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/vendors/<int:vendor_id>/reviews', methods=['GET', 'POST', 'OPTIONS'])
def vendor_reviews(vendor_id):
    # Handle Preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        return '', 200

    conn = get_db_connection()
    if not conn:
        return jsonify([]), 500
    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            query = """
                SELECT r.*, u.name as user_name, u.avatar as user_avatar
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.vendor_id = %s
                ORDER BY r.created_at DESC
            """
            cursor.execute(query, (vendor_id,))
            reviews = cursor.fetchall()
            return jsonify([
                {
                    "id": str(r['id']),
                    "userId": str(r['user_id']),
                    "userName": r['user_name'],
                    "userAvatar": r['user_avatar'],
                    "rating": r['rating'],
                    "comment": r['comment'],
                    "date": r['created_at']
                } for r in reviews
            ]), 200

        elif request.method == 'POST':
            data = request.get_json()
            user_id = data.get('user_id')
            rating = data.get('rating')
            comment = data.get('comment')

            if not user_id or not rating:
                return jsonify({"message": "Missing user_id or rating"}), 400

            cursor.execute(
                "INSERT INTO reviews (user_id, vendor_id, rating, comment) VALUES (%s, %s, %s, %s)",
                (user_id, vendor_id, rating, comment)
            )
            conn.commit()

            return jsonify({"message": "Review added successfully"}), 201

    except Error as e:
        print("DB Error:", e)
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ==========================================
# USER ROUTES
# ==========================================

@app.route('/api/users/<int:user_id>/reviews', methods=['GET'])
def user_reviews(user_id):
    conn = get_db_connection()
    if not conn:
        return jsonify([]), 500
    cursor = conn.cursor(dictionary=True)
    try:
        # Get reviews written BY this user
        query = """
            SELECT r.*, u.business_name as vendor_name
            FROM reviews r
            JOIN vendors v ON r.vendor_id = v.id
            JOIN users u ON v.user_id = u.id
            WHERE r.user_id = %s
        """
        cursor.execute(query, (user_id,))
        reviews = cursor.fetchall()
        return jsonify([
            {
                "id": str(r['id']),
                "userName": r['vendor_name'] or "Unknown Vendor",
                "rating": r['rating'],
                "comment": r['comment'],
                "date": r['created_at']
            } for r in reviews
        ]), 200
    finally:
        cursor.close()
        conn.close()


# ==========================================
# ADMIN ROUTES
# ==========================================

@app.route('/api/admin/vendor-requests', methods=['GET'])
def admin_requests():
    conn = get_db_connection()
    if not conn:
        return jsonify([]), 500
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, name, email, business_name, created_at FROM users WHERE role = 'VENDOR' AND status = 'pending'")
        requests = cursor.fetchall()
        return jsonify([
            {
                "id": str(r['id']),
                "name": r['name'],
                "email": r['email'],
                "businessName": r['business_name'],
                "date": r['created_at']
            } for r in requests
        ]), 200
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/vendor-requests/<int:user_id>', methods=['POST'])
def admin_action(user_id):
    data = request.get_json()
    action = data.get('action')

    status = 'approved' if action == 'approve' else 'denied'

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database error"}), 500
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET status = %s WHERE id = %s", (status, user_id))

        # If approving, ensure a vendor profile exists
        if status == 'approved':
            cursor.execute("SELECT id FROM vendors WHERE user_id = %s", (user_id,))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO vendors (user_id) VALUES (%s)", (user_id,))

        conn.commit()
        return jsonify({"message": f"Vendor {status} successfully"}), 200
    except Error as e:
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=5000)