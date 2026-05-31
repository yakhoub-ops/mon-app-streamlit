const http    = require('http');
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);

require('./socket').init(server);

app.use(cors());
app.use(express.json());

// Routes existantes
app.use('/api/auth',              require('./routes/auth.routes'));
app.use('/api/patients',          require('./routes/patient.routes'));
app.use('/api/medecins',          require('./routes/medecin.routes'));
app.use('/api/rdv',               require('./routes/rdv.routes'));
app.use('/api/dossiers',          require('./routes/dossier.routes'));
app.use('/api/consultations',     require('./routes/consultation.routes'));
app.use('/api/ordonnances',       require('./routes/ordonnance.routes'));
app.use('/api/urgences',          require('./routes/urgence.routes'));
app.use('/api/file-attente',      require('./routes/fileAttente.routes'));
app.use('/api/stock',             require('./routes/stock.routes'));
app.use('/api/factures',          require('./routes/facture.routes'));
app.use('/api/notifications',     require('./routes/notification.routes'));

// Nouvelles routes v2
app.use('/api/assurances',        require('./routes/assurance.routes'));
app.use('/api/interactions',      require('./routes/interaction.routes'));
app.use('/api/teleconsultations', require('./routes/teleconsultation.routes'));
app.use('/api/liste-attente-rdv', require('./routes/listeAttenteRdv.routes'));
app.use('/api/actualites',        require('./routes/actualite.routes'));

app.use('/api/utilisateurs',      require('./routes/utilisateur.routes'));

// Cron — rappels automatiques
require('./cron');

server.listen(process.env.PORT, () => {
  console.log(`Tropical API running on port ${process.env.PORT}`);
});
