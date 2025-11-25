var users=[
    {
        email:"admin@concordia.ca",
        password: "admin123",
        role:"admin",
        name:"Admin user"
    },
    {
        email:"student@concordia.ca",
        password: "student123",
        role:"student",
        name:"Random Student"
    },
    {
        email:"facultu@concordia.ca",
        password: "faculty123",
        role:"faculty",
        name:"Random Faculty"
    }
];

var selectedLoginType='';

function showLanding(){
    document.getElementById('FirstPage').className='page';
    document.getElementById('LoginPage').className='page hidden';
}


function showLogin(userType){
    selectedLoginType=userType;

    document.getElementById('FirstPage').className='page hidden';
    document.getElementById('LoginPage').className='page';

    if(userType=='admin'){
        document.getElementById('loginTitle').innerHTML='Administrator Login';
        document.getElementById('loginSubtitle').innerHTML='Access admin dashboard';
    }else{
        document.getElementById('loginTitle').innerHTML='Student/Faculty Login';
        document.getElementById('loginSubtitle').innerHTML='Access booking system';
    }

}


document.getElementById('loginForm').onsubmit=function(e){
    e.preventDefault();

    var email=document.getElementById('email').value;
    var password=document.getElementById('password').value;


    var user=null;
    for (var i = 0; i < users.length; i++) {
        if (users[i].email === email && users[i].password === password) {
            user = users[i];
            break;
        }
    }
    if (user !== null) {
        if (selectedLoginType === 'admin' && user.role !== 'admin') {
            document.getElementById('errorMessage').innerHTML = 'You are not an administrator!';
            document.getElementById('errorMessage').className = '';
            return false;
        }
        if (selectedLoginType === 'user' && user.role === 'admin') {
            document.getElementById('errorMessage').innerHTML = 'Please use Admin login!';
            document.getElementById('errorMessage').className = '';
            return false;
        }

        localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.role==='admin'){        
            window.location.href = 'overviewA.html';
        }else{
            window.location.href = 'overviewU.html';
        }
        
    } else {
        document.getElementById('errorMessage').innerHTML = 'Invalid email or password!';
        document.getElementById('errorMessage').className = '';
    }
    
    return false;

};
