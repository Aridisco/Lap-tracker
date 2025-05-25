const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Endpoint per salvare i dati
app.post('/save-data', (req, res) => {
    const data = req.body;
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `lap-times-${timestamp}.json`;
    const filepath = path.join(__dirname, 'data', filename);

    try {
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        res.json({ success: true, filename: filename });
    } catch (error) {
        console.error('Errore nel salvataggio del file:', error);
        res.status(500).json({ success: false, error: 'Errore nel salvataggio del file' });
    }
});

// Endpoint per ottenere la lista dei file disponibili
app.get('/list-files', (req, res) => {
    try {
        const files = fs.readdirSync(path.join(__dirname, 'data'))
            .filter(file => file.endsWith('.json'))
            .map(file => ({
                name: file,
                path: `/data/${file}`
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