const fs = require('fs');

try {
    let indexHtml = fs.readFileSync('index.html', 'utf8');

    // Replace everything between <!-- Hero Section --> and <!-- Footer & Newsletter --> (or <!-- Footer -->)
    const heroRegex = /<!-- Hero Section -->[\s\S]*?(?=<!-- Footer)/;

    const privacyContent = `
    <!-- Privacy Policy Section -->
    <section class="section" style="padding: 120px 0 60px; background: #f8fafc; min-height: 50vh;">
        <div class="container">
            <div style="max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <h1 style="color: #0f172a; margin-bottom: 24px; font-size: 32px; font-weight: 700;">Privacy Policy</h1>
                <p style="color: #475569; line-height: 1.8; font-size: 16px; margin-bottom: 16px;">
                    We collect user information such as phone number and email for authentication and appointment services.
                </p>
                <p style="color: #475569; line-height: 1.8; font-size: 16px;">
                    We do not share user data with third parties.
                </p>
            </div>
        </div>
    </section>
`;

    let privacyHtml = indexHtml.replace(heroRegex, Object.isExtensible ? privacyContent : privacyContent);
    privacyHtml = privacyHtml.replace('<title>DentalCare+ - Best Dental Clinic</title>', '<title>DentalCare+ - Privacy Policy</title>');

    fs.writeFileSync('privacy.html', privacyHtml);

    // List of files to update with the privacy link
    const filesToUpdate = ['index.html', 'about.html', 'contact.html', 'doctor-settings.html', 'login.html', 'pricing.html', 'signup.html', 'services.html', 'team.html', 'testimonial.html', 'privacy.html', 'appointment.html'];

    let count = 0;
    filesToUpdate.forEach(file => {
        if(fs.existsSync(file)) {
            let content = fs.readFileSync(file, 'utf8');
            if(!content.includes('privacy.html')) {
                // Find contact us link in the footer usually placed under Quick Links
                content = content.replace(/(<li>\s*<a[^>]*href="contact\.html"[^>]*>Contact Us<\/a>\s*<\/li>)/, '$1\n                        <li><a href="privacy.html">Privacy Policy</a></li>');
                fs.writeFileSync(file, content);
                count++;
            }
        }
    });

    console.log('Successfully created privacy.html and updated ' + count + ' files with the footer link.');
} catch (e) {
    console.error("Error:", e);
}
