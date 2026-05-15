from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "mmu_secret_key"

# 1. Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/user_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 2. Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(255))
    role = db.Column(db.String(20)) # 'Student' or 'Lecturer'
    security_question = db.Column(db.String(255))
    security_answer = db.Column(db.String(255))
    office_location = db.Column(db.String(255))

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_name = db.Column(db.String(255))
    lecturer_name = db.Column(db.String(255))
    appointment_date = db.Column(db.String(255))
    appointment_time = db.Column(db.String(255))
    status = db.Column(db.String(50))
    reason = db.Column(db.Text)
    cancelled_by = db.Column(db.String(50))

class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100))
    rating = db.Column(db.String(50))
    comment = db.Column(db.Text)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100))
    message = db.Column(db.Text)
    category = db.Column(db.String(50))
    created_at = db.Column(db.String(20))

class BlockedSlot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lecturer_name = db.Column(db.String(255))
    start_date = db.Column(db.String(50))
    end_date = db.Column(db.String(50))
    start_time = db.Column(db.String(50))
    end_time = db.Column(db.String(50))
    days = db.Column(db.String(255))

# 3. Routes
@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    # If user is already logged in, redirect them immediately
    if 'username' in session:
        if session.get('role') == 'Lecturer':
            return redirect(url_for('manage_lecturer'))
        return redirect(url_for('book'))

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            
            if user.role == 'Lecturer':
                return redirect(url_for('manage_lecturer'))
            return redirect(url_for('book'))
        
        flash("Invalid email or password.")
        return redirect(url_for('login'))

    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')
    question = request.form.get('security_question')
    answer = request.form.get('security_answer')

    if User.query.filter_by(email=email).first():
        flash("Email already registered!")
        return render_template('index.html', active_form='register')

    hashed_pw = generate_password_hash(password)
    new_user = User(username=name, email=email, password=hashed_pw, 
                    security_question=question, security_answer=answer, role='Student')
    
    db.session.add(new_user)
    db.session.commit()
    flash("Registration successful! Please login.")
    return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.clear()
    flash("Logout successful!")
    return redirect(url_for('login'))

@app.route('/forgot', methods=['GET', 'POST'])
def forgot_password():
    step = 1
    if request.method == 'POST':
        form_step = request.form.get('form_step')

        if form_step == '1':
            email = request.form.get('email')
            user = User.query.filter_by(email=email).first()
            if user:
                session['reset_email'] = email
                session['temp_question'] = user.security_question
                step = 2
            else:
                flash("Email not found!")
        
        elif form_step == '2':
            email = session.get('reset_email')
            answer = request.form.get('answer')
            user = User.query.filter_by(email=email).first()
            if user and user.security_answer == answer:
                step = 3
            else:
                flash("Incorrect answer!")
                step = 2

        elif form_step == '3':
            email = session.get('reset_email')
            new_pw = request.form.get('new_password')
            user = User.query.filter_by(email=email).first()
            if user:
                user.password = generate_password_hash(new_pw)
                db.session.commit()
                session.pop('reset_email', None)
                flash("Password updated! Please login.")
                return redirect(url_for('login'))
                
    return render_template('forgot.html', step=step)

# --- Student Routes ---
@app.route('/book')
def book():
    if 'username' not in session: return redirect(url_for('login'))
    lecturers = User.query.filter_by(role='Lecturer').all() 
    return render_template('book.html', lecturers=lecturers)

@app.route('/appointments')
def appointments():
    if 'username' not in session: return redirect(url_for('login'))
    user_appointments = Appointment.query.filter_by(student_name=session['username']).all()
    return render_template('appointments.html', user_appointments=user_appointments)

# --- Lecturer Routes ---
@app.route('/lecturer/manage')
def manage_lecturer():
    if 'username' not in session or session.get('role') != 'Lecturer':
        return redirect(url_for('login'))
    user = User.query.filter_by(username=session['username']).first()
    return render_template('managelecturer.html', lecturer_office=user.office_location)

# (Add your other routes like /notification, /feedback, etc. below here)

if __name__ == '__main__':
    app.run(debug=True)