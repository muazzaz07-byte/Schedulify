from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = "mmu_secret_key" # Keeps your login sessions secure

# 1. Connect Flask to your XAMPP MySQL database
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/user_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 2. Define the Appointment table (matches your MySQL structure)
class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_name = db.Column(db.String(255))
    lecturer_name = db.Column(db.String(255))
    appointment_date = db.Column(db.String(255))
    appointment_time = db.Column(db.String(255))
    status = db.Column(db.String(50))

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/login')
def index():
    # If user is already logged in, skip the login page
    if 'username' in session:
        if session.get('role') == 'Lecturer':
            return redirect(url_for('manage_lecturer'))
        return redirect(url_for('book'))
    return render_template('index.html')


#------------------Login--------------------------
@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')
    user = User.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        session['username'] = user.username
        return redirect(url_for('book'))
    return "Invalid credentials"

#------------------Book--------------------------
# 3. PAGE ROUTES
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/book')
def book():
    if 'username' not in session:
        return redirect(url_for('index'))
    
    # This replaces your PHP $conn->query
    # It fetches all users who are Lecturers
    lecturers = User.query.filter_by(role='Lecturer').all() 
    
    return render_template('book.html', lecturers=lecturers)

# 4. BOOKING LOGIC (Replaces booking_confirm.php)
@app.route('/booking_confirm', methods=['POST'])
def confirm_booking():
    new_booking = Appointment(
        student_name=session.get('username'),
        lecturer_name=request.form.get('lecturer_name'),
        appointment_date=request.form.get('appointment_date'),
        appointment_time=request.form.get('appointment_time'),
        status='Confirmed'
    )
    db.session.add(new_booking)
    db.session.commit()
    return "success"

if __name__ == '__main__':
    app.run(debug=True)

#------------------Manage Action--------------------------
@app.route('/manage_action', methods=['POST'])
def manage_action():
    # Your logic for blocking/cancelling goes here
    db.session.commit()
    return jsonify({"status": "success"})

#
@app.route('/lecturer/my-appointments')
def appointment_lecturer():
    if 'username' not in session:
        return redirect(url_for('index'))
    
    lecturer_name = session.get('username')
    
    # Fetch only confirmed appointments for THIS lecturer
    appointments = Appointment.query.filter_by(
        lecturer_name=lecturer_name, 
        status='Confirmed'
    ).all()
    
    return render_template('appointmentlecturer.html', appointments=appointments)

#------------------ Manage Appointments--------------------------
@app.route('/appointments')
def appointments():
    if 'username' not in session:
        return redirect(url_for('index'))
    
    student_name = session.get('username')
    
    # Fetch all appointments for the logged-in student
    # user_appointments is the variable name used in the HTML Jinja loop
    user_appointments = Appointment.query.filter_by(student_name=student_name).all()
    
    return render_template('appointments.html', user_appointments=user_appointments)

@app.route('/lecturer/block', methods=['GET', 'POST'])
def block_lecturer():
    if 'username' not in session or session.get('role') != 'Lecturer':
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        # Logic to save the block range to your database goes here
        # You would get start_date, end_date, etc. from request.form
        return jsonify({"status": "success"})

    return render_template('blocklecturer.html')

@app.route('/booked_slot')
def get_booked_slots():
    # Get the lecturer name from the URL (e.g., /booked_slot?lecturer=Sir Naufal)
    lecturer_name = request.args.get('lecturer')
    
    # Query the database for appointments for this lecturer
    # This is the "SQLAlchemy" version of your SELECT query
    results = Appointment.query.filter_by(lecturer_name=lecturer_name).all()
    
    booked = []
    for row in results:
        # Create the same "Date|Time" key your JavaScript expects
        key = f"{row.appointment_date}|{row.appointment_time}"
        booked.append(key)
    
    # Return the list as JSON
    return jsonify(booked)

@app.route('/booking_confirm', methods=['POST'])
def booking_confirm():
    # 1. Check if user is logged in (session management)
    student_name = session.get('username', 'Guest User')
    
    # 2. Get data from the POST request (replaces $_POST)
    lecturer_name = request.form.get('lecturer_name')
    app_date = request.form.get('appointment_date')
    app_time = request.form.get('appointment_time')

    try:
        # 3. Create a new database entry (replaces INSERT INTO)
        new_appointment = Appointment(
            student_name=student_name,
            lecturer_name=lecturer_name,
            appointment_date=app_date,
            appointment_time=app_time,
            status='Confirmed'
        )
        
        # 4. Save to MySQL
        db.session.add(new_appointment)
        db.session.commit()
        
        return "success"
        
    except Exception as e:
        return f"Database Error: {str(e)}"
    
    # 1. Route to show the page
