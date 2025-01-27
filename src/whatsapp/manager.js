import { default as WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

class WhatsAppManager {
  constructor() {
    this.sessions = new Map();
    this.logger = pino({ level: 'silent' });
    this.initializeSessionsDirectory();
    this.loadSessionsFromFiles();
  }

  initializeSessionsDirectory() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const sessionsPath = path.resolve(__dirname, 'sessions');

    if (!fs.existsSync(sessionsPath)) {
      fs.mkdirSync(sessionsPath, { recursive: true });
    }

    this.sessionsPath = sessionsPath;
  }

  async loadSessionsFromFiles() {
    try {
      console.log("Loading sessions from path:", this.sessionsPath);

      if (!fs.existsSync(this.sessionsPath)) {
        console.log("Sessions directory does not exist");
        return;
      }

      const sessionDirs = fs.readdirSync(this.sessionsPath);

      for (const sessionId of sessionDirs) {
        const sessionPath = path.resolve(this.sessionsPath, sessionId);

        if (fs.lstatSync(sessionPath).isDirectory()) {
          try {
            await this.restoreSession(sessionId, sessionPath);
          } catch (error) {
            console.error(`Failed to restore session ${sessionId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  }

  async restoreSession(sessionId, sessionPath) {
    try {
      const { state, saveCreds } = await WASocket.useMultiFileAuthState(sessionPath);

      const socket = WASocket.default({
        auth: state,
        logger: this.logger,
        printQRInTerminal: false
      });

      this.setupSocketListeners(socket, sessionId, saveCreds);

      this.sessions.set(sessionId, {
        socket,
        status: 'connecting',
        qr: null,
        user: null
      });

      console.log(`Session ${sessionId} restored successfully`);
    } catch (error) {
      throw new Error(`Failed to restore session: ${error.message}`);
    }
  }

  setupSocketListeners(socket, sessionId, saveCreds) {
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      const session = this.sessions.get(sessionId);

      if (!session) return;

      console.log(`Connection update for ${sessionId}:`, update);

      if (qr) {
        session.qr = qr;
        session.status = 'pending';
        console.log(`QR Code updated for session ${sessionId}`);
      }

      if (connection) {
        session.status = connection;

        if (connection === 'open') {
          try {
            const userInfo = await socket.user;
            session.user = {
              id: userInfo.id,
              name: userInfo.name
            };
            session.qr = null; // Clear QR code once connected
            console.log(`Session ${sessionId} connected for user:`, session.user);
          } catch (error) {
            console.error(`Failed to fetch user info for ${sessionId}:`, error);
          }
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error instanceof Boom) &&
              lastDisconnect.error.output.statusCode !== 403;

          if (shouldReconnect) {
            console.log(`Attempting to reconnect session ${sessionId}`);
            await this.createSession(sessionId);
          } else {
            console.log(`Session ${sessionId} closed permanently`);
            this.sessions.delete(sessionId);
          }
        }
      }

      this.sessions.set(sessionId, session);
    });

    socket.ev.on('creds.update', saveCreds);
  }

  async createSession(sessionId) {
    try {
      const sessionPath = path.resolve(this.sessionsPath, sessionId);

      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      const { state, saveCreds } = await WASocket.useMultiFileAuthState(sessionPath);

      const socket = WASocket.default({
        auth: state,
        logger: this.logger,
        printQRInTerminal: false
      });

      this.setupSocketListeners(socket, sessionId, saveCreds);

      this.sessions.set(sessionId, {
        socket,
        status: 'connecting',
        qr: null,
        user: null
      });

      return true;
    } catch (error) {
      console.error(`Failed to create session ${sessionId}:`, error);
      return false;
    }
  }

  async deleteSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return false;

      // Properly close the socket
      if (session.socket) {
        try {
          await session.socket.logout();
          await session.socket.end();
        } catch (error) {
          console.error(`Error closing socket for ${sessionId}:`, error);
        }
      }

      // Remove session files
      const sessionPath = path.resolve(this.sessionsPath, sessionId);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }

      // Remove from memory
      this.sessions.delete(sessionId);
      return true;
    } catch (error) {
      console.error(`Failed to delete session ${sessionId}:`, error);
      return false;
    }
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  getAllSessions() {
    const sessions = {};
    this.sessions.forEach((value, key) => {
      sessions[key] = {
        status: value.status || 'unknown',
        qr: value.qr,
        user: value.user
      };
    });
    return sessions;
  }

  async sendMessage(sessionId, to, message, image = null) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (!session.socket) {
        throw new Error(`Socket not initialized for session ${sessionId}`);
      }

      if (session.status !== 'open') {
        throw new Error(`Session ${sessionId} is not connected`);
      }

      // Validate phone number format
      const phoneNumber = to.replace(/[^0-9]/g, '');
      if (!phoneNumber) {
        throw new Error('Invalid phone number');
      }

      const jid = to.includes('@g.us') ? to : `${phoneNumber}@s.whatsapp.net`;

      if (image){
        await session.socket.sendMessage(jid, {
          image: image.buffer,
          caption: message || undefined,
          mimetype: image.mimetype
        });
      } else if(message){
        await session.socket.sendMessage(jid, { text: message });
      }

      return true;
    } catch (error) {
      console.error(`Failed to send message for session ${sessionId}:`, error);
      return false;
    }
  }
}

export { WhatsAppManager };