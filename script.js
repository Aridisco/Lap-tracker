// Classe per gestire i tempi dei giri
class LapTimeManager {
    constructor() {
        // Carica i dati esistenti e sposta tutti i giri nella Sessione 1
        this.laps = JSON.parse(localStorage.getItem('lapTimes')) || [];
        this.laps = this.laps.map(lap => ({
            ...lap,
            session: lap.session || 'Sessione 1',
            lapNumber: lap.lapNumber || 1 // Aggiungi numero giro se non esiste
        }));
        
        this.form = document.getElementById('lapForm');
        this.editForm = document.getElementById('editForm');
        this.trackFilter = document.getElementById('trackFilter');
        this.sessionFilter = document.getElementById('sessionFilter');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.fileInput = document.getElementById('fileInput');
        this.modal = document.getElementById('editModal');
        this.closeModal = document.querySelector('.close');
        this.chart = null;
        
        this.initializeEventListeners();
        this.updateUI();
        this.saveToLocalStorage(); // Salva i dati aggiornati
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        this.trackFilter.addEventListener('change', () => this.updateUI());
        this.sessionFilter.addEventListener('change', () => this.updateUI());
        this.downloadBtn.addEventListener('click', () => this.downloadData());
        this.loadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileLoad(e));
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeEditModal();
            }
        });
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const sessionName = document.getElementById('sessionName').value;
        const lapNumber = parseInt(document.getElementById('lapNumber').value);
        const lapTime = document.getElementById('lapTime').value;
        const trackName = document.getElementById('trackName').value;

        if (!this.validateLapTime(lapTime)) {
            alert('Formato tempo non valido. Usa il formato mm:ss.ms (es. 1:23.456)');
            return;
        }

        const lap = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            session: sessionName,
            lapNumber: lapNumber,
            track: trackName,
            time: lapTime
        };

        this.laps.push(lap);
        this.saveToLocalStorage();
        this.updateUI();
        this.form.reset();
    }

    handleEditSubmit(e) {
        e.preventDefault();
        
        const lapId = parseInt(document.getElementById('editLapId').value);
        const sessionName = document.getElementById('editSessionName').value;
        const lapNumber = parseInt(document.getElementById('editLapNumber').value);
        const lapTime = document.getElementById('editLapTime').value;
        const trackName = document.getElementById('editTrackName').value;

        if (!this.validateLapTime(lapTime)) {
            alert('Formato tempo non valido. Usa il formato mm:ss.ms (es. 1:23.456)');
            return;
        }

        const lapIndex = this.laps.findIndex(lap => lap.id === lapId);
        if (lapIndex !== -1) {
            this.laps[lapIndex] = {
                ...this.laps[lapIndex],
                session: sessionName,
                lapNumber: lapNumber,
                track: trackName,
                time: lapTime
            };
            this.saveToLocalStorage();
            this.updateUI();
            this.closeEditModal();
        }
    }

    openEditModal(lap) {
        document.getElementById('editLapId').value = lap.id;
        document.getElementById('editSessionName').value = lap.session;
        document.getElementById('editLapNumber').value = lap.lapNumber;
        document.getElementById('editLapTime').value = lap.time;
        document.getElementById('editTrackName').value = lap.track;
        this.modal.style.display = 'block';
    }

    closeEditModal() {
        this.modal.style.display = 'none';
        this.editForm.reset();
    }

    validateLapTime(time) {
        const regex = /^\d+:\d{2}\.\d{3}$/;
        return regex.test(time);
    }

    deleteLap(id) {
        this.laps = this.laps.filter(lap => lap.id !== id);
        this.saveToLocalStorage();
        this.updateUI();
    }

    saveToLocalStorage() {
        localStorage.setItem('lapTimes', JSON.stringify(this.laps));
    }

    downloadData() {
        fetch('http://localhost:3000/save-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.laps)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Dati salvati con successo nel file ${data.filename}`);
            } else {
                alert('Errore nel salvataggio dei dati');
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Errore nella comunicazione con il server');
        });
    }

    updateFilters() {
        const tracks = [...new Set(this.laps.map(lap => lap.track))];
        const sessions = ['Sessione 1', 'Sessione 2', 'Sessione 3', 'Sessione 4', 'Sessione 5'];

        this.trackFilter.innerHTML = '<option value="all">Tutte le Piste</option>';
        this.sessionFilter.innerHTML = '<option value="all">Tutte le Sessioni</option>';

        tracks.forEach(track => {
            this.trackFilter.innerHTML += `<option value="${track}">${track}</option>`;
        });

        sessions.forEach(session => {
            this.sessionFilter.innerHTML += `<option value="${session}">${session}</option>`;
        });
    }

    getFilteredLaps() {
        const selectedTrack = this.trackFilter.value;
        const selectedSession = this.sessionFilter.value;

        return this.laps.filter(lap => {
            const trackMatch = selectedTrack === 'all' || lap.track === selectedTrack;
            const sessionMatch = selectedSession === 'all' || lap.session === selectedSession;
            return trackMatch && sessionMatch;
        });
    }

    calculateSessionStats(laps) {
        if (laps.length === 0) {
            return {
                bestTime: '-',
                avgTime: '-',
                totalLaps: 0
            };
        }

        const times = laps.map(lap => this.timeToMilliseconds(lap.time));
        const bestTime = Math.min(...times);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

        return {
            bestTime: this.formatTime(bestTime),
            avgTime: this.formatTime(avgTime),
            totalLaps: laps.length
        };
    }

    timeToMilliseconds(time) {
        const [minutes, seconds] = time.split(':');
        const [sec, ms] = seconds.split('.');
        return (parseInt(minutes) * 60 + parseInt(sec)) * 1000 + parseInt(ms);
    }

    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.round((ms % 1000) / 1000 * 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }

    updateChart(filteredLaps) {
        // Raggruppa i giri per sessione
        const sessions = {};
        filteredLaps.forEach(lap => {
            if (!sessions[lap.session]) {
                sessions[lap.session] = [];
            }
            sessions[lap.session].push(lap);
        });

        // Prepara i dati per il grafico
        const datasets = Object.entries(sessions).map(([session, laps]) => {
            // Ordina i giri per numero
            const sortedLaps = laps.sort((a, b) => a.lapNumber - b.lapNumber);
            
            return {
                label: session,
                data: sortedLaps.map(lap => ({
                    x: lap.lapNumber,
                    y: this.timeToMilliseconds(lap.time) / 1000 // Converti in secondi
                })),
                borderColor: this.getSessionColor(session),
                backgroundColor: this.getSessionColor(session, 0.1),
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: this.getSessionColor(session),
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointStyle: 'circle',
                borderWidth: 3,
                showLine: true
            };
        });

        // Se il grafico esiste già, aggiornalo
        if (this.chart) {
            this.chart.data.datasets = datasets;
            this.chart.update();
        } else {
            // Crea un nuovo grafico
            const ctx = document.getElementById('lapTimesChart').getContext('2d');
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: {
                                    size: 12,
                                    weight: '500'
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            titleColor: '#1e293b',
                            bodyColor: '#1e293b',
                            borderColor: '#e2e8f0',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: true,
                            usePointStyle: true,
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw.y;
                                    const minutes = Math.floor(value / 60);
                                    const seconds = (value % 60).toFixed(3);
                                    return `${context.dataset.label}: ${minutes}:${seconds.padStart(6, '0')}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'Numero Giro',
                                font: {
                                    size: 12,
                                    weight: '500'
                                },
                                padding: { top: 10 }
                            },
                            grid: {
                                display: true,
                                color: '#e2e8f0',
                                drawBorder: false
                            },
                            ticks: {
                                font: {
                                    size: 11
                                },
                                padding: 8
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Tempo (secondi)',
                                font: {
                                    size: 12,
                                    weight: '500'
                                },
                                padding: { bottom: 10 }
                            },
                            grid: {
                                display: true,
                                color: '#e2e8f0',
                                drawBorder: false
                            },
                            ticks: {
                                font: {
                                    size: 11
                                },
                                padding: 8,
                                callback: function(value) {
                                    const minutes = Math.floor(value / 60);
                                    const seconds = (value % 60).toFixed(3);
                                    return `${minutes}:${seconds.padStart(6, '0')}`;
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    }
                }
            });
        }
    }

    getSessionColor(session, alpha = 1) {
        const colors = {
            'Sessione 1': `rgba(37, 99, 235, ${alpha})`,    // Blue
            'Sessione 2': `rgba(16, 185, 129, ${alpha})`,   // Green
            'Sessione 3': `rgba(139, 92, 246, ${alpha})`,   // Purple
            'Sessione 4': `rgba(245, 158, 11, ${alpha})`,   // Yellow
            'Sessione 5': `rgba(239, 68, 68, ${alpha})`     // Red
        };
        return colors[session] || `rgba(148, 163, 184, ${alpha})`;
    }

    updateUI() {
        this.updateFilters();
        const filteredLaps = this.getFilteredLaps();
        const stats = this.calculateSessionStats(filteredLaps);

        // Aggiorna le statistiche generali
        document.getElementById('bestTime').textContent = stats.bestTime;
        document.getElementById('avgTime').textContent = stats.avgTime;
        document.getElementById('totalLaps').textContent = stats.totalLaps;

        // Aggiorna il grafico
        this.updateChart(filteredLaps);

        // Raggruppa i giri per sessione
        const sessions = {};
        filteredLaps.forEach(lap => {
            if (!sessions[lap.session]) {
                sessions[lap.session] = [];
            }
            sessions[lap.session].push(lap);
        });

        // Aggiorna il container delle sessioni
        const container = document.getElementById('sessionsContainer');
        container.innerHTML = '';

        Object.entries(sessions).sort(([a], [b]) => b.localeCompare(a)).forEach(([session, laps]) => {
            const sessionStats = this.calculateSessionStats(laps);
            const sessionDiv = document.createElement('div');
            sessionDiv.className = 'session-group';
            sessionDiv.innerHTML = `
                <div class="session-header">
                    <h3>${session}</h3>
                    <div class="session-stats">
                        <span>Miglior tempo: ${sessionStats.bestTime}</span>
                        <span>Media: ${sessionStats.avgTime}</span>
                        <span>Giri: ${sessionStats.totalLaps}</span>
                    </div>
                </div>
                <div class="session-laps">
                    <table>
                        <thead>
                            <tr>
                                <th>Giro</th>
                                <th>Pista</th>
                                <th>Tempo</th>
                                <th>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${laps.sort((a, b) => a.lapNumber - b.lapNumber)
                                .map(lap => `
                                    <tr>
                                        <td>${lap.lapNumber}</td>
                                        <td>${lap.track}</td>
                                        <td>${lap.time}</td>
                                        <td class="action-buttons">
                                            <button class="edit-btn" onclick='lapTimeManager.openEditModal(${JSON.stringify({
                                                id: lap.id,
                                                session: lap.session,
                                                lapNumber: lap.lapNumber,
                                                time: lap.time,
                                                track: lap.track
                                            })})'>
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="delete-btn" onclick="lapTimeManager.deleteLap(${lap.id})">
                                                <i class="fas fa-trash-alt"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            container.appendChild(sessionDiv);
        });
    }

    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                if (Array.isArray(loadedData)) {
                    // Verifica che i dati caricati abbiano la struttura corretta
                    const validData = loadedData.every(lap => 
                        lap.hasOwnProperty('session') && 
                        lap.hasOwnProperty('lapNumber') && 
                        lap.hasOwnProperty('time') && 
                        lap.hasOwnProperty('track')
                    );

                    if (validData) {
                        this.laps = loadedData;
                        this.saveToLocalStorage();
                        this.updateUI();
                        alert('Dati caricati con successo!');
                    } else {
                        alert('Il file JSON non ha il formato corretto. Assicurati che contenga dati validi dei giri.');
                    }
                } else {
                    alert('Il file JSON deve contenere un array di giri.');
                }
            } catch (error) {
                alert('Errore nel caricamento del file. Assicurati che sia un file JSON valido.');
                console.error('Errore nel caricamento del file:', error);
            }
        };
        reader.readAsText(file);
        // Reset del file input per permettere il caricamento dello stesso file
        event.target.value = '';
    }
}

// Inizializza l'applicazione
const lapTimeManager = new LapTimeManager(); 