import { Router } from 'express';
import { authenticateApiKey } from '../src/middleware/auth.js';
import { whatsappManager } from '../server.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all sessions
router.get('/sessions', authenticateApiKey, (req, res) => {
    const userId = req.user.id;
    try {
        const sessions = whatsappManager.getAllSessions(userId);
        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sessions'
        });
    }
});

// Create WhatsApp session
router.post('/session/create/:sessionName', authenticateApiKey, async (req, res) => {
    const { sessionName } = req.params;
    const userId = req.user.id;
    const sessionId = `${sessionName}`;

    try {
        const success = await whatsappManager.createSession(sessionId);
        res.json({
            success,
            message: success ? 'Session created successfully' : 'Failed to create session'
        });
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update session name
router.put('/session/:sessionName/rename', authenticateApiKey, async (req, res) => {
    const { sessionName } = req.params;
    const { newName } = req.body;
    const oldSessionId = `${sessionName}`;
    const newSessionId = `${newName}`;

    try {
        const success = await whatsappManager.renameSession(oldSessionId, newSessionId);
        res.json({
            success,
            message: success ? 'Sesi berhasil diganti namanya' : 'Gagal mengganti nama sesi'
        });
    } catch (error) {
        console.error('Gagal mengganti nama sesi:', error);
        res.status(500).json({
            success: false,
            message: 'Kesalahan server'
        });
    }
});

// Get session status
router.get('/session/:sessionName', authenticateApiKey, (req, res) => {
    const { sessionName } = req.params;
    const userId = req.user.id;
    const sessionId = `${sessionName}`;

    try {
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
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get session'
        });
    }
});

// Send message
router.post('/send/:sessionName', authenticateApiKey, upload.single('file'), async (req, res) => {
    const { sessionName } = req.params;
    const { to, message } = req.body;
    const file = req.file;
    const userId = req.user.id;
    const sessionId = `${sessionName}`;

    try {
        const success = await whatsappManager.sendMessage(sessionId, to, message, file);
        res.json({
            success,
            message: success ? 'Message sent successfully' : 'Failed to send message'
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Delete session
router.delete('/session/:sessionName', authenticateApiKey, async (req, res) => {
    const { sessionName } = req.params;
    const userId = req.user.id;
    const sessionId = `${sessionName}`;

    try {
        const success = await whatsappManager.deleteSession(sessionId);
        res.json({
            success,
            message: success ? 'Session deleted successfully' : 'Session not found'
        });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;