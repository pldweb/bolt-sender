import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WhatsAppManager } from './whatsapp/manager.js';
import routes from './routes/index.js';

const app = express();
const server = createServer(app);
const port = process.env.PORT || 2025;
const ip_address = '192.168.1.48';

// Initialize WhatsApp Manager
export const whatsappManager = new WhatsAppManager();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Bolt Sender is running' });
});

server.listen(port, ip_address, () => {
  console.log(`Bolt Sender berjalan di http://${ip_address} port ${port}`);
});