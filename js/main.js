// --- Imports handled via script tags in HTML for this setup (js/firebase-config.js, js/auth.js, js/db.js) ---

document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Toggle ---
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu/Handle Toggles when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // If it's a dropdown toggle link (has # as href)
                if (link.getAttribute('href') === '#' || link.classList.contains('dropdown-toggle')) {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        link.parentElement.classList.toggle('active');
                        return; // Don't close the main menu
                    }
                }

                // Normal link: Close menu
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // --- Sticky Navbar ---
    const navbar = document.querySelector('.navbar');
    const sticky = navbar.offsetTop;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > sticky) {
            navbar.classList.add('sticky');
        } else {
            navbar.classList.remove('sticky');
        }
    });

    // --- Scroll Top Button ---
    const scrollTopBtn = document.querySelector('.scroll-top');

    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollTopBtn.style.opacity = '1';
                scrollTopBtn.style.pointerEvents = 'auto';
            } else {
                scrollTopBtn.style.opacity = '0';
                scrollTopBtn.style.pointerEvents = 'none';
            }
        });

        scrollTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- Search Toggle ---
    const searchIcon = document.querySelector('.search-icon');
    const searchFormWrapper = document.querySelector('.search-form-wrapper');

    if (searchIcon && searchFormWrapper) {
        searchIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent closing immediately
            searchFormWrapper.classList.toggle('active');
        });

        // Close search when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchFormWrapper.contains(e.target) && !searchIcon.contains(e.target)) {
                searchFormWrapper.classList.remove('active');
            }
        });
    }

    // --- Update Auth UI ---
    updateAuthUI();
});

function updateAuthUI() {
    // Current setup uses index.html inline script for landing page specific logic.
    // This fallback ensures other pages still get basic auth UI updates if they use the same classes.
    const stored = localStorage.getItem('dentCareUser');
    const user = stored ? JSON.parse(stored) : null;

    const guestLinks = document.querySelectorAll('.guest-only');
    const authLinks = document.querySelectorAll('.auth-only');

    if (user) {
        guestLinks.forEach(el => el.style.display = 'none');
        authLinks.forEach(el => el.style.display = 'block');

        // Update specific dashboard links if they exist
        const dashLink = document.getElementById('mainDashLink');
        if (dashLink) {
            dashLink.href = user.role === 'doctor' ? 'doctor-dashboard.html' : 'dashboard.html';
        }
    } else {
        guestLinks.forEach(el => el.style.display = 'block');
        authLinks.forEach(el => el.style.display = 'none');
    }
}

// ==========================================
// GLOBAL FUNCTIONS (Required for HTML onclick)
// ==========================================

// --- Appointment Tabs Logic ---
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-btn");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// --- Booking Handling ---
function handleBooking(event, type) {
    event.preventDefault();
    console.log(`Processing ${type} Booking...`);

    // Check Auth
    const user = window.Auth ? window.Auth.checkSession() : null;
    if (!user && type !== 'Emergency') {
        alert("Please Login to book an appointment.");
        window.location.href = 'login.html';
        return;
    }

    // Prepare Data
    const formData = {
        type: type,
        date: new Date().toISOString().split('T')[0], // Placeholder
        status: type === 'Emergency' ? 'Urgent' : 'Pending',
        paymentRequired: type !== 'Emergency',
        patientName: user ? user.name : "Guest",
        patientEmail: user ? user.email : "guest@example.com"
    };

    if (type === 'Emergency') {
        // Direct Submit for Emergency
        if (window.DB) {
            window.DB.createAppointment(formData).then(res => {
                alert("Emergency Request Sent! We will call you shortly.");
                window.location.reload();
            });
        }
    } else {
        // Payment Flow
        const amount = type === 'Direct' ? '$50' : '$30';
        showPaymentModal(amount, formData);
    }
}

// --- Payment Modal Logic ---
let currentBookingData = null;

function showPaymentModal(amount, data) {
    console.log("showPaymentModal called with amount:", amount, "data:", data);
    const modal = document.getElementById("paymentModal");
    if (modal) {
        console.log("Payment modal found in DOM.");
        document.getElementById("payAmount").innerText = amount;
        // modal.display = "block"; // Removed incorrect line
        modal.style.display = "block";
        currentBookingData = data;

        // Setup Close handlers
        const span = document.getElementsByClassName("close-modal")[0];
        if (span) {
            span.onclick = function () {
                modal.style.display = "none";
            }
        }
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    } else {
        console.error("Payment modal NOT found in DOM!");
        alert("Error: Payment system unavailable (Modal not found).");
    }
}

// Handle Form Submit
function processPayment(event) {
    event.preventDefault();
    const payBtn = document.querySelector('.pay-btn-confirm');
    const btnText = document.getElementById('payBtnText');

    // UI Loading State
    payBtn.disabled = true;
    btnText.innerHTML = '<div class="spinner"></div> Processing...';

    console.log("Processing secure payment...");

    // Simulate Payment Gateway Delay
    setTimeout(() => {
        // Success
        handlePaymentSuccess();
    }, 2000);
}

function handlePaymentSuccess() {
    const modalContent = document.querySelector('.modal-content');

    // Show Success State inside Modal
    modalContent.innerHTML = `
        <div style="text-align: center; padding: 40px; animation: fadeIn 0.5s;">
            <div style="margin-bottom: 20px;">
                <i class="fas fa-check-circle fa-5x" style="color: #28a745;"></i>
            </div>
            <h3 style="color: #1a1f36; margin-bottom: 10px;">Payment Successful!</h3>
            <p style="color: #697386; margin-bottom: 20px;">Your appointment has been confirmed.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin:0; font-weight:600; color:#1a1f36;">Transaction ID</p>
                <p style="margin:0; color:#697386; font-family: monospace;">TXN-${Math.floor(Math.random() * 10000000)}</p>
            </div>
        </div>
    `;

    // Finalize Booking
    if (window.DB && currentBookingData) {
        currentBookingData.paymentStatus = 'Paid';

        window.DB.createAppointment(currentBookingData).then(res => {
            if (res.success) {
                // Trigger Email Simulation
                sendEmailConfirmation(currentBookingData);

                // Redirect after brief delay
                setTimeout(() => {
                    const user = window.Auth.checkSession();
                    if (user && user.role === 'patient') {
                        window.location.href = 'dashboard-patient.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 3000);
            } else {
                alert("Booking Failed: " + res.message);
                window.location.reload();
            }
        });
    }
}

// --- Email Sending (via Node.js Backend) ---
async function sendEmailConfirmation(bookingDetails) {
    const emailData = {
        patientName: bookingDetails.patientName,
        patientEmail: bookingDetails.patientEmail,
        date: bookingDetails.date,
        type: bookingDetails.type,
        status: bookingDetails.status,
        amount: bookingDetails.type === 'Direct' ? '50' : '30'
    };

    console.log("Sending email request to backend...", emailData);

    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (jsonErr) {
            console.error("Failed to parse response as JSON:", text);
            return;
        }

        if (response.ok && result.success) {
            console.log("Email sent successfully!");
        } else {
            console.error("Failed to send email:", result.message);
        }
    } catch (error) {
        console.error("Error connecting to email server:", error);
    }
}
