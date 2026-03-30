const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const { chatWithAI } = require('../services/aiAssistantService');

// Multer setup for audio uploads
const upload = multer({ dest: 'uploads/' });

// Initialize Groq for transcription specifically
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * @route   POST /api/v1/ai-assistant/chat
 * @desc    Send a message to the AI Assistant
 * @access  Public (Adjust as needed)
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await chatWithAI(message, history || []);
    res.json(result);
  } catch (error) {
    console.error('AI Assistant Chat Error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

/**
 * @route   POST /api/v1/ai-assistant/transcribe
 * @desc    Transcribe audio recorded from the frontend
 * @access  Public
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  let filePath = req.file ? req.file.path : null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Whisper expects specific extensions sometimes, renaming to .webm if it's the blob type usually sent from browser
    const newPath = filePath + '.webm';
    fs.renameSync(filePath, newPath);
    filePath = newPath;

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3",
    });

    // Cleanup file after transcription
    fs.unlink(filePath, () => {});

    res.json({ text: transcription.text });
  } catch (err) {
    console.error('Transcription error:', err);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

module.exports = router;
