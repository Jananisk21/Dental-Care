for fname in ['login.html', 'signup.html']:
    c = open(fname, 'r', encoding='utf-8').read()
    checks = {
        'resendLoginBtn HTML': 'id="resendLoginBtn"' in c,
        'resendSignupBtn HTML': 'id="resendSignupBtn"' in c,
        'invisible reCAPTCHA': "size': 'invisible" in c,
        'validatePhone fn': 'validatePhone' in c,
        'startResendCountdown fn': 'startResendCountdown' in c,
        'localStorage in signup block': 'dentCareUser' in c and 'signupConfirmationResult' in c,
        'makeRecaptcha fn': 'makeRecaptcha' in c,
    }
    print(f'=== {fname} ===')
    for k, v in checks.items():
        print(f'  [{"OK" if v else "FAIL"}] {k}')
    print()
