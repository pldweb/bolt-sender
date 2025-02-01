import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WhatsAppManager } from './whatsapp/manager.js';
import routes from './routes/index.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const server = createServer(app);

const ip_address = process.env.IP;
const port = process.env.PORT;

// Initialize WhatsApp Manager
export const whatsappManager = new WhatsAppManager();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);
app.use('/auth', authRoutes);
app.use('/api/v1', apiRoutes);

// Health check
app.get('/be', (req, res) => {
  res.json({ status: 'Bolt Sender is running' });
});

server.listen(port, ip_address, () => {
  console.log(`Bolt Sender berjalan di http://${ip_address} port ${port}`);
});