import re
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from sqlalchemy import case, or_, and_

app = Flask(__name__)

# --- DATABASE AND SECURITY CONFIGURATION ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///schedulify.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'schedulify_super_secret_key_2026'

db = SQLAlchemy(app)

# --- DATABASE MODELS ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    security_question = db.Column(db.String(255), nullable=True)
    security_answer = db.Column(db.String(255), nullable=True)
    office_location = db.Column(db.String(255), nullable=True, default=None)
    
    slots_created = db.relationship('ScheduleSlot', backref='lecturer', lazy=True)
    bookings = db.relationship('Booking', backref='student', lazy=True)


class ScheduleSlot(db.Model):
    __tablename__ = 'schedule_slot'
    id = db.Column(db.Integer, primary_key=True)
    lecturer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_time = db.Column(db.DateTime, nullable=False) 
    is_available = db.Column(db.Boolean, default=True, nullable=False)
    status = db.Column(db.String(30), default='AVAILABLE', nullable=False)


class Booking(db.Model):
    __tablename__ = 'booking'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey('schedule_slot.id'), nullable=False)
    booking_date = db.Column(db.DateTime, default=datetime.utcnow)

    student_name = db.Column(db.String(100), nullable=True)
    appointment_day = db.Column(db.String(20), nullable=True)
    appointment_date = db.Column(db.String(30), nullable=True)   
    appointment_time = db.Column(db.String(20), nullable=True)    

    status = db.Column(db.String(50), default='CONFIRMED') 
    cancel_reason = db.Column(db.Text, nullable=True)

    slot = db.relationship('ScheduleSlot', backref=db.backref('booking_slots', lazy=True))


class Feedback(db.Model):
    __tablename__ = 'feedback'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rating = db.Column(db.String(50), nullable=False)      
    category = db.Column(db.String(50), nullable=False)    
    reason = db.Column(db.Text, nullable=False)            
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('User', backref=db.backref('feedbacks', lazy=True))


# --- UPDATE THIS MODEL INSIDE THE DATABASE SCHEMA AREA OF app.py ---
class SystemNotification(db.Model):
    __tablename__ = 'system_notification'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) 
    # FIXED: Added tracking attribute flags to separate user workspaces cleanly
    is_for_lecturer = db.Column(db.Boolean, default=False, nullable=False)
    lecturer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    type = db.Column(db.String(50), default='cancelled')                        
    dot_color = db.Column(db.String(20), default='#ff4d4d')                     
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# --- SYSTEM NAVIGATION WELCOME ROUTE ---
@app.route('/')
def welcome(): 
    return render_template('welcome.html')


#---------------------------------------------------------------------------------LOGIN---------------------------------
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and user.password == password:
            session.update({'user_id': user.id, 'user_name': user.name, 'role': user.role})
            
            if user.role == 'lecturer':
                return redirect(url_for('manage')) 
            else:
                return redirect(url_for('book'))   
            
        flash("Invalid credentials. Please check your email and password.")
        return render_template('login.html', email=email)
        
    return render_template('login.html', email="")


#-------------------------------------------------------------------------------REGISTER---------------------------------
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        security_q = request.form.get('security_question')
        security_a = request.form.get('security_answer')

        if not re.match(r"^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", password):
            flash("Password too weak. Must be 8+ chars, with Capital, Number, and Symbol.")
            return render_template('register.html', name=name, email=email, password="", security_q=security_q, security_a=security_a)

        role = 'lecturer' if email.endswith('@mmu.edu.my') else 'student' if email.endswith('@student.mmu.edu.my') else None
        if not role:
            flash("Registration Denied! You must use an official MMU email domain account: '@student.mmu.edu.my' (Students) or '@mmu.edu.my' (Lecturers).")
            return render_template('register.html', name=name, email="", password=password, security_q=security_q, security_a=security_a)
        
        if User.query.filter_by(email=email).first():
            flash("Email already registered.")
            return render_template('register.html', name=name, email="", password=password, security_q=security_q, security_a=security_a)

        new_user = User(name=name, email=email, password=password, role=role, 
                        security_question=security_q, security_answer=security_a)
        db.session.add(new_user)
        db.session.commit()
        
        session.update({'user_id': new_user.id, 'user_name': new_user.name, 'role': new_user.role})
        
        if new_user.role == 'lecturer':
            return redirect(url_for('manage'))
        else:
            return redirect(url_for('book'))

    return render_template('register.html', name="", email="", password="", security_q="", security_a="")
        

#-------------------------------------------------------------------------------FORGOT PASSWORD---------------------------------
@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot():
    if request.method == 'POST':
        email = request.form.get('email')
        security_q = request.form.get('security_question')
        security_a = request.form.get('security_answer')
        
        user = User.query.filter_by(email=email).first()
        if not user:
            flash("Invalid email address. No account found.")
            return render_template('forgot.html', email="", security_q=security_q, security_a=security_a)
            
        if user.security_question != security_q:
            flash("Incorrect security question selected for this account.")
            return render_template('forgot.html', email=email, security_q="", security_a=security_a)
            
        if not user.security_answer or user.security_answer.strip().lower() != security_a.strip().lower():
            flash("Incorrect security answer.")
            return render_template('forgot.html', email=email, security_q=security_q, security_a="")
            
        session['reset_email'] = user.email
        return redirect(url_for('reset'))
        
    return render_template('forgot.html', email="", security_q="", security_a="")


