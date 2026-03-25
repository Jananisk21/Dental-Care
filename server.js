require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { admin, db } = require("./server/firebaseAdmin");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const PORT = process.env.PORT || 3000;

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "/")));

// Authentication Middleware
const verifyToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  if (!idToken) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }
};

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// API Route: Create Razorpay Order
app.post("/api/create-order", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body; // amount in INR
    const options = {
      amount: 100, // Minimal amount of ₹1 (100 paise) instead of actual fee
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
});

// API Route: Verify Razorpay Payment
app.post("/api/verify-payment", verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Verification error" });
  }
});

// API Route: Book Appointment
app.post("/api/book-appointment", verifyToken, async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      userName,
      bookingType,
      consultationMode,
      service,
      date,
      time,
      bookingEndTime,
      doctor,
      doctorId,
      paymentStatus,
      paymentAmount,
      transactionId,
      meetingLink,
    } = req.body;

    // 1. Validation for Paid Consultations
    if (["Online", "Online Consultation", "Emergency"].includes(bookingType)) {
      if (paymentStatus !== "success") {
        return res
          .status(400)
          .json({ success: false, message: "Valid payment status required" });
      }
    }

    // Generate Fallback Meeting Link if missing for online types
    let finalMeetingLink = meetingLink;
    if (
      ["Online", "Online Consultation", "Emergency"].includes(bookingType) &&
      !finalMeetingLink
    ) {
      // First try to fetch doctor's preferred link
      if (doctorId) {
        try {
          const docSnap = await db.collection("users").doc(doctorId).get();
          if (docSnap.exists() && docSnap.data().preferredMeetingLink) {
            finalMeetingLink = docSnap.data().preferredMeetingLink;
          }
        } catch (err) {
          console.error("Error fetching doctor's preferred link:", err);
        }
      }

      // If still missing, fallback to Jitsi
      if (!finalMeetingLink) {
        const randomId = Math.random().toString(36).substring(2, 10);
        finalMeetingLink = `https://meet.jit.si/DentalCare-Consultation-${randomId}`;
      }
    }

    // 2. Save to Firestore
    const appointmentData = {
      userId,
      userName,
      userEmail,
      bookingType,
      consultationMode: consultationMode || "NA",
      service: service || "General Consultation",
      date,
      time,
      bookingEndTime: bookingEndTime || null,
      meetingLink: finalMeetingLink || null,
      doctorId: doctorId || null,
      doctor: doctor || "Unassigned",
      status: bookingType === "Emergency" ? "pending" : "confirmed",
      paymentStatus:
        bookingType === "Online" ||
        bookingType === "Online Consultation" ||
        bookingType === "Emergency"
          ? paymentStatus || "not_required"
          : "not_required",
      paymentAmount:
        bookingType === "Online" || bookingType === "Online Consultation"
          ? paymentAmount || 200
          : bookingType === "Emergency"
            ? paymentAmount || 500
            : 0,
      transactionId: transactionId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("appointments").add(appointmentData);

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
                        ${consultationMode !== "NA" ? `<p style="margin: 5px 0;"><strong>Mode:</strong> ${consultationMode}</p>` : ""}
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${time} - ${bookingEndTime || "N/A"}</p>
                        <p style="margin: 5px 0;"><strong>Doctor:</strong> ${doctor || "Assigned Specialist"}</p>
                        ${
                          meetingLink
                            ? `
                            <p style="margin: 15px 0 5px 0;"><strong>Join Link (Video):</strong></p>
                            <a href="${meetingLink}" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Google Meet</a>
                        `
                            : ""
                        }
                    </div>
    
                    <p style="color: #666; font-size: 0.9em;">Reference ID: ${docRef.id}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="text-align: center; color: #888; font-size: 0.85em;">&copy; 2026 DentalCare+. All Rights Reserved.</p>
                </div>
            `,
    };

    transporter
      .sendMail(mailOptions)
      .catch((err) => console.error("Email failed:", err));

    // 4. Persistence: The background job below handles reminders robustly
    res.json({
      success: true,
      message: "Appointment booked successfully",
      appointmentId: docRef.id,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res
      .status(500)
      .json({ success: false, message: "Error booking appointment" });
  }
});

// API Route: Cancel Appointment
app.post("/api/cancel-appointment/:appId", verifyToken, async (req, res) => {
  try {
    const { appId } = req.params;
    const appRef = db.collection("appointments").doc(appId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const appData = appDoc.data();

    // Security check: Only patient or assigned doctor can cancel
    if (appData.userId !== req.user.uid && appData.doctorId !== req.user.uid) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    await appRef.update({
      status: "cancelled",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to cancel appointment" });
  }
});

// API Route: Verify Chat/Video Access
app.get("/api/verify-consultation/:appId", verifyToken, async (req, res) => {
  try {
    const { appId } = req.params;
    const appDoc = await db.collection("appointments").doc(appId).get();

    if (!appDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Consultation not found" });
    }

    const app = appDoc.data();
    const userId = req.user.uid;

    // Security Check: User must be the Patient or the assigned Doctor
    const isPatient = app.userId === userId;
    const isDoctor = app.doctorId === userId;

    if (!isPatient && !isDoctor) {
      return res
        .status(403)
        .json({ success: false, message: "Security Breach: Access Denied" });
    }

    // Validity Check: Must be confirmed
    if (app.status !== "confirmed") {
      return res
        .status(400)
        .json({ success: false, message: "Consultation is not confirmed yet" });
    }

    res.json({ success: true, appointment: app });
  } catch (error) {
    console.error("Error verifying consultation:", error);
    res.status(500).json({ success: false, message: "Verify Error" });
  }
});

// API Route: Submit Emergency
app.post("/api/submit-emergency", verifyToken, async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      contact,
      type,
      issue,
      location,
      imageBase64,
      mimeType
    } = req.body;

    let aiGuidance = "No AI guidance available at this time.";

    if (ai) {
      try {
        const prompt = `You are an AI dental and medical assistant. A patient has reported an emergency.
Type: ${type}
Description: ${issue}
Please provide immediate, brief, and practical first-aid guidance or suggestions for the patient while they wait for the clinic to contact them. Keep it under 4 sentences. Be professional and reassuring.`;

        let contents = [];
        if (imageBase64) {
          contents = [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: imageBase64
                  }
                }
              ]
            }
          ];
        } else {
          contents = [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ];
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents
        });

        if (response && response.text) {
          aiGuidance = response.text;
        }
      } catch (aiError) {
        console.error("Gemini API Error:", aiError);
        aiGuidance = "Unable to fetch AI guidance at the moment. Please remain calm, apply basic first aid based on your symptoms, and wait for our clinical team to contact you immediately.";
      }
    } else {
      console.warn("GEMINI_API_KEY not found. Skipping AI guidance.");
    }

    // Save to Firestore
    const requestData = {
      patientId,
      patientName,
      contact,
      type,
      issue,
      location: location || "Not provided",
      status: "Pending",
      aiGuidance,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("emergency_requests").add(requestData);

    // Send Admin Notification Email
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Sending to clinic/admin email
        subject: `URGENT: New Emergency Request - ${type}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #e53e3e; border-radius: 8px;">
                <h2 style="color: #e53e3e;">🚨 Emergency Request Alert</h2>
                <p><strong>Patient:</strong> ${patientName}</p>
                <p><strong>Contact:</strong> ${contact}</p>
                <p><strong>Type:</strong> ${type}</p>
                <p><strong>Description:</strong> ${issue}</p>
                <p><strong>Location:</strong> ${location || 'Not provided'}</p>
                <p style="margin-top:20px; color:#555;">Please log in to the admin dashboard to respond immediately.</p>
            </div>
        `
      };
      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error("Failed to send admin emergency email:", emailErr);
    }

    res.json({
      success: true,
      message: "Emergency request submitted successfully",
      requestId: docRef.id,
      aiGuidance: aiGuidance
    });

  } catch (error) {
    console.error("Emergency submit error:", error);
    res.status(500).json({ success: false, message: "Failed to submit emergency request" });
  }
});

// Background Job: Professional Reminder System (Every 10 min)
setInterval(
  async () => {
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Find confirmed appointments in the next hour that haven't had a reminder
      const snap = await db
        .collection("appointments")
        .where("status", "==", "confirmed")
        .where("reminderSent", "!=", true)
        .get();

      snap.forEach(async (doc) => {
        const app = doc.data();
        const appTime = new Date(`${app.date} ${app.time}`);

        // If it's within the 1-hour window
        if (appTime > now && appTime <= oneHourLater) {
          console.log(
            `Sending reminder to ${app.userEmail} for appt at ${app.time}`,
          );

          const reminderOptions = {
            from: process.env.EMAIL_USER,
            to: app.userEmail,
            subject: "Dental Consultation Reminder",
            html: `
                        <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px;">
                            <h2 style="color: #007bff;">Consultation Reminder</h2>
                            <p>Dear <strong>${app.userName}</strong>,</p>
                            <p>You have a <strong>${app.bookingType}</strong> scheduled at <strong>${app.time}</strong> today.</p>
                            
                            ${
                              app.meetingLink
                                ? `
                                <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p>Join using the link below:</p>
                                    <a href="${app.meetingLink}" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Video Consultation</a>
                                </div>
                            `
                                : ""
                            }
                            
                            <p>You can also join from your <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard.html">Dashboard</a>.</p>
                            <p style="color: #888; font-size: 0.85em;">&copy; 2026 DentalCare+</p>
                        </div>
                    `,
          };

          await transporter.sendMail(reminderOptions);
          await db
            .collection("appointments")
            .doc(doc.id)
            .update({ reminderSent: true });
        }
      });
    } catch (err) {
      console.error("Reminder check failed:", err);
    }
  },
  10 * 60 * 1000,
);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