@app.route('/cancellation')
def cancellation():
    if 'username' not in session:
        return redirect(url_for('index'))
    
    # Fetch confirmed appointments for the logged-in student
    user_appointments = Appointment.query.filter_by(
        student_name=session.get('username'), 
        status='Confirmed'
    ).all()
    
    return render_template('cancellation.html', user_appointments=user_appointments)

# 2. Route to handle the cancellation logic (replaces your confirmDelete JS logic)
@app.route('/process_cancellation', methods=['POST'])
def process_cancellation():
    app_id = request.form.get('appointment_id')
    reason = request.form.get('reason')
    
    appointment = Appointment.query.get(app_id)
    if appointment:
        appointment.status = 'Cancelled'
        appointment.reason = reason
        appointment.cancelled_by = 'Student'
        db.session.commit()
        return "success"
    return "error"

# 1. Add a Feedback Model at the top of app.py
class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100))
    rating = db.Column(db.String(50))
    comment = db.Column(db.Text)

# 2. Route to show the feedback page
@app.route('/feedback')
def feedback():
    if 'username' not in session:
        return redirect(url_for('index'))
    return render_template('feedback.html')

# 3. Route to handle the submission
@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    if 'username' not in session:
        return "Not logged in", 403
        
    rating = request.form.get('rating')
    comment = request.form.get('comment')

    new_feedback = Feedback(
        username=session['username'],
        rating=rating,
        comment=comment
    )
    
    db.session.add(new_feedback)
    db.session.commit()
    return "success"

@app.route('/lecturer/feedback')
def feedback_lecturer():
    if 'username' not in session or session.get('role') != 'Lecturer':
        return redirect(url_for('index'))
    return render_template('feedbacklecturer.html')

from werkzeug.security import generate_password_hash
from flask import flash

@app.route('/forgot', methods=['GET', 'POST'])
def forgot_password():
    step = 1
    if request.method == 'POST':
        form_step = request.form.get('form_step')

        # STEP 1: Check Email
        if form_step == '1':
            email = request.form.get('email')
            user = User.query.filter_by(email=email).first()
            if user:
                session['reset_email'] = email
                session['temp_question'] = user.security_question
                step = 2
            else:
                flash("Email not found!")
                step = 1

        # STEP 2: Verify Answer
        elif form_step == '2':
            email = session.get('reset_email')
            answer = request.form.get('answer')
            user = User.query.filter_by(email=email).first()
            
            # Use your security logic (e.g., matching hashed or plain text)
            if user and user.security_answer == answer:
                step = 3
            else:
                flash("Incorrect answer!")
                step = 2

        # STEP 3: Update Password
        elif form_step == '3':
            email = session.get('reset_email')
            new_pw = request.form.get('new_password')
            user = User.query.filter_by(email=email).first()
            
            if user:
                user.password = generate_password_hash(new_pw)
                db.session.commit()
                session.pop('reset_email', None)
                session.pop('temp_question', None)
                flash("Password updated! Please login.")
                return redirect(url_for('index'))
                
    return render_template('forgot.html', step=step)

@app.route('/lecturer/history')
def history_lecturer():
    if 'username' not in session or session.get('role') != 'Lecturer':
        return redirect(url_for('index'))
    
    lecturer_name = session.get('username')
    
    # Fetch all past appointments for this lecturer
    # We look for status 'Completed' or 'Cancelled'
    history_data = Appointment.query.filter(
        Appointment.lecturer_name == lecturer_name,
        Appointment.status.in_(['Completed', 'Cancelled'])
    ).all()
    
    return render_template('historylecturer.html', history=history_data)

from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash

# --- LOGOUT ROUTE ---
@app.route('/logout')
def logout():
    session.clear()
    flash("Logout successful!")
    return redirect(url_for('index'))

# --- LOGIN ROUTE ---
@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')
    
    user = User.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        session['username'] = user.username
        session['role'] = user.role
        
        # Redirect based on role
        if user.role == 'Lecturer':
            return redirect(url_for('manage_lecturer'))
        return redirect(url_for('book'))
    
    flash("Invalid email or password.")
    return redirect(url_for('index'))