#-------------------------------------------------------------------------------RESET PASSWORD---------------------------------
@app.route('/reset-password', methods=['GET', 'POST'])
def reset():
    reset_email = session.get('reset_email')
    
    if not reset_email:
        flash("Please verify your account identity security questions first.")
        return redirect(url_for('forgot'))
        
    if request.method == 'POST':
        new_password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if new_password != confirm_password:
            flash("Passwords do not match.")
            return render_template('reset.html')
            
        if not re.match(r"^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", new_password):
            flash("Password too weak. Must be 8+ chars, with Capital, Number, and Symbol.")
            return render_template('reset.html')
            
        user = User.query.filter_by(email=reset_email).first()
        if user:
            user.password = new_password
            db.session.commit()
            session.pop('reset_email', None) 
            flash("Password updated successfully! Please login with your new credentials.")
            return redirect(url_for('login'))
            
        flash("An error occurred. User record could not be found.")
        return redirect(url_for('forgot'))
        
    return render_template('reset.html')


#-------------------------------------------------------------------------------UPDATE LECTURER INTERFACE PROPERTIES------------
@app.route('/update-office-location', methods=['POST'])
def update_office_location():
    if 'user_id' not in session or session.get('role') != 'lecturer':
        return redirect(url_for('login'))
        
    user = User.query.get(session['user_id'])
    new_location = request.form.get('office_location')
    
    if not new_location or not new_location.strip():
        flash("Office location cannot be empty.")
        return redirect(url_for('profile_lecturer'))
        
    user.office_location = new_location.strip()
    db.session.commit()
    
    flash("Office location updated successfully!")
    return redirect(url_for('profile_lecturer'))


#------------------------------------------------------------------------------------PROFILE------------------------------------------
@app.route('/profile')
def profile():
    if 'user_id' not in session: 
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if user.role == 'lecturer':
        return redirect(url_for('profile_lecturer'))
    return render_template('student/profile.html', user=user)


#-------------------------------------------------------------------------------STUDENTS NOTIFICATIONS----------------------------------
@app.route('/notifications')
def notification():
    if 'user_id' not in session or session.get('role') != 'student':
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    notifications_list = []
    now = datetime.utcnow()

    student_bookings = Booking.query.filter_by(student_id=user_id).all()

    for booking in student_bookings:
        slot = booking.slot
        if not slot: continue
            
        lecturer_name = slot.lecturer.name if slot.lecturer else "Lecturer"
        appt_date_str = booking.appointment_date 
        appt_time_str = booking.appointment_time 
        
        if booking.status == 'CANCELLED_BY_LECTURER':
            notifications_list.append({
                'dot_color': '#ff4d4d',
                'message': f"Alert: {lecturer_name} has cancelled your session on {appt_date_str} due to an emergency.",
                'date': booking.booking_date.strftime('%d/%m/%Y') if booking.booking_date else appt_date_str,
                'sort_date': booking.booking_date if booking.booking_date else now
            })
        elif booking.status == 'CONFIRMED':
            notifications_list.append({
                'dot_color': '#00c853',
                'message': f"Your appointment with {lecturer_name} on {appt_date_str} at {appt_time_str} has been confirmed.",
                'date': booking.booking_date.strftime('%d/%m/%Y') if booking.booking_date else appt_date_str,
                'sort_date': booking.booking_date if booking.booking_date else now
            })
            
            time_difference = slot.date_time - now
            if 0 < time_difference.total_seconds() <= 3600:
                notifications_list.append({
                    'dot_color': '#5a7fff',
                    'message': f"Reminder: You have an upcoming appointment with {lecturer_name} in less than 1 hour ({appt_time_str}).",
                    'date': now.strftime('%d/%m/%Y'),
                    'sort_date': now
                })

    custom_alerts = SystemNotification.query.filter(
        ((SystemNotification.student_id == user_id) | (SystemNotification.student_id == None)) &
        (SystemNotification.is_for_lecturer == False)
    ).all()
    
    for alert in custom_alerts:
        notifications_list.append({
            'dot_color': alert.dot_color,
            'message': alert.message,
            'date': alert.created_at.strftime('%d/%m/%Y'),
            'sort_date': alert.created_at
        })

    notifications_list.sort(key=lambda x: x['sort_date'], reverse=True)
    return render_template('student/notification.html', notifications=notifications_list)

