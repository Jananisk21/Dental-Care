import re

# ── login.html ─────────────────────────────────────────────────────────────
with open(r'c:\Users\DELL\.gemini\antigravity\scratch\login.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Only add resendSignupBtn if not already present
if 'resendSignupBtn' not in content:
    old = (
        'style="display: none; margin-top: 14px;">Verify &amp; Create Account</button>\r\n'
        '\r\n'
        '                        <button class="btn-auth ghost" type="button" id="backToLogin">Back to Login</button>'
    )
    new = (
        'style="display: none; margin-top: 14px;">Verify &amp; Create Account</button>\r\n'
        '                        <button class="btn-auth ghost" type="button" id="resendSignupBtn"\r\n'
        '                            style="display: none; margin-top: 8px;">Resend OTP</button>\r\n'
        '\r\n'
        '                        <button class="btn-auth ghost" type="button" id="backToLogin">Back to Login</button>'
    )
    if old in content:
        content = content.replace(old, new, 1)
        print('[login.html] resendSignupBtn added OK')
    else:
        # Try with & instead of &amp;
        old2 = old.replace('&amp;', '&')
        new2 = new.replace('&amp;', '&')
        if old2 in content:
            content = content.replace(old2, new2, 1)
            print('[login.html] resendSignupBtn added OK (& variant)')
        else:
            # show context
            idx = content.find('verifySignupBtn')
            print('[login.html] NOT FOUND. Context:', repr(content[idx:idx+250]))
else:
    print('[login.html] resendSignupBtn already present – skipping')

with open(r'c:\Users\DELL\.gemini\antigravity\scratch\login.html', 'w', encoding='utf-8') as f:
    f.write(content)

# ── signup.html ─────────────────────────────────────────────────────────────
with open(r'c:\Users\DELL\.gemini\antigravity\scratch\signup.html', 'r', encoding='utf-8') as f:
    sc = f.read()

# Add resendLoginBtn to signup.html login section if missing
if 'resendLoginBtn' not in sc:
    old = (
        'style="display: none; margin-top: 14px;">Verify OTP</button>\r\n'
        '\r\n'
        '                        <div id="loginMsg" class="msg-auth"></div>'
    )
    new = (
        'style="display: none; margin-top: 14px;">Verify OTP</button>\r\n'
        '                        <button class="btn-auth ghost" type="button" id="resendLoginBtn"\r\n'
        '                            style="display: none; margin-top: 8px;">Resend OTP</button>\r\n'
        '\r\n'
        '                        <div id="loginMsg" class="msg-auth"></div>'
    )
    if old in sc:
        sc = sc.replace(old, new, 1)
        print('[signup.html] resendLoginBtn added OK')
    else:
        idx = sc.find('verifyLoginBtn')
        print('[signup.html] resendLoginBtn NOT FOUND. Context:', repr(sc[idx:idx+250]))

# Add resendSignupBtn to signup.html signup section if missing
if 'resendSignupBtn' not in sc:
    old = (
        'style="display: none; margin-top: 14px;">Verify &amp; Create Account</button>\r\n'
        '\r\n'
        '                        <button class="btn-auth ghost" type="button" id="backToLogin">Back to Login</button>'
    )
    new = (
        'style="display: none; margin-top: 14px;">Verify &amp; Create Account</button>\r\n'
        '                        <button class="btn-auth ghost" type="button" id="resendSignupBtn"\r\n'
        '                            style="display: none; margin-top: 8px;">Resend OTP</button>\r\n'
        '\r\n'
        '                        <button class="btn-auth ghost" type="button" id="backToLogin">Back to Login</button>'
    )
    if old in sc:
        sc = sc.replace(old, new, 1)
        print('[signup.html] resendSignupBtn added OK')
    else:
        old2 = old.replace('&amp;', '&')
        new2 = new.replace('&amp;', '&')
        if old2 in sc:
            sc = sc.replace(old2, new2, 1)
            print('[signup.html] resendSignupBtn added OK (& variant)')
        else:
            idx = sc.find('verifySignupBtn')
            print('[signup.html] resendSignupBtn NOT FOUND. Context:', repr(sc[idx:idx+250]))
else:
    print('[signup.html] resendSignupBtn already present – skipping')

# Now replace the script block in signup.html
SIGNUP_SCRIPT = '''    <!-- Firebase Auth Scripts -->
    <script type="module">
        import { auth, db } from './js/firebaseConfig.js';
        import { RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
        import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

        // \u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        function setMsg(id, type, text) {
            const el = document.getElementById(id);
            el.className = 'msg-auth';
            if (!text) { el.style.display = 'none'; el.textContent = ''; return; }
            el.style.display = 'block';
            el.classList.add(type);
            el.textContent = text;
        }
        function clearMsgs() { setMsg('loginMsg', '', ''); setMsg('signupMsg', '', ''); }

        function validatePhone(phone) {
            return /^\\+[1-9]\\d{7,14}$/.test(phone);
        }

        function startResendCountdown(btnId, seconds = 30) {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            btn.disabled = true;
            let remaining = seconds;
            btn.textContent = `Resend OTP (${remaining}s)`;
            const timer = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                    clearInterval(timer);
                    btn.disabled = false;
                    btn.textContent = 'Resend OTP';
                } else {
                    btn.textContent = `Resend OTP (${remaining}s)`;
                }
            }, 1000);
        }

        function makeRecaptcha(auth, containerId) {
            return new RecaptchaVerifier(auth, containerId, { 'size': 'invisible' });
        }

        // \u2500\u2500 Tab logic \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        const tabLogin   = document.getElementById('tabLogin');
        const tabSignup  = document.getElementById('tabSignup');
        const loginForm  = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');

        function showLogin() {
            tabLogin.classList.add('active');   tabSignup.classList.remove('active');
            loginForm.classList.add('active');  signupForm.classList.remove('active');
            document.title = "DentalCare+ | Login";
            clearMsgs();
        }
        function showSignup() {
            tabSignup.classList.add('active');  tabLogin.classList.remove('active');
            signupForm.classList.add('active'); loginForm.classList.remove('active');
            document.title = "DentalCare+ | Sign Up";
            clearMsgs();
        }

        tabLogin.addEventListener('click', showLogin);
        tabSignup.addEventListener('click', showSignup);
        document.getElementById('switchToSignup').addEventListener('click', (e) => { e.preventDefault(); showSignup(); });
        document.getElementById('backToLogin').addEventListener('click', showLogin);

        // Start on signup tab
        showSignup();

        // \u2500\u2500 LOGIN \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        let loginConfirmationResult = null;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('loginPhone').value.trim();
            if (!validatePhone(phone)) {
                setMsg('loginMsg', 'err', 'Enter a valid phone number with country code, e.g. +919876543210');
                return;
            }
            const btn = document.getElementById('loginBtn');
            btn.disabled = true; btn.textContent = 'Sending OTP...';
            clearMsgs();
            try {
                if (window.recaptchaVerifierLogin) { window.recaptchaVerifierLogin.clear(); window.recaptchaVerifierLogin = null; }
                window.recaptchaVerifierLogin = makeRecaptcha(auth, 'recaptcha-container-login');
                loginConfirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifierLogin);
                setMsg('loginMsg', 'ok', 'OTP sent to your phone.');
                document.getElementById('loginOtpSection').style.display = 'block';
                document.getElementById('verifyLoginBtn').style.display  = 'flex';
                document.getElementById('resendLoginBtn').style.display  = 'block';
                btn.style.display = 'none';
                startResendCountdown('resendLoginBtn');
            } catch (err) {
                setMsg('loginMsg', 'err', err.message);
                btn.disabled = false; btn.textContent = 'Send OTP';
                if (window.recaptchaVerifierLogin) { window.recaptchaVerifierLogin.clear(); window.recaptchaVerifierLogin = null; }
            }
        });

        document.getElementById('resendLoginBtn').addEventListener('click', async () => {
            const phone = document.getElementById('loginPhone').value.trim();
            if (!validatePhone(phone)) return;
            try {
                if (window.recaptchaVerifierLogin) { window.recaptchaVerifierLogin.clear(); window.recaptchaVerifierLogin = null; }
                window.recaptchaVerifierLogin = makeRecaptcha(auth, 'recaptcha-container-login');
                loginConfirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifierLogin);
                setMsg('loginMsg', 'ok', 'New OTP sent to your phone.');
                startResendCountdown('resendLoginBtn');
            } catch (err) {
                setMsg('loginMsg', 'err', 'Failed to resend OTP. Please try again.');
            }
        });

        document.getElementById('verifyLoginBtn').addEventListener('click', async () => {
            const otp = document.getElementById('loginOtp').value.trim();
            if (!otp) return alert('Please enter the OTP.');
            const btn = document.getElementById('verifyLoginBtn');
            btn.disabled = true; btn.textContent = 'Verifying...';
            clearMsgs();
            try {
                const result  = await loginConfirmationResult.confirm(otp);
                const user    = result.user;
                const docSnap = await getDoc(doc(db, 'users', user.uid));
                if (!docSnap.exists()) {
                    setMsg('loginMsg', 'err', 'Account not found. Please sign up first.');
                    btn.disabled = false; btn.textContent = 'Verify OTP';
                    return;
                }
                const userData = docSnap.data();
                const role     = userData.role || 'patient';
                localStorage.setItem('dentCareUser', JSON.stringify({
                    uid: user.uid, phone: user.phoneNumber,
                    role, name: userData.name || 'User', email: userData.email || ''
                }));
                setMsg('loginMsg', 'ok', 'Login successful! Redirecting...');
                setTimeout(() => {
                    if (role === 'admin')       window.location.href = 'admin-dashboard.html';
                    else if (role === 'doctor') window.location.href = 'doctor-dashboard.html';
                    else                        window.location.href = 'dashboard.html';
                }, 1000);
            } catch (err) {
                setMsg('loginMsg', 'err', 'Invalid OTP or verification failed.');
                btn.disabled = false; btn.textContent = 'Verify OTP';
            }
        });

        // \u2500\u2500 SIGNUP \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        let signupConfirmationResult = null;

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('signupPhone').value.trim();
            if (!validatePhone(phone)) {
                setMsg('signupMsg', 'err', 'Enter a valid phone number with country code, e.g. +919876543210');
                return;
            }
            const btn = document.getElementById('signupBtn');
            btn.disabled = true; btn.textContent = 'Sending OTP...';
            clearMsgs();
            try {
                if (window.recaptchaVerifierSignup) { window.recaptchaVerifierSignup.clear(); window.recaptchaVerifierSignup = null; }
                window.recaptchaVerifierSignup = makeRecaptcha(auth, 'recaptcha-container-signup');
                signupConfirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifierSignup);
                setMsg('signupMsg', 'ok', 'OTP sent to your phone.');
                document.getElementById('signupOtpSection').style.display = 'block';
                document.getElementById('verifySignupBtn').style.display  = 'flex';
                document.getElementById('resendSignupBtn').style.display  = 'block';
                btn.style.display = 'none';
                startResendCountdown('resendSignupBtn');
            } catch (err) {
                setMsg('signupMsg', 'err', err.message);
                btn.disabled = false; btn.textContent = 'Send OTP';
                if (window.recaptchaVerifierSignup) { window.recaptchaVerifierSignup.clear(); window.recaptchaVerifierSignup = null; }
            }
        });

        document.getElementById('resendSignupBtn').addEventListener('click', async () => {
            const phone = document.getElementById('signupPhone').value.trim();
            if (!validatePhone(phone)) return;
            try {
                if (window.recaptchaVerifierSignup) { window.recaptchaVerifierSignup.clear(); window.recaptchaVerifierSignup = null; }
                window.recaptchaVerifierSignup = makeRecaptcha(auth, 'recaptcha-container-signup');
                signupConfirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifierSignup);
                setMsg('signupMsg', 'ok', 'New OTP sent to your phone.');
                startResendCountdown('resendSignupBtn');
            } catch (err) {
                setMsg('signupMsg', 'err', 'Failed to resend OTP. Please try again.');
            }
        });

        document.getElementById('verifySignupBtn').addEventListener('click', async () => {
            const otp   = document.getElementById('signupOtp').value.trim();
            const name  = document.getElementById('signupName').value.trim();
            const phone = document.getElementById('signupPhone').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const role  = document.getElementById('signupRole').value;
            if (!otp) return alert('Please enter the OTP.');
            const btn = document.getElementById('verifySignupBtn');
            btn.disabled = true; btn.textContent = 'Verifying...';
            clearMsgs();
            try {
                const result = await signupConfirmationResult.confirm(otp);
                const user   = result.user;
                await setDoc(doc(db, 'users', user.uid), {
                    name, phone, email, role,
                    uid: user.uid,
                    createdAt: new Date().toISOString()
                });
                localStorage.setItem('dentCareUser', JSON.stringify({
                    uid: user.uid, phone, role, name, email
                }));
                setMsg('signupMsg', 'ok', 'Account created! Redirecting to dashboard...');
                setTimeout(() => {
                    window.location.href = role === 'admin' ? 'admin-dashboard.html'
                        : role === 'doctor' ? 'doctor-dashboard.html' : 'dashboard.html';
                }, 1500);
            } catch (err) {
                setMsg('signupMsg', 'err', 'Invalid OTP or verification failed.');
                btn.disabled = false; btn.textContent = 'Verify & Create Account';
            }
        });

        // Mobile Menu Toggle
        document.querySelector('.hamburger').addEventListener('click', () => {
            document.querySelector('.nav-menu').classList.toggle('active');
            document.querySelector('.hamburger').classList.toggle('active');
        });
    </script>

</body>

</html>'''

# Replace from the comment "<!-- Firebase Auth Scripts -->" to the end
marker = '    <!-- Firebase Auth Scripts -->'
idx = sc.rfind(marker)
if idx != -1:
    sc = sc[:idx] + SIGNUP_SCRIPT
    print('[signup.html] script block replaced OK')
else:
    print('[signup.html] script marker NOT FOUND')

with open(r'c:\Users\DELL\.gemini\antigravity\scratch\signup.html', 'w', encoding='utf-8') as f:
    f.write(sc)

print('All done!')
