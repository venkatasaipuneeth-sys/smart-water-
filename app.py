from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.utils import secure_filename
import os
import sqlalchemy
from datetime import datetime

# Configuration
UPLOAD_FOLDER = 'static/img/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
DATABASE = 'postgresql://username:password@host:port/dbname'  # Update for MySQL if needed
SECRET_KEY = 'your_secret_key_here'  # Change this in production

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = SECRET_KEY

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

from flask_sqlalchemy import SQLAlchemy

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    visit_count = db.Column(db.Integer, default=0)
    last_login_date = db.Column(db.String(20))
    last_login_time = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class WaterData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_type = db.Column(db.String(50))
    water_type = db.Column(db.String(50))
    date = db.Column(db.String(20))
    time = db.Column(db.String(20))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    pin_id = db.Column(db.String(20))
    image_path = db.Column(db.String(200))
    temperature = db.Column(db.Float)
    pH = db.Column(db.Float)
    DO = db.Column(db.Float)
    TDS = db.Column(db.Float)
    chlorophyll = db.Column(db.Float)
    TA = db.Column(db.Float)
    DIC = db.Column(db.Float)

@app.before_request
@app.before_first_request
def setup():
    db.create_all()

from werkzeug.security import generate_password_hash, check_password_hash

# Registration route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username'].strip()
        email = request.form['email'].strip()
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        # Input validation
        if not username or not email or not password or not confirm_password:
            flash('All fields are required.', 'error')
            return render_template('register.html')
        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('register.html')
        if User.query.filter_by(username=username).first():
            flash('Username already exists.', 'error')
            return render_template('register.html')
        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'error')
            return render_template('register.html')
        password_hash = generate_password_hash(password)
        new_user = User(username=username, email=email, password_hash=password_hash)
        db.session.add(new_user)
        db.session.commit()
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    return render_template('register.html')

# Login route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['username'] = user.username
            # Update visit count and last login
            user.visit_count = (user.visit_count or 0) + 1
            now = datetime.now()
            user.last_login_date = now.strftime('%d-%m-%Y')
            user.last_login_time = now.strftime('%I:%M %p')
            db.session.commit()
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password', 'error')
    return render_template('login.html')

# Logout route
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# --- Dashboard and Data Entry ---
@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    return render_template('dashboard.html', user=user)

@app.route('/select_project', methods=['GET', 'POST'])
def select_project():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('select_project.html')

@app.route('/data_entry/<project>', methods=['GET', 'POST'])
def data_entry(project):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    if request.method == 'POST':
        # Not used, handled by /submit endpoint
        pass
    return render_template('data_entry.html', project=project)

@app.route('/submit', methods=['POST'])
def submit():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    data = request.form
    image = request.files.get('image')
    image_path = ''
    if image and image.filename != '':
        filename = secure_filename(image.filename)
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(image_path)
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO entries (
            project_type, water_type, date, time, latitude, longitude, pin_id, image_path,
            temperature, pH, DO, TDS, chlorophyll, TA, DIC
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('project_type', ''),
        data.get('water_type', ''),
        data.get('date', ''),
        data.get('time', ''),
        data.get('latitude', ''),
        data.get('longitude', ''),
        data.get('pin_id', ''),
        image_path,
        data.get('temperature', ''),
        data.get('pH', ''),
        data.get('DO', ''),
        data.get('TDS', ''),
        data.get('chlorophyll', ''),
        data.get('TA', ''),
        data.get('DIC', '')
    ))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# --- API for Bluetooth and Live Data (stub) ---
@app.route('/api/sensor_data')
def sensor_data():
    # This would be filled by JS via Bluetooth
    return jsonify({"temperature": 0, "pH": 0, "DO": 0, "TDS": 0, "chlorophyll": 0, "TA": 0, "DIC": 0})

if __name__ == '__main__':
    app.run(debug=True)