#-----------------------------------------------------------------------------------------------LECTURER NOTIFICATION------------------
@app.route('/notifications-lecturer')
def notifications_lecturer():
    if 'user_id' not in session or session.get('role') != 'lecturer':
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    
    try:
        db_alerts = SystemNotification.query.filter_by(
        is_for_lecturer=True, 
        lecturer_id=user_id
    ).order_by(SystemNotification.created_at.desc()).all()
        
        # Format dataset components into an layout dictionary array matching your page structure variables
        lecturer_notifications = []
        for alert in db_alerts:
            lecturer_notifications.append({
                'dot_color': alert.dot_color,
                'message': alert.message,
                'date': alert.created_at.strftime('%d/%m/%Y')
            })
            
        # Fallback dummy sample data track array if your database logs are empty initially
        if not lecturer_notifications:
            lecturer_notifications = [{
                'dot_color': '#00c853',
                'message': "Welcome to Schedulify! Your real-time instructor feed engine is fully online.",
                'date': datetime.now().strftime('%d/%m/%Y')
            }]
            
        return render_template('lecturer/notification_lecturer.html', notifications=lecturer_notifications)
        
    except Exception as e:
        flash(f"Database feed extraction warning error: {str(e)}")
        return render_template('lecturer/notification_lecturer.html', notifications=[])


#-----------------------------------------------------------------------------------------------------------MANAGEMENT APPOINTMENT-----------------------------------------------
@app.route('/manage')
def manage():
    if 'user_id' not in session or session.get('role') != 'lecturer':
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    return render_template('lecturer/manage_lecturer.html', user=user)

#---------------------------------------------------------------------------------------------------------------------BLOCK-----------------------------------------------
@app.route('/block')
def block():
    if 'user_id' not in session or session.get('role') != 'lecturer':
        return redirect(url_for('login'))
    return render_template('lecturer/block_lecturer.html')

#-----------------------------------------------------------------------------------------------------MANAGEME BLOCK (DYNAMIC DATABASE FIX)----------------------------------
@app.route('/manage-blocked')
def manage_blocked():
    if 'user_id' not in session or session.get('role') != 'lecturer':
        return redirect(url_for('login'))
        
    lecturer_id = session['user_id']
    
    # Tarik data slot yang berstatus BLOCKED tulen milik lecturer yang sedang login sahaja
    blocked_slots_db = ScheduleSlot.query.filter_by(
        lecturer_id=lecturer_id,
        status='BLOCKED'
    ).all()
    
    formatted_slots = []
    for slot in blocked_slots_db:
        dt = slot.date_time
        # Menggunakan format tarikh %d %B %Y (Contoh: 18 June 2026)
        date_str = dt.strftime('%d %B %Y')
        
        formatted_slots.append({
            "slot_id": slot.id,
            "start_date": date_str,
            "end_date": date_str,
            "start_time": dt.strftime('%I:%M %p'),
            "end_time": (dt + timedelta(minutes=30)).strftime('%I:%M %p'),
            "days": dt.strftime('%A').upper()[:3]
        })
        
    return render_template('lecturer/unblock_lecturer.html', blocked_slots=formatted_slots)
    
#----------------------------------------------------------------------------------------------------LECTURER FEEDBACK-----------------------------------------------

@app.route('/feedback-lecturer')
def feedback_lecturer():
    if 'user_id' not in session or session.get('role') != 'lecturer':
        return redirect(url_for('login'))
    return render_template('lecturer/feedback_lecturer.html')

#----------------------------------------------------------------------------------------------------LECTURER PROFILE-----------------------------------------------
@app.route('/profile-lecturer')
def profile_lecturer():
    if 'user_id' not in session or session.get('role') != 'lecturer':
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    return render_template('lecturer/profile_lecturer.html', user=user)


#--------------------------------------------------------------------------------------------------STUDENT BOOKING-------------
@app.route('/book')
def book():
    if 'user_id' not in session or session.get('role') != 'student':
        return redirect(url_for('login'))
    lecturers = User.query.filter_by(role='lecturer').all()
    return render_template('student/book.html', lecturers=lecturers)


#----------------------------------------------------------------------------------------------------CANCELLATION---------------------------------
@app.route('/cancellation')
def cancellation():
    if 'user_id' not in session or session.get('role') != 'student':
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    
    # Calculate the date threshold (exactly 7 days ago)
    one_week_ago = datetime.now() - timedelta(days=7)
    
    # Define a custom sorting priority logic weight track
    status_priority = case(
        (Booking.status == 'CONFIRMED', 1),
        (Booking.status.in_(['CANCELLED_BY_STUDENT', 'CANCELLED_BY_LECTURER']), 2),
        else_=3
    )
    
    # Query logic with 1-week expiration filter for cancelled slots
    all_eligible_bookings = Booking.query.join(ScheduleSlot).filter(
        Booking.student_id == user_id,
        or_(
            # Condition A: Always keep active confirmed bookings
            Booking.status == 'CONFIRMED',
            
            # Condition B: Keep cancelled bookings ONLY if they are newer than 7 days old
            and_(
                Booking.status.in_(['CANCELLED_BY_STUDENT', 'CANCELLED_BY_LECTURER']),
                ScheduleSlot.date_time >= one_week_ago
            )
        )
    ).order_by(status_priority, ScheduleSlot.date_time.asc()).all()
    
    return render_template('student/cancellation.html', bookings=all_eligible_bookings)



