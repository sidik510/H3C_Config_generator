const express = require('express');
const cors = require('cors');
const app = express();
const configRoutes = require('./routes/configRoutes');

app.use(cors());
app.use(express.json());

// Endpoint API
app.use('/api', configRoutes);

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
