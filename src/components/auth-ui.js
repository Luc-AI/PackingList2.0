import { authStore } from '../store/auth.js';

export function renderAuthForm() {
    const container = document.createElement('div');
    container.className = 'auth-container';
    container.style.padding = '20px';
    container.style.textAlign = 'center';

    const title = document.createElement('h2');
    title.innerText = 'Sign In';
    title.style.marginBottom = '20px';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email';
    emailInput.className = 'auth-input';
    emailInput.style.display = 'block';
    emailInput.style.width = '100%';
    emailInput.style.padding = '10px';
    emailInput.style.marginBottom = '10px';
    emailInput.style.borderRadius = '8px';
    emailInput.style.border = '1px solid #ccc';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Password';
    passwordInput.className = 'auth-input';
    passwordInput.style.display = 'block';
    passwordInput.style.width = '100%';
    passwordInput.style.padding = '10px';
    passwordInput.style.marginBottom = '20px';
    passwordInput.style.borderRadius = '8px';
    passwordInput.style.border = '1px solid #ccc';

    const actionBtn = document.createElement('button');
    actionBtn.innerText = 'Log In';
    actionBtn.style.width = '100%';
    actionBtn.style.padding = '12px';
    actionBtn.style.backgroundColor = 'var(--accent, #2563EB)';
    actionBtn.style.color = 'white';
    actionBtn.style.border = 'none';
    actionBtn.style.borderRadius = '8px';
    actionBtn.style.cursor = 'pointer';
    actionBtn.style.fontSize = '16px';

    const toggleText = document.createElement('p');
    toggleText.style.marginTop = '15px';
    toggleText.style.fontSize = '14px';
    toggleText.innerHTML = `Don't have an account? <a href="#" id="auth-toggle">Sign Up</a>`;

    const message = document.createElement('div');
    message.style.marginTop = '10px';
    message.style.color = 'red';
    message.style.fontSize = '14px';

    let isLogin = true;

    container.appendChild(title);
    container.appendChild(emailInput);
    container.appendChild(passwordInput);
    container.appendChild(actionBtn);
    container.appendChild(toggleText);
    container.appendChild(message);

    // Event Handlers
    container.querySelector('#auth-toggle').addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        title.innerText = isLogin ? 'Sign In' : 'Create Account';
        actionBtn.innerText = isLogin ? 'Log In' : 'Sign Up';
        toggleText.innerHTML = isLogin
            ? `Don't have an account? <a href="#" id="auth-toggle">Sign Up</a>`
            : `Already have an account? <a href="#" id="auth-toggle">Log In</a>`;

        // Re-attach listener to new element
        container.querySelector('#auth-toggle').addEventListener('click', (ev) => {
            // Recursive or simple re-render? Simpler to just let this handler run again if we hadn't replaced innerHTML.
            // Since we replaced innerHTML, we need to re-bind.
            // Actually, let's keep it simple:
            const newToggle = container.querySelector('#auth-toggle');
            // We just triggered the outer logic, so we need to recurse or fix the event binding strategy.
            // Fix: Just re-running this logic on the newly created element.
            // A better way is to not replace innerHTML but just text nodes, but for MVP:
            newToggle.click(); // This would infinitely recurse if checked carelessly.
            // Let's just alert the user this simplified toggle logic needs a slight refactor if we want robust toggling,
            // but for now, let's just re-bind manually:
            newToggle.onclick = (ev2) => {
                ev2.preventDefault();
                isLogin = !isLogin;
                // It's getting messy. Let's just create two static links and toggle visibility?
                // Or just keep the logic simple.
                renderAuthForm(); // Re-render the whole thing? No, that disconnects from DOM.
                // Correct approach: Just change text.
            };
        });

        // BETTER FIX: Just change text content, don't replace HTML containing the link.
        // Actually, let's just reload the whole component content or cheat:
        // Let's do the text content update properly below in the corrected logic.
    });

    // Correct Toggle Logic
    const updateMode = () => {
        title.innerText = isLogin ? 'Sign In' : 'Create Account';
        actionBtn.innerText = isLogin ? 'Log In' : 'Sign Up';
        toggleText.innerHTML = isLogin
            ? `Don't have an account? <a href="#" id="auth-toggle-btn">Sign Up</a>`
            : `Already have an account? <a href="#" id="auth-toggle-btn">Log In</a>`;

        const btn = toggleText.querySelector('#auth-toggle-btn');
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            isLogin = !isLogin;
            updateMode();
        });
    };

    updateMode(); // Init loop

    actionBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        message.innerText = '';
        message.style.color = 'red';

        if (!email || !password) {
            message.innerText = 'Please enter email and password';
            return;
        }

        try {
            actionBtn.disabled = true;
            actionBtn.innerText = 'Processing...';
            if (isLogin) {
                await authStore.signIn(email, password);
            } else {
                await authStore.signUp(email, password);
                message.style.color = 'green';
                message.innerText = 'Check your email for confirmation link!';
            }
        } catch (err) {
            message.innerText = err.message;
        } finally {
            actionBtn.disabled = false;
            actionBtn.innerText = isLogin ? 'Log In' : 'Sign Up';
        }
    });

    return container;
}

export function renderUserProfile(user) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '10px';
    container.style.fontSize = '12px';

    const emailDisplay = document.createElement('span');
    emailDisplay.innerText = user.email;
    emailDisplay.style.opacity = '0.7';

    const logoutBtn = document.createElement('button');
    logoutBtn.innerText = 'Sign Out';
    logoutBtn.style.padding = '4px 8px';
    logoutBtn.style.border = '1px solid var(--border)';
    logoutBtn.style.borderRadius = '4px';
    logoutBtn.style.background = 'transparent';
    logoutBtn.style.cursor = 'pointer';

    logoutBtn.addEventListener('click', () => {
        authStore.signOut();
    });

    container.appendChild(emailDisplay);
    container.appendChild(logoutBtn);
    return container;
}