#------------------------------------------------------------------------------------APPOINTMENT SYSTEM ROUTE (UNIFIED FIX)-------------------
@app.route('/appointments')
def appointments():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_role = session.get('role')
    user_id = session['user_id']
    now = datetime.now()
    
    # 1. Calculate the 7-day expiration threshold
    one_week_ago = now - timedelta(days=7)
    
    # -------------------------------------------------------- LECTURER WORKSPACE WORKFLOW -----------------------------------
    if user_role == 'lecturer':
        # 1. DATABASE MAINTENANCE: Auto-complete any lecturer sessions that have passed their calendar runtime slot
        all_lecturer_confirmed = Booking.query.join(ScheduleSlot).filter(
            ScheduleSlot.lecturer_id == user_id,
            Booking.status == 'CONFIRMED'
        ).all()
        
        db_changed = False
        for booking in all_lecturer_confirmed:
            if booking.slot and booking.slot.date_time < now:
                booking.status = 'COMPLETED'
                db_changed = True
        if db_changed:
            db.session.commit()

        # 2. SEPARATE SUBSET SUB-COLLECTIONS FOR LECTURER GRID VIEWS
        # Active upcoming student bookings
        active_bookings = Booking.query.join(ScheduleSlot).filter(
            ScheduleSlot.lecturer_id == user_id,
            Booking.status == 'CONFIRMED'
        ).order_by(ScheduleSlot.date_time.asc()).all()
        
        # Column 1: Sessions completed by this lecturer
        completed_bookings = Booking.query.join(ScheduleSlot).filter(
            ScheduleSlot.lecturer_id == user_id,
            Booking.status == 'COMPLETED'
        ).order_by(ScheduleSlot.date_time.desc()).all()
        
        # Column 2: Bookings cancelled by student or lecturer (Lecturers see all history logs)
        cancelled_bookings = Booking.query.join(ScheduleSlot).filter(
            ScheduleSlot.lecturer_id == user_id,
            Booking.status.in_(['CANCELLED_BY_STUDENT', 'CANCELLED_BY_LECTURER'])
        ).order_by(Booking.id.desc()).all()
        
        # Column 3: Absent history logs
        absent_bookings = Booking.query.join(ScheduleSlot).filter(
            ScheduleSlot.lecturer_id == user_id,
            Booking.status == 'ABSENT'
        ).order_by(ScheduleSlot.date_time.desc()).all()
        
        # FIXED: Returning the distinct lecturer dashboard view matching roles securely
        return render_template(
            'lecturer/appointment_lecturer.html', 
            bookings=active_bookings,
            completed_logs=completed_bookings,
            cancelled_logs=cancelled_bookings,
            absent_logs=absent_bookings
        )
        
    # -------------------------------------------------------- STUDENT WORKSPACE WORKFLOW ------------------------------------
    else:
        all_confirmed_bookings = Booking.query.join(ScheduleSlot).filter(
            Booking.student_id == user_id,
            Booking.status == 'CONFIRMED'
        ).all()
        
        database_changed = False
        for booking in all_confirmed_bookings:
            if booking.slot and booking.slot.date_time < now:
                booking.status = 'COMPLETED'
                database_changed = True
        if database_changed:
            db.session.commit()

        active_bookings = Booking.query.join(ScheduleSlot).filter(
            Booking.student_id == user_id,
            Booking.status == 'CONFIRMED'
        ).order_by(ScheduleSlot.date_time.asc()).all()
        
        completed_bookings = Booking.query.join(ScheduleSlot).filter(
            Booking.student_id == user_id,
            Booking.status == 'COMPLETED'
        ).order_by(ScheduleSlot.date_time.desc()).all()
        
        # FIXED CHANGED HERE: Apply the 1-week dynamic filter so only recent cancellations load for the student
        cancelled_bookings = Booking.query.join(ScheduleSlot).filter(
            Booking.student_id == user_id,
            Booking.status.in_(['CANCELLED_BY_STUDENT', 'CANCELLED_BY_LECTURER']),
            ScheduleSlot.date_time >= one_week_ago
        ).order_by(Booking.id.desc()).all()
        
        absent_bookings = Booking.query.join(ScheduleSlot).filter(
            Booking.student_id == user_id,
            Booking.status == 'ABSENT'
        ).order_by(ScheduleSlot.date_time.desc()).all()
        
        return render_template(
            'student/appointments.html', 
            bookings=active_bookings,
            completed_logs=completed_bookings,
            cancelled_logs=cancelled_bookings,
            absent_logs=absent_bookings
        )

