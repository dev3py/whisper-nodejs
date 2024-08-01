const express = require('express');
const axios = require('axios');
const fs = require('fs');
const { execFile } = require('child_process');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(express.json());

const WHISPER_MODEL_PATH = "../whisper/ggml-model-whisper-base.en.bin";
const WHISPER_COMMAND = path.resolve('../whisper/main');

const transcribeAudio = (filePath) => {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        execFile(WHISPER_COMMAND, [
            '-m', WHISPER_MODEL_PATH,
            '-f', filePath,
            '-nt', // No timestamps
            '-t', '4', // Use 20 threads
            '-p', '1', // Use 4 processors
            // '-bo', '8', // Best of 8 candidates
            // '-bs', '8', // Beam size of 8
            // '-tp', '0.5', // Temperature 0.5
            // '-mc', '2048', // Max context tokens
            // '-ml', '500' // Max segment length
        ], (error, stdout, stderr) => {
            const end = Date.now();
            console.log(`Transcription time: ${end - start} ms`);
            if (error) {
                console.error(`Error during transcription: ${stderr}`);
                reject(error);
            } else {
                console.log(`Command output: ${stdout}`);
                resolve(stdout);
            }
        });
    });
};

const downloadFile = async (url, localPath) => {
    const start = Date.now();
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);
        writer.on('finish', () => {
            const end = Date.now();
            console.log(`Download time: ${end - start} ms`);
            resolve();
        });
        writer.on('error', (error) => {
            console.error(`Error downloading file: ${error.message}`);
            reject(error);
        });
    });
};

app.post('/transcribe', upload.single('audio'), async (req, res) => {
    const startTotal = Date.now();

    let filePath = '';

    try {
        if (req.body.url) {
            const url = req.body.url;
            filePath = path.join('uploads', path.basename(url, path.extname(url)) + '.wav');
            await downloadFile(url, filePath);
            console.log('filepath1===', filePath);
        } else if (req.file) {
            filePath = req.file.path;
            console.log('filepath===', filePath);
        } else {
            return res.status(400).json({ error: 'No URL or file provided' });
        }
        const transcription = await transcribeAudio(filePath);
        fs.unlinkSync(filePath); // Clean up the file

        const endTotal = Date.now();
        console.log(`Total processing time: ${endTotal - startTotal} ms`);

        res.json({ transcription });
    } catch (error) {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Clean up the file in case of an error
        }
        res.status(500).json({ error: 'Transcription failed', details: error.message });
    }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
