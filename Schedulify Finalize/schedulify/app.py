from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# 1. Landing & Authentication Routes
@app.route('/')
def welcome():
    return render_template('welcome.html')                                                                  

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Logic for login will go here
        return redirect(url_for('profile')) 
    return render_template('login.html')

@app.route('/register')
def register():
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

if __name__ == '__main__':
    # debug=True allows the server to auto-reload when you save changes
    app.run(debug=True)