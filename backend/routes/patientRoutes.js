const express = require('express');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const router = express.Router();
const emailOtps = {};
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);



const patientsFile = path.join(__dirname, '../data/patients.json');

// ==========================================
// TWILIO CLIENT
// ==========================================



const verifyServiceSid = process.env.TWILIO_VERIFY_SID;


// ==========================================
// HELPER: FIND PATIENT
// ==========================================

function findPatient(value) {
    const patients = JSON.parse(
        fs.readFileSync(patientsFile, 'utf-8')
    );

    return patients.find(
        p => p.mobile === value || p.abha === value
    );
}


// ==========================================
// 1. VERIFY PATIENT
// ==========================================

// ==========================================
// 3. VERIFY EMAIL OTP
// ==========================================

router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: 'Email and OTP are required'
        });
    }

    const storedOtp = emailOtps[email];

    if (!storedOtp) {
        return res.status(400).json({
            success: false,
            message: 'No OTP found. Please request a new OTP.'
        });
    }

    if (Date.now() > storedOtp.expiresAt) {
        delete emailOtps[email];

        return res.status(400).json({
            success: false,
            message: 'OTP expired. Please request a new OTP.'
        });
    }

    if (storedOtp.otp !== otp.trim()) {
        return res.status(401).json({
            success: false,
            message: 'Invalid OTP'
        });
    }

    // OTP is correct
    delete emailOtps[email];

    console.log(`[AUTH] Email verified successfully: ${email}`);

    res.json({
        success: true,
        message: 'Email verified successfully',
        verified: true,
        email
    });
});


// ==========================================
// 2. SEND REAL OTP USING TWILIO
// ==========================================

// ==========================================
// 2. SEND OTP TO EMAIL
// ==========================================

router.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email address is required'
        });
    }

    try {
        // Generate a 6-digit OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // Store OTP for 5 minutes
        emailOtps[email] = {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000
        };

        await emailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'AyuLekha Email Verification OTP',
            text: `Your AyuLekha verification OTP is ${otp}. This OTP is valid for 5 minutes.`
        });

        console.log(`[OTP] Email sent to ${email}`);

        res.json({
            success: true,
            message: 'OTP sent successfully to your email'
        });

    } catch (error) {
    console.error('[Email OTP Error]');
    console.error(error);

    res.status(500).json({
        success: false,
        message: error.message || 'Failed to send OTP email'
    });
}
});


// ==========================================
// 3. VERIFY REAL OTP USING TWILIO
// ==========================================

router.post('/verify-otp', async (req, res) => {
    const { value, otp } = req.body;

    if (!value || !otp) {
        return res.status(400).json({
            success: false,
            message: 'Patient identifier and OTP are required'
        });
    }

    try {

        // Find patient
        const patient = findPatient(value);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        const phone = `+91${patient.mobile}`;

        const result = await twilioClient.verify.v2
            .services(verifyServiceSid)
            .verificationChecks
            .create({
                to: phone,
                code: otp.trim()
            });

        if (result.status === 'approved') {

            console.log(
                `[AUTH] Phone verified successfully: ${phone}`
            );

            return res.json({
                success: true,
                message: 'OTP verified successfully',
                verified: true,
                patient
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid OTP',
            verified: false
        });

    } catch (error) {

        console.error(
            '[Twilio Verify OTP Error]',
            error.code,
            error.message
        );

        if (error.code === 20404) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired or already used. Please request a new OTP.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'OTP verification failed'
        });
    }
});


// ==========================================
// 4. SAVE CLINICAL CONSENT
// ==========================================

router.post('/consent', (req, res) => {
    const { patientId, consent } = req.body;

    if (!patientId) {
        return res.status(400).json({
            success: false,
            message: 'Patient ID is required'
        });
    }

    if (typeof consent !== 'boolean') {
        return res.status(400).json({
            success: false,
            message: 'Consent must be true or false'
        });
    }

    const consentsFile = path.join(
        __dirname,
        '../data/consents.json'
    );

    let consents = [];

    try {

        if (fs.existsSync(consentsFile)) {
            consents = JSON.parse(
                fs.readFileSync(consentsFile, 'utf-8')
            );
        }

        const consentRecord = {
            patientId,
            consent,
            timestamp: new Date().toISOString()
        };

        consents.push(consentRecord);

        fs.writeFileSync(
            consentsFile,
            JSON.stringify(consents, null, 2)
        );

        res.json({
            success: true,
            message: 'Clinical consent recorded successfully',
            consent: consentRecord
        });

    } catch (error) {

        console.error('Consent error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to save clinical consent'
        });
    }
});


// ==========================================
// 5. SAVE CLINICAL STORY
// ==========================================

router.post('/story', (req, res) => {
    const { patientId, story, symptoms } = req.body;

    if (!patientId || !story) {
        return res.status(400).json({
            success: false,
            message: 'Patient ID and story are required'
        });
    }

    console.log('Patient Story Received:', {
        patientId,
        story,
        symptoms
    });

    res.json({
        success: true,
        message: 'Clinical story recorded successfully',
        story: {
            patientId,
            story,
            symptoms: symptoms || [],
            status: 'recorded'
        }
    });
});


module.exports = router;