#---------------------------------------------------------------------------------DEDICATED HISTORY PAGE ROUTE---------------
@app.route('/history')
def history():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_role = session.get('role')
    user_id = session['user_id']
    now = datetime.now()
    
    # 1. DATABASE MAINTENANCE: Auto-complete any confirmed sessions whose times have elapsed
    if user_role == 'lecturer':
        expiring_bookings = Booking.query.join(ScheduleSlot).filter(
            ScheduleSlot.lecturer_id == user_id,
            Booking.status == 'CONFIRMED'
        ).all()
    else:
        expiring_bookings = Booking.query.join(ScheduleSlot).filter(
            Booking.student_id == user_id,
            Booking.status == 'CONFIRMED'
        ).all()

    db_changed = False
    for booking in expiring_bookings:
        if booking.slot and booking.slot.date_time < now:
            booking.status = 'COMPLETED'
            db_changed = True
            
    if db_changed:
        db.session.commit()

    # 2. QUERY SORTED HISTORICAL SUBSETS
    if user_role == 'lecturer':
        completed = Booking.query.join(ScheduleSlot).filter(
            ScheduleSlot.lecturer_id == user_id,
            Booking.status == 'COMPLETED'
        ).order_by(ScheduleSlot.date_time.desc()).all()
        
        cancelled = Booking.query.join(ScheduleSlot).filter(
            ScheduleSlot.lecturer_id == user_id,
            Booking.status.in_(['CANCELLED_BY_STUDENT', 'CANCELLED_BY_LECTURER'])
        ).order_by(Booking.id.desc()).all()
    else:
        completed = Booking.query.join(ScheduleSlot).filter(
            Booking.student_id == user_id,
            Booking.status == 'COMPLETED'
        ).order_by(ScheduleSlot.date_time.desc()).all()
        
        cancelled = Booking.query.join(ScheduleSlot).filter(
            Booking.student_id == user_id,
            Booking.status.in_(['CANCELLED_BY_STUDENT', 'CANCELLED_BY_LECTURER'])
        ).order_by(Booking.id.desc()).all()

    # Determine template folder pathway based on current user role
    template_path = 'lecturer/history_lecturer.html' if user_role == 'lecturer' else 'student/history.html'
    
    return render_template(
        template_path,
        completed_logs=completed,
        cancelled_logs=cancelled,
        user_role=user_role
    )


#--------------------------------------------------------------------------------------------------FEEDBACK------------------------------------
@app.route('/feedback', methods=['GET'])
def feedback():
    if 'user_id' not in session or session.get('role') != 'student':
        return redirect(url_for('login'))
    return render_template('student/feedback.html')


#--------------------------------------------------------------------------------------WEEKLY CHANCES COUNTER CONTROLLER--------
@app.route('/api/get-weekly-chances')
def get_weekly_chances():
    if 'user_id' not in session or session.get('role') != 'student':
        return jsonify({'error': 'Unauthorized'}), 403
        
    user_id = session['user_id']
    now = datetime.now()
    days_since_sunday = (now.weekday() + 1) % 7
    start_of_week = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_since_sunday)
    
    # 2. Only count bookings made during the CURRENT week (since Sunday)
    weekly_bookings_count = Booking.query.join(ScheduleSlot).filter(
        Booking.student_id == user_id,
        Booking.status.in_(['CONFIRMED', 'CANCELLED_BY_STUDENT']),
        ScheduleSlot.date_time >= start_of_week  # Filter out old weeks' bookings
    ).count()
    
    max_chances = 5
    chances_left = max(0, max_chances - weekly_bookings_count)
    
    return jsonify({
        'chances_left': chances_left,
        'bookings_count': weekly_bookings_count
    })


#--------------------------------------------------------------------------------------------API BOOK--------------------
@app.route('/api/book-appointment', methods=['POST'])
def book_appointment():
    if 'user_id' not in session or session.get('role') != 'student':
        return jsonify({'status': 'error', 'message': 'Unauthorized account access.'}), 403
        
    data = request.get_json()
    lecturer_name = data.get('lecturer_name')
    date_str = data.get('date')       
    time_str = data.get('time')       
    
    lecturer = User.query.filter_by(name=lecturer_name, role='lecturer').first()
    if not lecturer:
        return jsonify({'status': 'error', 'message': 'Lecturer record not found.'}), 444
        
    try:
        # 1. Calculate the most recent Sunday
        now = datetime.now()
        days_since_sunday = (now.weekday() + 1) % 7
        start_of_week = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_since_sunday)

        # 2. Updated: Count only bookings from this week by joining ScheduleSlot
        weekly_count = Booking.query.join(ScheduleSlot).filter(
            Booking.student_id == session['user_id'], 
            Booking.status.in_(['CONFIRMED', 'CANCELLED_BY_STUDENT']),
            ScheduleSlot.date_time >= start_of_week
        ).count()
        
        if weekly_count >= 5:
            # Note: Changed status to 'limit_reached' to match your JavaScript conditional check
            return jsonify({
                'status': 'limit_reached', 
                'message': 'Weekly Limit Reached! You have used all 5 appointment chances for this week (including cancellations).'
            }), 400

        time_clean = time_str.split(' ')[0] 
        modifier = time_str.split(' ')[1]   
        hour, minute = map(int, time_clean.split(':'))
        
        if modifier == 'PM' and hour != 12: hour += 12
        if modifier == 'AM' and hour == 12: hour = 0
        
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        combined_datetime = datetime(date_obj.year, date_obj.month, date_obj.day, hour, minute)
        
        new_slot = ScheduleSlot(
            lecturer_id=lecturer.id,
            date_time=combined_datetime,
            is_available=False 
        )
        db.session.add(new_slot)
        db.session.flush() 
        
        new_booking = Booking(
            student_id=session['user_id'],
            slot_id=new_slot.id,
            booking_date=datetime.utcnow(),
            student_name=session.get('user_name', 'Unknown Student'),
            appointment_day=combined_datetime.strftime('%A'),       
            appointment_date=combined_datetime.strftime('%d/%m/%Y'), 
            appointment_time=time_str,
            status='CONFIRMED' 
        )
        db.session.add(new_booking)

        # Create and inject the system alert log tracking block for the lecturer's view panel
        student_display_name = session.get('user_name', 'A student')
        formatted_date = combined_datetime.strftime('%d/%m/%Y')
        
        lecturer_alert = SystemNotification(
            is_for_lecturer=True,
            lecturer_id=lecturer.id,
            type='confirmed',
            dot_color='#00c853',  # Dynamic green dot design status tag
            message=f"New Booking: {student_display_name} has confirmed an appointment with you on {formatted_date} at {time_str}."
        )
        db.session.add(lecturer_alert)
        
        # Commit all components together as a singular transaction block safely
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': 'Appointment committed successfully!'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': f'Database rejection error: {str(e)}'}), 500
    

