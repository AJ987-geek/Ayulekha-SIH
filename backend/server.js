require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const patientRoutes = require('./routes/patientRoutes');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.json({
        message: 'AyuLekha Backend is running'
    });
});

// Patient routes
app.use('/api/patients', patientRoutes);

app.listen(PORT, () => {
    console.log(`AyuLekha backend running on http://localhost:${PORT}`);
});