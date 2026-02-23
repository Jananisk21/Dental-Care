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

        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
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
    const user = window.Auth ? window.Auth.checkSession() : null;
    const loginBtn = document.querySelector('.btn-login');

    if (user && loginBtn) {
        loginBtn.textContent = 'Dashboard';
        loginBtn.href = user.role === 'patient' ? 'dashboard-patient.html' :
            user.role === 'doctor' ? 'dashboard-doctor.html' : 'dashboard-admin.html';
        loginBtn.classList.remove('btn-login');
        loginBtn.classList.add('btn-primary'); // Make it look distinct
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
    const modal = document.getElementById("paymentModal");
    if (modal) {
        document.getElementById("payAmount").innerText = amount;
        modal.style.display = "block";
        currentBookingData = data;

        // Setup Close handlers here to ensure element exists
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
    }
}

function confirmPayment(method) {
    const modal = document.getElementById("paymentModal");
    const modalContent = modal.querySelector('.modal-content');
    const originalContent = modalContent.innerHTML;

    console.log(`Paying via ${method}`);

    // Show Processing State
    modalContent.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="spinner" style="margin-bottom: 20px;">
                <i class="fas fa-circle-notch fa-spin fa-3x" style="color: var(--primary-color);"></i>
            </div>
            <h3>Processing Payment...</h3>
            <p>Please wait while we confirm your transaction via ${method}.</p>
        </div>
    `;

    // Simulate API call
    setTimeout(() => {
        // Show Success State
        modalContent.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="margin-bottom: 20px;">
                    <i class="fas fa-check-circle fa-5x" style="color: #28a745;"></i>
                </div>
                <h3 style="color: #28a745;">Success!</h3>
                <p>Payment via ${method} Confirmed.</p>
                <p>Booking ID: #ORD-${Math.floor(Math.random() * 100000)}</p>
            </div>
        `;

        setTimeout(() => {
            if (modal) modal.style.display = "none";
            // Restore modal for next time
            setTimeout(() => { if (modalContent) modalContent.innerHTML = originalContent; }, 500);

            if (window.DB && currentBookingData) {
                currentBookingData.paymentStatus = 'Paid';
                currentBookingData.paymentMethod = method;
                window.DB.createAppointment(currentBookingData).then(res => {
                    // Redirect to dashboard
                    const user = window.Auth.checkSession();
                    if (user && user.role === 'patient') {
                        window.location.href = 'dashboard-patient.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                });
            }
        }, 2000);
    }, 1500);
}