#-------------------------------------------------------------------------------API BLOCK SLOTS--------------------
@app.route('/api/block-slots', methods=['POST'])
def block_slots():
    if 'user_id' not in session or session.get('role') != 'lecturer':
        return jsonify({'status': 'error', 'message': 'Unauthorized account access.'}), 403
        
    data = request.get_json()
    start_date_str = data.get('start_date')  
    end_date_str = data.get('end_date')      
    start_time_str = data.get('start_time')  
    end_time_str = data.get('end_time')      
    repeat_days = data.get('repeat_days', []) 
    
    if not start_date_str or not end_date_str or not start_time_str or not end_time_str:
        return jsonify({'status': 'error', 'message': 'Missing required date or time range fields.'}), 400

    def parse_time_string(t_str):
        time_clean, modifier = t_str.split(' ')
        hour, minute = map(int, time_clean.split(':'))
        if modifier == 'PM' and hour != 12: hour += 12
        if modifier == 'AM' and hour == 12: hour = 0
        return hour, minute

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        start_hour, start_minute = parse_time_string(start_time_str)
        end_hour, end_minute = parse_time_string(end_time_str)

        slots_to_create = []
        current_date = start_date
        
        while current_date <= end_date:
            day_name_abbrev = current_date.strftime('%a').upper() 
            
            if not repeat_days or day_name_abbrev in repeat_days:
                loop_hour = start_hour
                loop_minute = start_minute
                
                while (loop_hour < end_hour) or (loop_hour == end_hour and loop_minute < end_minute):
                    combined_datetime = datetime(current_date.year, current_date.month, current_date.day, loop_hour, loop_minute)
                    
                    existing_booking = Booking.query.join(ScheduleSlot).filter(
                        ScheduleSlot.lecturer_id == session['user_id'],
                        ScheduleSlot.date_time == combined_datetime,
                        Booking.status == 'CONFIRMED'
                    ).first()
                    
                    if existing_booking:
                        # FIXED: Changed String() constructor to lowercase str() representation
                        return jsonify({
                            'status': 'warning',
                            'message': f'Conflict detected! An appointment already exists on {current_date.strftime("%d/%m/%Y")} at {loop_hour}:{str(loop_minute).padStart(2,"0")}.'
                        }), 200

                    already_blocked = ScheduleSlot.query.filter_by(
                        lecturer_id=session['user_id'],
                        date_time=combined_datetime,
                        status='BLOCKED'
                    ).first()

                    if not already_blocked:
                        new_blocked_slot = ScheduleSlot(
                            lecturer_id=session['user_id'],
                            date_time=combined_datetime,
                            is_available=False,
                            status='BLOCKED'
                        )
                        slots_to_create.append(new_blocked_slot)
                    
                    loop_minute += 30
                    if loop_minute >= 60:
                        loop_hour += 1
                        loop_minute = 0
            
            current_date += timedelta(days=1)

        if slots_to_create:
            db.session.add_all(slots_to_create)
            
            lecturer_user = User.query.get(session['user_id'])
            lecturer_name = lecturer_user.name if lecturer_user else "A Lecturer"
            display_date = start_date.strftime('%d/%m/%Y') if start_date == end_date else f"{start_date.strftime('%d/%m/%Y')} to {end_date.strftime('%d/%m/%Y')}"
            
            all_students = User.query.filter_by(role='student').all()
            for student in all_students:
                new_alert = SystemNotification(
                    student_id=student.id,
                    type='cancelled',
                    dot_color='#ff4d4d',
                    message=f"Alert: {lecturer_name} has blocked slots from {display_date} ({start_time_str} - {end_time_str}) due to schedule constraints."
                )
                db.session.add(new_alert)

            db.session.commit()
            
        return jsonify({'status': 'success', 'message': f'Successfully blocked {len(slots_to_create)} calendar slots!'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': f'Database processing fault: {str(e)}'}), 500


#----------------------------------------------------------------------------------------------------API UNBLOCK SLOT-----------------------------------------------
@app.route('/api/unblock-slot', methods=['POST'])
def unblock_slot():
    if 'user_id' not in session or session.get('role') != 'lecturer':
        return jsonify({'status': 'error', 'message': 'Unauthorized account access.'}), 403
        
    try:
        data = request.get_json()
        slot_id = data.get('slot_id')
        
        if not slot_id:
            return jsonify({'status': 'error', 'message': 'Missing slot identification token.'}), 400
            
        # 1. Query the blocked slot directly using your SQLAlchemy Model
        slot_to_delete = ScheduleSlot.query.filter_by(
            id=slot_id, 
            lecturer_id=session['user_id'],
            status='BLOCKED'
        ).first()
        
        if not slot_to_delete:
            return jsonify({'status': 'error', 'message': 'Blocked slot record not found or unauthorized.'}), 404
            
        # 2. Safely remove the target row from your database
        db.session.delete(slot_to_delete)
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': 'Slot unblocked successfully.'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': f'Server Database Error: {str(e)}'}), 500

