import { Router } from 'express';
import { whatsappManager } from '../index.js';

const router = Router();

// Create new WhatsApp session
router.post('/session/create/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  if (whatsappManager.getSession(sessionId)) {
    return res.status(400).json({
      success: false,
      message: 'Session already exists'
    });
  }

  const success = await whatsappManager.createSession(sessionId);
  
  res.json({
    success,
    message: success ? 'Session created successfully' : 'Failed to create session'
  });
});

// Delete WhatsApp session
router.delete('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const success = await whatsappManager.deleteSession(sessionId);
  
  res.json({
    success,
    message: success ? 'Session deleted successfully' : 'Session not found'
  });
});

// Get session status
router.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = whatsappManager.getSession(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  res.json({
    success: true,
    data: {
      status: session.status,
      qr: session.qr
    }
  });
});

// Get all sessions
router.get('/sessions', (req, res) => {
  const sessions = whatsappManager.getAllSessions();
  
  res.json({
    success: true,
    data: sessions
  });
});

// Send message
router.post('/send/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters'
    });
  }

  const success = await whatsappManager.sendMessage(sessionId, to, message);
  
  res.json({
    success,
    message: success ? 'Message sent successfully' : 'Failed to send message'
  });
});

export default router;