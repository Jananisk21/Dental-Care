require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
// razorpay and crypto removed
const { admin, db } = require('./server/firebaseAdmin');

const app = express();
const PORT = process.env.PORT || 3000;

// Razorpay Instance removed

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Authentication Middleware
const verifyToken = async (req, res, next) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
};

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// API Route: Book Appointment
app.post('/api/book-appointment', verifyToken, async (req, res) => {
    try {
        const { userId, userEmail, userName, bookingType, consultationMode, date, time, bookingEndTime, doctor, paymentStatus, paymentAmount, transactionId, meetingLink } = req.body;

        // 1. Validation for Paid Consultations
        if (['Online', 'Online Consultation', 'Emergency'].includes(bookingType)) {
            if (paymentStatus !== 'success') {
                return res.status(400).json({ success: false, message: 'Valid payment status required' });
            }
        }

        // 2. Save to Firestore
        const appointmentData = {
            userId,
            userName,
            userEmail,
            bookingType,
            consultationMode: consultationMode || 'NA',
            date,
            time,
            bookingEndTime: bookingEndTime || null,
            meetingLink: meetingLink || null,
            doctor: doctor || 'Unassigned',
            status: 'confirmed',
            paymentStatus: (bookingType === 'Online' || bookingType === 'Online Consultation') ? 'success' : 'not_required',
            paymentAmount: (bookingType === 'Online' || bookingType === 'Online Consultation') ? (paymentAmount || 200) : 0,
            transactionId: transactionId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('appointments').add(appointmentData);

        // 3. Send Immediate Confirmation Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmation: ${bookingType} - DentalCare+`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; color: #333;">
                    <h2 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Appointment Confirmed!</h2>
                    <p>Dear <strong>${userName}</strong>,</p>
                    <p>Your appointment has been successfully booked at <strong>DentalCare+</strong>.</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Consultation Type:</strong> ${bookingType}</p>
                        ${consultationMode !== 'NA' ? `<p style="margin: 5px 0;"><strong>Mode:</strong> ${consultationMode}</p>` : ''}
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${time} - ${bookingEndTime || 'N/A'}</p>
                        <p style="margin: 5px 0;"><strong>Doctor:</strong> ${doctor || 'Assigned Specialist'}</p>
                        ${meetingLink ? `
                            <p style="margin: 15px 0 5px 0;"><strong>Join Link (Video):</strong></p>
                            <a href="${meetingLink}" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Google Meet</a>
                        ` : ''}
                    </div>
    
                    <p style="color: #666; font-size: 0.9em;">Reference ID: ${docRef.id}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="text-align: center; color: #888; font-size: 0.85em;">&copy; 2026 DentalCare+. All Rights Reserved.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions).catch(err => console.error("Email failed:", err));

        // 4. Schedule 1-Hour Reminder
        const appointmentTime = new Date(`${date} ${time}`);
        const reminderTime = new Date(appointmentTime.getTime() - (60 * 60 * 1000)); // 1 hour before
        const now = new Date();

        if (reminderTime > now) {
            const delay = reminderTime.getTime() - now.getTime();
            setTimeout(() => {
                const reminderOptions = {
                    from: process.env.EMAIL_USER,
                    to: userEmail,
                    subject: `Reminder: Your ${bookingType} is in 1 hour!`,
                    html: `<p>Hi ${userName}, just a reminder that your appointment starts at ${time}. ${meetingLink ? `Join here: <a href="${meetingLink}">${meetingLink}</a>` : ''}</p>`
                };
                transporter.sendMail(reminderOptions).catch(err => console.error("Reminder failed:", err));
            }, delay);
        }

        res.json({ success: true, message: 'Appointment booked successfully', appointmentId: docRef.id });

    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
