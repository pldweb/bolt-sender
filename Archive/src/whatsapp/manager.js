import { default as WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';


class WhatsAppManager {
  constructor() {
    this.sessions = new Map();
    this.logger = pino({ level: 'silent' });
  }

  async createSession(sessionId) {
    try {
      const { state, saveCreds } = await WASocket.useMultiFileAuthState(`sessions/${sessionId}`);

      const socket = WASocket.default({
        auth: state,
        printQRInTerminal: true,
        logger: this.logger
      });

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log("Scan this QR code from your WhatsApp app:");
          qrcodeTerminal.generate(qr, { small: true }); // Cetak QR code secara visual di terminal

          const qrUrl = await QRCode.toDataURL(qr); // Untuk keperluan lain, seperti front-end
          this.sessions.get(sessionId).qr = qrUrl;
        }

        if (connection === 'close') {
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
        status: value.status,
        qr: value.qr
      };
    });
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