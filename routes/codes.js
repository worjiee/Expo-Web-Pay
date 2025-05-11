const express = require('express');
const router = express.Router();
const Code = require('../models/Code');
const auth = require('../middleware/auth');

// Generate random code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate new code (Admin only)
router.post('/generate', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const code = new Code({
      code: generateCode(),
      generatedBy: req.user.id
    });

    await code.save();
    res.json(code);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Generate multiple codes (Admin only)
router.post('/generate-multiple', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { count } = req.body;
    const codes = [];

    for (let i = 0; i < count; i++) {
      const code = new Code({
        code: generateCode(),
        generatedBy: req.user.id
      });
      await code.save();
      codes.push(code);
    }

    res.json(codes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all codes (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const codes = await Code.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify code (Public)
router.post('/verify', async (req, res) => {
  try {
    const { code } = req.body;
    const codeDoc = await Code.findOne({ code });

    if (!codeDoc) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    if (codeDoc.isUsed) {
      return res.status(400).json({ message: 'Code already used' });
    }

    codeDoc.isUsed = true;
    codeDoc.usedAt = new Date();
    await codeDoc.save();

    res.json({ message: 'Code verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a custom code (Admin only)
router.post('/create-custom', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { customCode } = req.body;
    
    // Check if code already exists
    const existingCode = await Code.findOne({ code: customCode });
    if (existingCode) {
      return res.status(400).json({ message: 'Code already exists' });
    }

    const code = new Code({
      code: customCode,
      generatedBy: req.user.id
    });

    await code.save();
    res.json(code);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Bulk import codes (Admin only)
router.post('/bulk-import', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { codes } = req.body;
    const results = {
      success: 0,
      duplicates: 0,
      errors: 0
    };

    for (const codeValue of codes) {
      try {
        // Check if code already exists
        const existingCode = await Code.findOne({ code: codeValue.trim() });
        if (existingCode) {
          results.duplicates++;
          continue;
        }

        const code = new Code({
          code: codeValue.trim(),
          generatedBy: req.user.id
        });

        await code.save();
        results.success++;
      } catch (error) {
        results.errors++;
      }
    }

    res.json({ message: 'Bulk import completed', results });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete all codes (Admin only) - Keep this route
router.delete('/delete-all', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await Code.deleteMany({});
    res.json({ 
      message: 'All codes deleted successfully', 
      count: result.deletedCount 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a code (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const code = await Code.findById(req.params.id);
    
    if (!code) {
      return res.status(404).json({ message: 'Code not found' });
    }

    await Code.findByIdAndDelete(req.params.id);
    res.json({ message: 'Code deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 