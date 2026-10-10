const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const Patient = require('../models/Patient');
const SummaryShare = require('../models/SummaryShare');
const crypto = require('crypto');
const router = express.Router();
// ==========================================
// MULTER SETUP
// ==========================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

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

// ==========================================
// 1. CHECK DEMO ABHA / ROLL NUMBER
// ==========================================

router.post('/check-abha', async (req, res) => {
    const { abha } = req.body;

    if (!abha || !String(abha).trim()) {
        return res.status(400).json({
            success: false,
            message: 'ABHA ID is required'
        });
    }

    try {
        const normalizedAbha = String(abha).trim();

        // Check MongoDB first
        let patient = await Patient.findOne({
            abha: normalizedAbha
        }).lean();

        // Fallback to existing JSON data
        if (!patient) {
            const patients = getPatients();

            patient = patients.find(
                p => p.abha === normalizedAbha
            );

            // Import an existing JSON patient into MongoDB
            if (patient) {
                try {
                    const importedPatient = await Patient.findOneAndUpdate(
                        { abha: normalizedAbha },
                        { $set: patient },
                        {
                            new: true,
                            upsert: true,
                            runValidators: true,
                            setDefaultsOnInsert: true
                        }
                    );

                    patient = importedPatient.toObject();
                } catch (migrationError) {
                    console.error(
                        '[Patient Import Warning]',
                        migrationError.message
                    );
                    // Continue using the JSON record if import fails
                }
            }
        }

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

        console.log(`[PATIENT] New ABHA/demo ID: ${normalizedAbha}`);

        return res.json({
            success: true,
            exists: false,
            message: 'No patient found. Email verification required.'
        });

    } catch (error) {
        console.error('[ABHA Check Error]', error);

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

router.post('/register', async (req, res) => {
    const {
        abha,
        name,
        email,
        age,
        gender,
        allergies
    } = req.body;

    if (!abha || !String(abha).trim() || !name || !String(name).trim()) {
        return res.status(400).json({
            success: false,
            message: 'ABHA ID and name are required'
        });
    }

    try {
        const normalizedAbha = String(abha).trim();
        const normalizedName = String(name).trim();
        const normalizedEmail = String(email || '').trim();

        const patients = getPatients();

        // Look in MongoDB first, then check the existing JSON backup
        let patient = await Patient.findOne({
            abha: normalizedAbha
        });

        const existingJsonPatient = patients.find(
            p => p.abha === normalizedAbha
        );

        const updates = {
            name: normalizedName
        };

        if (email !== undefined) updates.email = normalizedEmail;
        if (age !== undefined && age !== '') updates.age = age;
        if (gender !== undefined && gender !== '') updates.gender = gender;
        if (allergies !== undefined) updates.allergies = allergies;

        let isNewPatient = false;

        if (patient) {
            // Update the existing MongoDB patient
            Object.assign(patient, updates);
            await patient.save();

        } else if (existingJsonPatient) {
            // Bring the existing JSON patient into MongoDB
            patient = new Patient({
                ...existingJsonPatient,
                ...updates
            });

            await patient.save();

        } else {
            // Generate a patient ID that is not already in use
            let number = 1;
            let patientId;

            while (true) {
                patientId = `P${String(number).padStart(3, '0')}`;

                const [mongoMatch, jsonMatch] = await Promise.all([
                    Patient.exists({ id: patientId }),
                    Promise.resolve(
                        patients.some(p => p.id === patientId)
                    )
                ]);

                if (!mongoMatch && !jsonMatch) break;

                number++;
            }

            patient = new Patient({
                id: patientId,
                name: normalizedName,
                abha: normalizedAbha,
                email: normalizedEmail,
                age: age || null,
                gender: gender || null,
                allergies: allergies || null,
                medicalHistory: [],
                records: []
            });

            await patient.save();
            isNewPatient = true;
        }

        // Keep the JSON file as a backup for existing routes
        const savedPatient = patient.toObject();
        const jsonIndex = patients.findIndex(
            p => p.abha === normalizedAbha
        );

        if (jsonIndex !== -1) {
            patients[jsonIndex] = {
                ...patients[jsonIndex],
                ...savedPatient
            };
        } else {
            patients.push(savedPatient);
        }

        fs.writeFileSync(
            patientsFile,
            JSON.stringify(patients, null, 2),
            'utf-8'
        );

        console.log(
            `[PATIENT] ${isNewPatient ? 'New patient registered' : 'Patient saved/updated'}: ${savedPatient.id}`
        );

        return res.status(isNewPatient ? 201 : 200).json({
            success: true,
            message: isNewPatient
                ? 'Patient registered successfully'
                : 'Patient updated successfully',
            patient: savedPatient
        });

    } catch (error) {
        console.error('[Patient Registration Error]', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This ABHA ID or patient ID already exists.'
            });
        }

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

// ==========================================
// 8. UPLOAD PATIENT RECORDS
// ==========================================

 // ==========================================
 // 8. UPLOAD PATIENT RECORDS — MONGODB
 // ==========================================

 router.post(
     '/:id/records',
     upload.array('records', 10),
     async (req, res) => {
         const { id } = req.params;
         const uploadedFiles = req.files || [];

         try {
             // Find patient in MongoDB
             let patient = await Patient.findOne({
                 $or: [
                     { id },
                     { rollNumber: id },
                     { abha: id }
                 ]
             });

             // Fall back to JSON for patients not yet in MongoDB
             if (!patient) {
                 const patients = getPatients();
                 const jsonPatient = patients.find(
                     p => p.id === id ||
                          p.rollNumber === id ||
                          p.abha === id
                 );

                 if (jsonPatient) {
                     patient = await Patient.findOneAndUpdate(
                         { abha: jsonPatient.abha },
                         { $set: jsonPatient },
                         {
                             new: true,
                             upsert: true,
                             runValidators: true,
                             setDefaultsOnInsert: true
                         }
                     );
                 }
             }

             if (!patient) {
                 // Remove files if no patient matches
                 for (const file of uploadedFiles) {
                     if (fs.existsSync(file.path)) {
                         fs.unlinkSync(file.path);
                     }
                 }

                 return res.status(404).json({
                     success: false,
                     error: 'Patient not found'
                 });
             }

             // Preserve all existing records
             const existingRecords = patient.records || [];

             const newRecords = uploadedFiles.map(file => ({
                 originalName: file.originalname,
                 filename: file.filename,
                 path: `/uploads/${file.filename}`,
                 mimetype: file.mimetype,
                 size: file.size,
                 uploadedAt: new Date().toISOString()
             }));

             patient.records = [
                 ...existingRecords,
                 ...newRecords
             ];

             await patient.save();

             console.log(
                 `[RECORDS] Saved ${newRecords.length} record(s) for ${patient.id}`
             );

             return res.json({
                 success: true,
                 message: 'Records uploaded successfully',
                 patientId: patient.id,
                 records: patient.records
             });

         } catch (error) {
             console.error('[Records Upload Error]', error);

             return res.status(500).json({
                 success: false,
                 error: 'Failed to upload patient records'
             });
         }
     }
 );


// ==========================================
// 8. GET SUMMARY BY ABHA / PATIENT IDENTIFIER
// ==========================================
const summariesFile = path.join(__dirname, '../data/summaries.json');

function getSummaries() {
    if (!fs.existsSync(summariesFile)) return {};
    try {
        return JSON.parse(fs.readFileSync(summariesFile, 'utf-8'));
    } catch (e) {
        return {};
    }
}

router.get('/:identifier/summary', (req, res) => {
    try {
        const identifier = (req.params.identifier || '').trim();
        const patients = getPatients();
        const patient = patients.find(
            p => (p.abha && p.abha.toLowerCase() === identifier.toLowerCase()) ||
                 (p.id && p.id.toLowerCase() === identifier.toLowerCase()) ||
                 (p.email && p.email.toLowerCase() === identifier.toLowerCase()) ||
                 (p.mobile && p.mobile === identifier)
        );

        const summaries = getSummaries();
        const abha = patient ? patient.abha : identifier;
        let summaryEntry = summaries[abha];

        if (!summaryEntry && patient) {
            summaryEntry = summaries[patient.id] || summaries[patient.email];
        }

        // Get records
        let records = [];
        const candidates = [identifier, abha, patient ? patient.id : null, patient ? patient.email : null].filter(Boolean);
        for (const cand of candidates) {
            const metaFile = path.join(__dirname, '../data/documents', cand, 'metadata.json');
            if (fs.existsSync(metaFile)) {
                try {
                    const data = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
                    records.push(...data);
                } catch (e) {}
            }
        }

        if (!patient && !summaryEntry) {
            return res.status(404).json({ error: `Patient not found for ABHA ID: ${identifier}` });
        }

        const patientData = patient || {
            id: summaryEntry ? summaryEntry.patientId : 'P001',
            name: summaryEntry ? summaryEntry.patientName : 'Patient',
            abha: abha,
            email: '',
            age: 30,
            gender: 'Unknown'
        };

        return res.json({
            success: true,
            patient: patientData,
            summary: summaryEntry ? summaryEntry.summary : (patientData.summary || null),
            vitals: summaryEntry ? summaryEntry.vitals : null,
            records: records,
            hasSummary: Boolean(summaryEntry || patientData.summary)
        });
    } catch (err) {
        console.error('Error fetching patient summary:', err);
        return res.status(500).json({ error: 'Failed to fetch patient summary' });
    }
});

router.post('/:identifier/summary', (req, res) => {
    try {
        const identifier = (req.params.identifier || '').trim();
        const { summary, vitals } = req.body;
        const patients = getPatients();
        const patient = patients.find(
            p => (p.abha && p.abha.toLowerCase() === identifier.toLowerCase()) ||
                 (p.id && p.id.toLowerCase() === identifier.toLowerCase()) ||
                 (p.email && p.email.toLowerCase() === identifier.toLowerCase())
        );

        const abha = patient ? patient.abha : identifier;
        const summaries = getSummaries();
        summaries[abha] = {
            abha: abha,
            patientId: patient ? patient.id : (summaries[abha]?.patientId || ''),
            patientName: patient ? patient.name : (summaries[abha]?.patientName || 'Patient'),
            summary: summary,
            vitals: vitals || summaries[abha]?.vitals || {},
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(summariesFile, JSON.stringify(summaries, null, 2), 'utf-8');

        return res.json({
            success: true,
            message: `Clinical summary connected to ABHA ID ${abha} successfully`,
            abha: abha
        });
    } catch (err) {
        console.error('Error saving patient summary:', err);
        return res.status(500).json({ error: 'Failed to save summary' });
    }
});

/* ==========================================
   CREATE TEMPORARY SUMMARY SHARE LINK
========================================== */

router.post('/:identifier/share', async (req, res) => {
    try {
        const identifier = String(req.params.identifier || '').trim();

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Patient identifier is required'
            });
        }

        // Find the existing patient record.
        const patients = getPatients();

        const patient = patients.find(p =>
            (p.abha && p.abha.toLowerCase() === identifier.toLowerCase()) ||
            (p.id && p.id.toLowerCase() === identifier.toLowerCase()) ||
            (p.email && p.email.toLowerCase() === identifier.toLowerCase()) ||
            (p.mobile && p.mobile === identifier)
        );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Find the saved summary.
        const summaries = getSummaries();
        const summaryKey = patient.abha || identifier;
        const summaryEntry =
            summaries[summaryKey] ||
            summaries[patient.id] ||
            summaries[patient.email];

        if (!summaryEntry || !summaryEntry.summary) {
            return res.status(404).json({
                success: false,
                message: 'No saved summary found for this patient'
            });
        }

        // Generate an unpredictable token; store only its hash.
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await SummaryShare.create({
            tokenHash,
            patientId: patient.id,
            summaryKey,
            expiresAt
        });

        // Use the frontend URL, not the backend URL.
        const frontendUrl = (
            process.env.FRONTEND_URL || 'http://localhost:5173'
        ).replace(/\/+$/, '');

        const shareUrl =
            `${frontendUrl}/shared-summary/${token}`;

        return res.status(201).json({
            success: true,
            shareUrl,
            expiresAt
        });

    } catch (error) {
        console.error('[Summary Share Error]', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to create summary share link'
        });
    }
});

/* ==========================================
   VIEW SHARED SUMMARY USING TOKEN
========================================== */

router.get('/shared/:token', async (req, res) => {
    try {
        const token = String(req.params.token || '');

        if (!/^[a-f0-9]{64}$/i.test(token)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid share link'
            });
        }

        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const share = await SummaryShare.findOne({
            tokenHash,
            revokedAt: null,
            expiresAt: { $gt: new Date() }
        }).lean();

        if (!share) {
            return res.status(410).json({
                success: false,
                message: 'This share link has expired or been revoked'
            });
        }

        const patients = getPatients();
        const patient = patients.find(
            p => p.id === share.patientId
        );

        const summaries = getSummaries();
        const entry = summaries[share.summaryKey];

        if (!patient || !entry || !entry.summary) {
            return res.status(404).json({
                success: false,
                message: 'Shared summary is no longer available'
            });
        }

        // Return only the information intended for the share page.
        return res.json({
            success: true,
            expiresAt: share.expiresAt,
            patient: {
                name: patient.name,
                age: patient.age,
                gender: patient.gender
            },
            summary: entry.summary,
            vitals: entry.vitals || {}
        });

    } catch (error) {
        console.error('[Shared Summary View Error]', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to load shared summary'
        });
    }
});

module.exports = router;