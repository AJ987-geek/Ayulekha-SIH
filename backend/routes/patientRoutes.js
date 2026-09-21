const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const router = express.Router();

// ==========================================
// FILE PATHS
// ==========================================

const patientsFile = path.join(
    __dirname,
    '../data/patients.json'
);

const consentsFile = path.join(
    __dirname,
    '../data/consents.json'
);

// ==========================================
// EMAIL OTP STORAGE
// ==========================================

const emailOtps = {};

// ==========================================
// EMAIL TRANSPORTER
// ==========================================

const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// ==========================================
// HELPER: READ PATIENTS
// ==========================================

function getPatients() {
    return JSON.parse(
        fs.readFileSync(patientsFile, 'utf-8')
    );
}

// ==========================================
// 1. CHECK DEMO ABHA / ROLL NUMBER
// ==========================================

router.post('/check-abha', (req, res) => {
    const { abha } = req.body;

    if (!abha) {
        return res.status(400).json({
            success: false,
            message: 'ABHA ID is required'
        });
    }

    try {
        const patients = getPatients();

        const patient = patients.find(
            p => p.abha === abha.trim()
        );

        if (patient) {
            console.log(
                `[PATIENT] Existing patient found: ${patient.id}`
            );

            return res.json({
                success: true,
                exists: true,
                patient,
                medicalHistory: patient.medicalHistory || []
            });
        }

        console.log(
            `[PATIENT] New ABHA/demo ID: ${abha}`
        );

        return res.json({
            success: true,
            exists: false,
            message: 'No patient found. Email verification required.'
        });

    } catch (error) {

        console.error(
            '[ABHA Check Error]',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to check patient ID'
        });
    }
});

// ==========================================
// 2. SEND EMAIL OTP
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

        // Generate 6-digit OTP
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

        console.log(
            `[OTP] Email sent to ${email}`
        );

        return res.json({
            success: true,
            message: 'OTP sent successfully to your email'
        });

    } catch (error) {

        console.error(
            '[Email OTP Error]',
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message ||
                'Failed to send OTP email'
        });
    }
});

// ==========================================
// 3. VERIFY EMAIL OTP
// ==========================================

router.post('/verify-email-otp', (req, res) => {
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

    console.log(
        `[AUTH] Email verified successfully: ${email}`
    );

    return res.json({
        success: true,
        message: 'Email verified successfully',
        verified: true,
        email
    });
});

// ==========================================
// 4. REGISTER NEW PATIENT
// ==========================================

router.post('/register', (req, res) => {

    const {
        abha,
        name,
        email,
        age,
        gender
    } = req.body;

    if (!abha || !name || !email) {
        return res.status(400).json({
            success: false,
            message: 'ABHA ID, name and email are required'
        });
    }

    try {

        const patients = getPatients();

        // Check duplicate ABHA
        const existingPatient = patients.find(
            p => p.abha === abha.trim()
        );

        if (existingPatient) {
            return res.status(409).json({
                success: false,
                message: 'Patient with this ABHA ID already exists'
            });
        }

        // Generate new patient ID
        const patientId = `P${String(
            patients.length + 1
        ).padStart(3, '0')}`;

        const newPatient = {
            id: patientId,
            name: name.trim(),
            abha: abha.trim(),
            email: email.trim(),
            age: age || null,
            gender: gender || null,
            medicalHistory: []
        };

        patients.push(newPatient);

        fs.writeFileSync(
            patientsFile,
            JSON.stringify(
                patients,
                null,
                2
            )
        );

        console.log(
            `[PATIENT] New patient registered: ${patientId}`
        );

        return res.status(201).json({
            success: true,
            message: 'Patient registered successfully',
            patient: newPatient
        });

    } catch (error) {

        console.error(
            '[Patient Registration Error]',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to register patient'
        });
    }
});

// ==========================================
// 5. SAVE CLINICAL CONSENT
// ==========================================

router.post('/consent', (req, res) => {

    const {
        patientId,
        consent
    } = req.body;

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

    let consents = [];

    try {

        if (fs.existsSync(consentsFile)) {
            consents = JSON.parse(
                fs.readFileSync(
                    consentsFile,
                    'utf-8'
                )
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
            JSON.stringify(
                consents,
                null,
                2
            )
        );

        return res.json({
            success: true,
            message: 'Clinical consent recorded successfully',
            consent: consentRecord
        });

    } catch (error) {

        console.error(
            '[Consent Error]',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to save clinical consent'
        });
    }
});

// ==========================================
// 6. SAVE CLINICAL STORY
// ==========================================

router.post('/story', (req, res) => {

    const {
        patientId,
        story,
        symptoms
    } = req.body;

    if (!patientId || !story) {
        return res.status(400).json({
            success: false,
            message: 'Patient ID and story are required'
        });
    }

    console.log(
        'Patient Story Received:',
        {
            patientId,
            story,
            symptoms
        }
    );

    return res.json({
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

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;