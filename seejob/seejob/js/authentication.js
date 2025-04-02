// authentication 


document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('token');
    const employertoken = localStorage.getItem('employertoken');
  
    const authButton = document.getElementById('auth-button');
    const authLink = document.getElementById('auth-link');
    const authBtn = document.getElementById('auth-btn');

    const innertext = document.getElementById('employertoken');
  
    if (token ) {
      // User is logged in, show "Log out"
      authLink.textContent = 'Log out';
      authLink.removeAttribute('data-toggle');
      authLink.removeAttribute('data-target');
      authLink.href = '#';
      authBtn.classList.remove('btn-danger');
      authBtn.classList.add('btn-success');
  


      authButton.addEventListener('click', () => {
        // Handle log out
        localStorage.removeItem('token');
        window.location.reload();
      });
    } else {
      // User is not logged in, show "Sign in"
      authLink.textContent = 'Sign in';
      authLink.setAttribute('data-toggle', 'modal');
      authLink.setAttribute('data-target', '#exampleModal');
      authLink.href = '#';
      authBtn.classList.remove('btn-success');
      authBtn.classList.add('btn-danger');
    }

    if( employertoken)  {
      innertext.textContent = localStorage.getItem('employername')
         
    }
    else {
      innertext.textContent = 'employer login'
     
    }

  });