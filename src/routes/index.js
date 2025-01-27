import { Router } from 'express';
import { whatsappManager } from '../index.js';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  },
});

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

// Updated send message route to handle images
router.post('/send/:sessionId', upload.single('image'), async (req, res) => {
  const { sessionId } = req.params;
  const { to, message } = req.body;
  const image = req.file;

  if (!to) {
    return res.status(400).json({
      success: false,
      message: 'Recipient number is required'
    });
  }

  if (!message && !image) {
    return res.status(400).json({
      success: false,
      message: 'Either message or image is required'
    });
  }

  try {
    const success = await whatsappManager.sendMessage(sessionId, to, message, image);

    res.json({
      success,
      message: success ? 'Message sent successfully' : 'Failed to send message'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;