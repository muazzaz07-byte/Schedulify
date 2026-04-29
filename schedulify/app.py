from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# 1. Landing & Authentication Routes
@app.route('/')
def welcome():
    return render_template('welcome.html')                                                                  

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Change redirect from 'profile' to 'book'
        return redirect(url_for('book')) 
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    # If this is a POST (user submitted registration form)
    if request.method == 'POST':
        # Send them to the booking page after they sign up
        return redirect(url_for('book'))
    return render_template('register.html')

@app.route('/forgot-password')
def forgot():
    return render_template('forgot.html')

@app.route('/reset-password')
def reset():
    return render_template('reset.html')

# 2. User Dashboard & Profile
@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/notifications')
def notification():
    return render_template('notification.html')

# 3. Appointment Management
@app.route('/appointments')
def appointments():
    return render_template('appointments.html')

@app.route('/book', methods=['GET', 'POST'])
def book():
    if request.method == 'POST':
        # Logic to save booking would go here
        return redirect(url_for('appointments'))
    return render_template('book.html')

@app.route('/cancellation')
def cancellation():
    return render_template('cancellation.html')

# 4. Feedback
@app.route('/feedback', methods=['GET', 'POST'])
def feedback():
    return render_template('feedback.html')

@app.route('/update-security', methods=['POST'])
def update_security():
    # In a real app, you would save the question and answer here
    # For your demo, we just redirect back to profile
    return redirect(url_for('profile'))

if __name__ == '__main__':
    # debug=True allows the server to auto-reload when you save changes
    app.run(debug=True)