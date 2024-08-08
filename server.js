import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRoast } from './roast.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 2 * 1024 * 1024 } }); // Changed to use temporary directory and set file size limit to 2MB

app.use(express.static(path.join(__dirname, 'public'))); // Added to serve static files

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/roast', upload.single('image'), async (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
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