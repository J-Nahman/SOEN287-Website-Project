


var selectedLoginType='';

function showLanding(){
    document.getElementById('FirstPage').className='page';
    document.getElementById('LoginPage').className='page hidden';
    document.getElementById('SignupPage').className='page hidden';
    window.scrollTo(0, 0);  
}


function showLogin(userType){
    selectedLoginType=userType;

    document.getElementById('FirstPage').className='page hidden';
    document.getElementById('LoginPage').className='page';
    document.getElementById('SignupPage').className='page hidden';

    if(userType=='admin'){
        document.getElementById('loginTitle').innerHTML='Administrator Login';
        document.getElementById('loginSubtitle').innerHTML='Access admin dashboard';
    }else{
        document.getElementById('loginTitle').innerHTML='Student/Faculty Login';
        document.getElementById('loginSubtitle').innerHTML='Access booking system';
    }

    window.scrollTo(0, 0); 

}

document.getElementById('loginForm').onsubmit = async function(e) {
    e.preventDefault();

    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    
    // Hide previous errors
    document.getElementById('errorMessage').className = 'hidden';

    try {
        console.log('Attempting login...');
        
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                email: email,
                password: password,
                loginType: selectedLoginType
            })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        
        if (data.success) {
            // Store user info
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = 'overviewA.html';
            } else {
                window.location.href = 'overviewU.html';
            }
        } else {
            // Show error message
            document.getElementById('errorMessage').innerHTML = data.error;
            document.getElementById('errorMessage').className = '';
        }
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('errorMessage').innerHTML = 'Connection error. Please make sure the server is running.';
        document.getElementById('errorMessage').className = '';
    }
    
    return false;
};
// Show signup page
function showSignup() {
    document.getElementById('FirstPage').className = 'page hidden';
    document.getElementById('LoginPage').className = 'page hidden';
    document.getElementById('SignupPage').className = 'page';
    window.scrollTo(0, 0);
}

// Handle signup form
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.onsubmit = async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const firstName = document.getElementById('signupFirstName').value;
            const lastName = document.getElementById('signupLastName').value;
            const phone = document.getElementById('signupPhone').value;
            const role = document.getElementById('signupRole').value;
            
            // Hide previous messages
            document.getElementById('signupError').className = 'hidden';
            document.getElementById('signupSuccess').className = 'hidden';
            
            try {
                console.log('Creating account...');
                
                const response = await fetch('http://localhost:3001/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        firstName: firstName,
                        lastName: lastName,
                        phone: phone,
                        role: role
                    })
                });
                
                const data = await response.json();
                console.log('Signup response:', data);
                
                if (data.success) {
                    document.getElementById('signupSuccess').textContent = 'Account created successfully! Redirecting to login...';
                    document.getElementById('signupSuccess').className = '';
                    
                    document.getElementById('signupForm').reset();

                    window.scrollTo(0, 0);

                    setTimeout(function() {
                        showLogin('user');
                    }, 2000);
                } else {
                    // Show error message
                    document.getElementById('signupError').textContent = data.error;
                    document.getElementById('signupError').className = '';
                }
            } catch (error) {
                console.error('Signup error:', error);
                document.getElementById('signupError').textContent = 'Connection error. Please make sure the server is running.';
                document.getElementById('signupError').className = '';
            }
        };
    }
});