#---------------------------------------------------------------------------------------------API BOOKED SLOT-----------------------------
@app.route('/api/get-booked-slots')
def get_booked_slots():
    lecturer_name = request.args.get('lecturer_name')
    if not lecturer_name: return jsonify({'booked': [], 'blocked': []})

    lecturer = User.query.filter_by(name=lecturer_name, role='lecturer').first()
    if not lecturer: return jsonify({'booked': [], 'blocked': []})

    all_slots = ScheduleSlot.query.filter_by(lecturer_id=lecturer.id).all()
    
    booked_list = []
    blocked_list = []
    
    for slot in all_slots:
        iso_str = slot.date_time.strftime('%Y-%m-%dT%H:%M:00')
        if slot.status == 'BLOCKED':
            blocked_list.append(iso_str)
        elif slot.status == 'BOOKED' or not slot.is_available:
            booking = Booking.query.filter_by(slot_id=slot.id, status='CONFIRMED').first()
            if booking:
                booked_list.append(iso_str)

    return jsonify({
        'booked': booked_list,
        'blocked': blocked_list
    })


#-------------------------------------------------------------------------------LECTURER CALENDAR API (STRICT FORMAT MATCH)---
from datetime import datetime, timedelta, time

@app.route('/api/get-lecturer-slots')
def get_lecturer_slots():
    if 'user_id' not in session or session.get('role') != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403
        
    lecturer_id = session['user_id']
    
    try:
        # 1. Get today's real-time date
        today = datetime.now().date()
        weekday = today.weekday() # 0 = Monday, 1 = Tuesday, ..., 5 = Saturday, 6 = Sunday

        # 2. Adjust the week shift logic to reset exactly on Sunday at 00:00
        if weekday == 6:
            # If it is Sunday, this is now the start of the new displayed week
            start_of_week_date = today  # Today is Sunday
            end_of_week_date = today + timedelta(days=4)  # Show up to Thursday

        else:
            # If it's Monday through Saturday, calculate back to the most recent Monday
            start_of_week_date = today - timedelta(days=weekday)
            end_of_week_date = start_of_week_date + timedelta(days=4) # Friday

        # 3. Convert dates into full datetime timestamps to cover the entire day ranges securely
        start_of_week_dt = datetime.combine(start_of_week_date, time.min)  # Start of Week 00:00:00
        end_of_week_dt = datetime.combine(end_of_week_date, time.max)      # End of Week 23:59:59

        # 4. Filter query to ONLY grab slots within this dynamically shifted range
        slots = ScheduleSlot.query.filter(
            ScheduleSlot.lecturer_id == lecturer_id,    
            ScheduleSlot.date_time >= start_of_week_dt,
            ScheduleSlot.date_time <= end_of_week_dt
        ).all()
        
        slots_data = {}
        for slot in slots:
            dt = slot.date_time
            
            # ISO key string generator matching Javascript expectations: "YYYY-MM-DDTHH:MM:00"
            iso_key = f"{dt.year}-{str(dt.month).zfill(2)}-{str(dt.day).zfill(2)}T{str(dt.hour).zfill(2)}:{str(dt.minute).zfill(2)}:00"
            
            booking = None
            if slot.booking_slots:
                active_bookings = [b for b in slot.booking_slots if b.status == 'CONFIRMED']
                booking = active_bookings[0] if active_bookings else slot.booking_slots[0]
            
            slots_data[iso_key] = {
                'slot_id': slot.id,
                'is_available': slot.is_available,
                'booked': booking is not None and booking.status == 'CONFIRMED',
                'student_name': booking.student_name if booking else None,
                'booking_id': booking.id if booking else None,
                'status': slot.status
            }
            
        return jsonify(slots_data)
        
    except Exception as e:
        return jsonify({'error': f'Database processing failure: {str(e)}'}), 500


