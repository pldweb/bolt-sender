import {default as WASocket} from '@whiskeysockets/baileys';
import {Boom} from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import {fileURLToPath} from 'url';
import fs from 'fs';
import path from 'path';


class WhatsAppManager {
  constructor() {
    this.sessions = new Map();
    this.logger = pino({ level: 'silent' });
    this.loadSessionsFromFiles();
  }

  loadSessionsFromFiles() {

    const sessionsPath = path.resolve(path.dirname(import.meta.url), 'sessions');
    console.log("Loading sessions from path:", sessionsPath); // Debug

    if (fs.existsSync(sessionsPath)) {
      const sessionDirs = fs.readdirSync(sessionsPath); // Baca semua direktori sesi
      sessionDirs.forEach(async (sessionId) => {
        const sessionPath = path.resolve(sessionsPath, sessionId);
        if (fs.lstatSync(sessionPath).isDirectory()) {
          const { state, saveCreds } = await WASocket.useMultiFileAuthState(sessionPath);
          this.sessions.set(sessionId, {
            socket: WASocket.default({
              auth: state,
              logger: this.logger,
            }),
            status: 'connecting', // Status awal
            qr: null,
            // QR Code tidak relevan setelah sesi dimulai
          });
          console.log(`Session ${sessionId} reloaded from file.`);
        }
      });
    } else {
      console.log("No existing sessions found.");
    }
  }


  async createSession(sessionId) {

    try {

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      console.log('__dirname:', __dirname);

      // const { state, saveCreds } = await WASocket.useMultiFileAuthState(`sessions/${sessionId}`);
      const { state, saveCreds } = await WASocket.useMultiFileAuthState(
          path.resolve(__dirname, 'sessions', sessionId)
      );

      const socket = WASocket.default({
        auth: state,
        printQRInTerminal: true,
        logger: this.logger
      });

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        console.log("Connection update triggered:", update);

        const session = this.sessions.get(sessionId); // Ambil sesi
        console.log("Current session before update:", session);

        if (qr) {
          // console.log("Scan this QR code from your WhatsApp app:");
          // qrcodeTerminal.generate(qr, { small: true });

          console.log("Generated QR Code:", qr); // Log QR Code
          session.qr = qr; // Simpan QR Code ke objek sesi
          this.sessions.set(sessionId, session); // Pastikan diperbarui ke Map
          console.log("QR Code saved to session:", this.sessions.get(sessionId).qr);
        }

        if (connection) {
          session.status = connection; // Perbarui status koneksi
          this.sessions.set(sessionId, session); // Perbarui sesi di Map
          console.log(`Session ${sessionId} status updated to: ${connection}`);
          console.log(`Session ${sessionId} updated in Map:`, this.sessions.get(sessionId));
        }

        if (connection === 'open') {
          const userInfo = await socket.user; // Ambil informasi akun
          session.user = {
            id: userInfo.id,
            name: userInfo.name,
          };
          this.sessions.set(sessionId, session);
          console.log(`Session ${sessionId} is now active for user:`, session.user);
        }

        if (connection === 'close') {
          console.log("Connection closed for session:", sessionId);
          const shouldReconnect = (lastDisconnect?.error instanceof Boom) &&
            lastDisconnect.error.output.statusCode !== 403;

          if (shouldReconnect) {
            await this.createSession(sessionId);
          }
        }

        this.sessions.get(sessionId).status = connection;
      });

      socket.ev.on('creds.update', saveCreds);

      this.sessions.set(sessionId, {
        socket,
        status: 'connecting',
        qr: null
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
      if (session) {
        await session.socket.logout();
        await session.socket.end();
        this.sessions.delete(sessionId);
        return true;
      }
      return false;
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
        status: value.status || 'Tidak ada sesi',
        qr: value.qr || null,
        user: value.user || null,         // Informasi pengguna (jika tersedia)
      };
    });
    console.log("Returning all sessions:", sessions);
    return sessions;
  }

  async sendMessage(sessionId, to, message) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session with ID '${sessionId}' not found`);
      }

      if (!session.socket) {
        throw new Error(`Session socket for '${sessionId}' is not initialized`);
      }

      const jid = to.includes('@g.us') ? to : `${to}@s.whatsapp.net`;

      console.log('Sending message to:', jid, 'with message:', message);

      await session.socket.sendMessage(jid, { text: message });

      return true;
    } catch (error) {
      console.error(`Failed to send message for session ${sessionId}:`, error);
      return false;
    }
  }
}

export { WhatsAppManager };