# --- REGISTER ROUTE ---
@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')
    question = request.form.get('security_question')
    answer = request.form.get('security_answer')

    # Check if email exists
    if User.query.filter_by(email=email).first():
        flash("Email already registered!")
        return render_template('index.html', active_form='register', reg_data=request.form)

    # Hash password and save user
    hashed_pw = generate_password_hash(password)
    new_user = User(username=name, email=email, password=hashed_pw, 
                    security_question=question, security_answer=answer, role='Student')
    
    db.session.add(new_user)
    db.session.commit()
    
    flash("Registration successful! Please login.")
    return redirect(url_for('index'))

@app.route('/lecturer/manage')
def manage_lecturer():
    if 'username' not in session or session.get('role') != 'Lecturer':
        return redirect(url_for('index'))
    
    # Get the logged-in lecturer's office from the database
    user = User.query.filter_by(username=session['username']).first()
    
    return render_template('managelecturer.html', 
                           lecturer_office=user.office_location)

# 1. Add a Notification Model to app.py
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100))
    message = db.Column(db.Text)
    category = db.Column(db.String(50)) # 'alert', 'update', or 'reminder'
    created_at = db.Column(db.String(20))

# 2. Add the route
@app.route('/notification')
def notification():
    if 'username' not in session:
        return redirect(url_for('index'))
    
    # Get notifications for this specific user, newest first
    user_notifs = Notification.query.filter_by(username=session['username']).order_by(Notification.id.desc()).all()
    
    return render_template('notification.html', notifications=user_notifs)

@app.route('/lecturer/notification')
def notification_lecturer():
    if 'username' not in session or session.get('role') != 'Lecturer':
        return redirect(url_for('index'))
    
    # Fetch notifications specifically for this lecturer
    # We use .order_by(Notification.id.desc()) to show the newest first
    lecturer_notifs = Notification.query.filter_by(
        username=session['username']
    ).order_by(Notification.id.desc()).all()
    
    return render_template('notificationlecturer.html', notifications=lecturer_notifs)

from werkzeug.security import generate_password_hash, check_password_hash

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    
    user = User.query.get(session['user_id'])
    active_page = 'page-profile'

    if request.method == 'POST':
        action = request.form.get('action')
        
        # --- Handle Username Update ---
        if action == 'update_username':
            new_name = request.form.get('username')
            user.username = new_name
            db.session.commit()
            flash('Username updated successfully!', 'success')
            active_page = 'page-profile'

        # --- Handle Password Change ---
        elif action == 'update_password':
            current = request.form.get('current_password')
            new_p = request.form.get('new_password')
            
            if check_password_hash(user.password, current):
                user.password = generate_password_hash(new_p)
                db.session.commit()
                flash('Password changed successfully!', 'success')
            else:
                flash('Incorrect current password.', 'error')
                active_page = 'page-password'

    return render_template('profile.html', user=user, active_page=active_page)

@app.route('/lecturer/profile', methods=['GET', 'POST'])
def profile_lecturer():
    if 'user_id' not in session or session.get('role') != 'Lecturer':
        return redirect(url_for('index'))
    
    user = User.query.get(session['user_id'])
    active_page = 'page-profile'

    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'update_office':
            user.office_location = request.form.get('office_location')
            db.session.commit()
            flash('Office location updated successfully!', 'success')
            active_page = 'page-profile'
            
        elif action == 'update_username':
            user.username = request.form.get('username')
            db.session.commit()
            flash('Username updated!', 'success')
            active_page = 'page-profile'

    return render_template('profilelecturer.html', user=user, active_page=active_page)

@app.route('/lecturer/unblock')
def unblock_lecturer():
    if 'username' not in session or session.get('role') != 'Lecturer':
        return redirect(url_for('index'))
    
    # Assuming you have a BlockedSlot model
    # Fetch slots specifically for this lecturer
    blocked_slots = BlockedSlot.query.filter_by(lecturer_name=session['username']).all()
    
    return render_template('unblocklecturer.html', blocked_slots=blocked_slots)

@app.route('/execute_unblock', methods=['POST'])
def execute_unblock_route():
    slot_id = request.form.get('slot_id')
    slot = BlockedSlot.query.get(slot_id)
    if slot:
        db.session.delete(slot)
        db.session.commit()
        return "success"
    return "error"