#-------------------------------------------------------------------------------STUDENT API CANCEL APPOINTMENT----------------------
@app.route('/api/student-cancel-appointment', methods=['POST'])
def student_cancel_appointment():
    if 'user_id' not in session or session.get('role') != 'student':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    booking_id = data.get('booking_id')
    reason = data.get('reason', '')
    
    try:
        booking = Booking.query.filter_by(id=booking_id, student_id=session['user_id']).first()
        if not booking:
            return jsonify({'status': 'error', 'message': 'Booking not found.'}), 404
            
        booking.status = 'CANCELLED_BY_STUDENT'
        booking.cancel_reason = reason
        
        slot = ScheduleSlot.query.get(booking.slot_id)
        if slot:
            slot.is_available = True  
            
        db.session.commit()
        return jsonify({'status': 'success'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500



#-------------------------------------------------------------------------------LECTURER API CANCEL APPOINTMENT----------------------
@app.route('/api/cancel-appointment', methods=['POST'])
def cancel_appointment():
    if 'user_id' not in session or session.get('role') != 'lecturer':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    slot_id = data.get('slot_id')
    # FIXED: Extract the custom reason typed by the lecturer dynamically
    custom_reason = data.get('reason', '').strip()
    
    # Fallback to a default string if the lecturer left the text area blank
    if not custom_reason:
        custom_reason = "No specific reason provided by the lecturer."
    
    try:
        slot = ScheduleSlot.query.get(slot_id)
        if not slot:
            return jsonify({'status': 'error', 'message': 'Slot not found.'}), 404
            
        booking = Booking.query.filter_by(slot_id=slot_id, status='CONFIRMED').first()
        
        if booking:
            # 1. SOFT-DELETE: Save the actual dynamic custom reason to the database row
            booking.status = 'CANCELLED_BY_LECTURER'
            booking.cancel_reason = custom_reason
            
            # 2. RESTORE SLOT: Re-open the calendar slot for future student bookings
            slot.is_available = True
            slot.status = 'AVAILABLE'
            
            # 3. LIVE NOTIFICATION ALERT: Push the custom reason right into the student's notification center
            new_alert = SystemNotification(
                student_id=booking.student_id,
                type='cancelled',
                dot_color='#ff4d4d', 
                message=f"Alert: {session.get('user_name', 'Your lecturer')} has cancelled your session scheduled on {booking.appointment_date} at {booking.appointment_time}. Reason: {custom_reason}"
            )
            db.session.add(new_alert)
            
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Appointment cancelled with custom reason saved!'})
            
        return jsonify({'status': 'error', 'message': 'No active booking found for this slot.'}), 444
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
#---------------------------------------------------------------------------------------------APIFEEDBACK-----------------------------
@app.route('/api/submit-feedback', methods=['POST'])
def submit_feedback():
    if 'user_id' not in session or session.get('role') != 'student':
        return jsonify({'status': 'error', 'message': 'Unauthorized action.'}), 403
        
    data = request.get_json()
    rating = data.get('rating')
    category = data.get('category')
    reason = data.get('reason')
    
    if not rating or not category or not reason or not reason.strip():
        return jsonify({'status': 'error', 'message': 'Missing fields.'}), 400
        
    try:
        new_feedback = Feedback(
            student_id=session['user_id'], rating=rating, category=category, reason=reason.strip()
        )
        db.session.add(new_feedback)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Feedback submitted successfully.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500


#-------------------------------------------------------------------------------USER DATA MAINTENANCE PROFILE SETTINGS---------
@app.route('/update-security-questions', methods=['POST'])
def update_security_questions():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user = User.query.get(session['user_id'])
    question = request.form.get('security_question')
    answer = request.form.get('security_answer')
    
    if not question or not answer.strip():
        flash("Please select a question and provide an answer.")
        return redirect(url_for('profile'))
        
    user.security_question = question
    user.security_answer = answer.strip()
    
    try:
        db.session.commit()
        flash("Security questions updated successfully!")
    except Exception as e:
        db.session.rollback()
        flash("Database update failed.")
        
    return redirect(url_for('profile'))

#---------------------------------------------------------------------------------------------UPDATE SEQURITY-----------------------------
@app.route('/update-security', methods=['POST'])
def update_security():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user = User.query.get(session['user_id'])
    current_password = request.form.get('current_password')
    new_password = request.form.get('password')
    confirm_password = request.form.get('confirm_password')

    if user.password != current_password:
        flash("Incorrect current password.")
        return redirect(url_for('profile')) 

    if new_password != confirm_password:
        flash("New password and confirmation password do not match.")
        return redirect(url_for('profile')) 

    if not re.match(r"^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", new_password):
        flash("Password too weak. Must be 8+ chars, with Capital, Number, and Symbol.")
        return redirect(url_for('profile')) 

    user.password = new_password
    db.session.commit()
    
    flash("Password changed successfully!")
    return redirect(url_for('profile')) 

#---------------------------------------------------------------------------------------------UPDATE USERNAME-----------------------------
@app.route('/update-username', methods=['POST'])
def update_username():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user = User.query.get(session['user_id'])
    new_name = request.form.get('username')
    
    if not new_name or not new_name.strip():
        flash("Username cannot be empty.")
        return redirect(url_for('profile'))
        
    user.name = new_name.strip()
    db.session.commit()
    session['user_name'] = user.name
    
    flash("Username updated successfully!")
    return redirect(url_for('profile'))

#---------------------------------------------------------------------------------------------LOGOUT-----------------------------
@app.route('/logout')
def logout():
    session.clear() 
    return redirect(url_for('login')) 

#---------------------------------------------------------------------------------------------CONTACT US--------------------------
@app.route('/contact')
def contact():
    return render_template('contact.html')

if __name__ == '__main__':
    with app.app_context(): 
        db.create_all()
    app.run(debug=True)