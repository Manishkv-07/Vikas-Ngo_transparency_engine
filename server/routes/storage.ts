import express from 'express';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';

const router = express.Router();

// GridFS Storage configuration
const storage = new GridFsStorage({
  url: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ngo-transparency',
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({ storage });

// POST: Upload single file
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the path that the frontend can use to fetch the image/video
  const objectPath = `/api/storage/files/${req.file.filename}`;
  res.status(200).json({ 
    url: objectPath, // Match the Uppy response expectation if needed
    objectPath,
    filename: req.file.filename 
  });
});

// GET: Serve a file by filename
router.get('/files/:filename', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'uploads'
    });

    const cursor = bucket.find({ filename: req.params.filename });
    const files = await cursor.toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if image or video
    const file = files[0];
    if (file.contentType) {
        res.set('Content-Type', file.contentType);
    }
    
    const readStream = bucket.openDownloadStreamByName(req.params.filename);
    readStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
