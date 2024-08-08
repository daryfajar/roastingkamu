import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { getRoast } from './roast.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ 
    dest: '/tmp/uploads/', 
    limits: { fileSize: 6 * 1024 * 1024 } // 6MB
}); // Fixed the syntax error here

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Added to serve static files

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/roast', upload.single('image'), async (req, res) => {
    const { 'cf-turnstile-response': token } = req.body; // Get token from body

    // Verify Turnstile token
    const secretKey = process.env.TURNSTILE_SECRET_KEY; // Replace with your Secret Key
    try {
        const response = await axios.post(`https://challenges.cloudflare.com/turnstile/v0/siteverify`, null, {
            params: {
                secret: secretKey,
                response: token,
            },
        });

        if (!response.data.success) {
            return res.status(400).json({ error: 'Turnstile verification failed' });
        }
    } catch (error) {
        console.error('Error verifying Turnstile token:', error);
        return res.status(500).json({ error: 'Error verifying Turnstile token' });
    }

    if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
    }
    if (req.file && req.file.size > 6 * 1024 * 1024) { // Check file size
        return res.status(400).json({ error: 'File size exceeds 6MB limit' });
    }
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        console.log('Received file:', req.file); // Log file information

        const roast = await getRoast(req.file);
        res.json({ roast });
    } catch (error) {
        console.error('Roasting error:', error); // Added error logging
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app; // Added for Vercel