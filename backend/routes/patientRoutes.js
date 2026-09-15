const express = require('express');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

const router = express.Router();
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SID;

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

router.post('/verify', (req, res) => {
    const { value } = req.body;

    if (!value) {
        return res.status(400).json({
            success: false,
            message: 'ABHA or mobile number is required'
        });
    }

    try {
        const patient = findPatient(value);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        res.json({
            success: true,
            message: 'Patient verified successfully',
            patient
        });

    } catch (error) {
        console.error('Patient verification error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to verify patient'
        });
    }
});


// ==========================================
// 2. SEND REAL OTP USING TWILIO
// ==========================================

router.post('/send-otp', async (req, res) => {
    const { value } = req.body;

    if (!value) {
        return res.status(400).json({
            success: false,
            message: 'ABHA or mobile number is required'
        });
    }

    try {

        // Find patient first
        const patient = findPatient(value);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Patient JSON contains Indian mobile number
        // Convert it to E.164 format for Twilio
        const phone = `+91${patient.mobile}`;

        const verification = await twilioClient.verify.v2
            .services(verifyServiceSid)
            .verifications
            .create({
                to: phone,
                channel: 'sms'
            });

        console.log(
            `[OTP] Sent to ${phone} | Status: ${verification.status}`
        );

        res.json({
            success: true,
            message: 'OTP sent successfully to registered mobile number'
        });

    } catch (error) {

        console.error(
            '[Twilio Send OTP Error]',
            error.code,
            error.message
        );

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send OTP'
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

        // Bypass for testing without a real phone number
        if (otp.trim() === '123456') {
            console.log(`[AUTH] Bypass OTP used for phone: ${phone}`);
            return res.json({
                success: true,
                message: 'OTP verified successfully (Bypass)',
                verified: true,
                patient
            });
        }

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