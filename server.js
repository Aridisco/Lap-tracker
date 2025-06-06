const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const dataDir = path.join(__dirname, 'data');

// Ensure the base data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use('/data', express.static(dataDir));

// Endpoint per salvare i dati
app.post('/save-data', (req, res) => {
    const { username, data } = req.body;
    if (!username || !Array.isArray(data)) {
        return res.status(400).json({ success: false, error: 'Dati non validi' });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `lap-times-${timestamp}.json`;
    const userDir = path.join(dataDir, username);

    try {
        fs.mkdirSync(userDir, { recursive: true });
        const filepath = path.join(userDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        res.json({ success: true, filename: `${username}/${filename}` });
    } catch (error) {
        console.error('Errore nel salvataggio del file:', error);
        res.status(500).json({ success: false, error: 'Errore nel salvataggio del file' });
    }
});

// Endpoint per ottenere la lista dei file disponibili
app.get('/list-files', (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ success: false, error: 'Username mancante' });
    }

    try {
        const userDir = path.join(dataDir, username);
        if (!fs.existsSync(userDir)) {
            return res.json([]);
        }

        const files = fs.readdirSync(userDir)
            .filter(file => file.endsWith('.json'))
            .map(file => ({
                name: file,
                path: `/data/${username}/${file}`
            }));
        res.json(files);
    } catch (error) {
        console.error('Errore nella lettura della directory:', error);
        res.status(500).json({ success: false, error: 'Errore nella lettura della directory' });
    }
});

app.listen(port, () => {
    console.log(`Server in esecuzione su http://localhost:${port}`);
}); 