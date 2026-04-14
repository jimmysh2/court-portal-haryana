/**
 * Local File Storage Service — Grievance Attachments
 *
 * Replaces the former Supabase Storage upload.
 * Files are now stored on the local server at ./uploads/grievances/
 * and served via the Express static route already configured in server/index.js.
 *
 * Works for: Government Windows Server deployment (and any future server).
 * No cloud dependency.
 */

const path = require('path');
const fs = require('fs');

// Resolve uploads directory relative to project root (one level above /server)
const UPLOADS_BASE_DIR = path.join(__dirname, '../../uploads');

/**
 * Saves an in-memory multer file (buffer) to local disk.
 *
 * @param {Object} file     - Multer file object (memoryStorage)
 * @param {string} folder   - Sub-folder name, e.g. 'grievances'
 * @returns {{ name, path, mimeType, size }}
 *          `path` is the URL-ready relative path: /uploads/grievances/filename.ext
 */
const uploadFile = async (file, folder = 'grievances') => {
    try {
        const uploadDir = path.join(UPLOADS_BASE_DIR, folder);

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileExt = path.extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
        const safeName = `${Date.now()}-${Math.floor(Math.random() * 100000)}${fileExt}`;
        const diskPath = path.join(uploadDir, safeName);

        // Write buffer to disk
        fs.writeFileSync(diskPath, file.buffer);

        // Return the URL-accessible relative path (Express serves /uploads statically)
        const relativePath = `/uploads/${folder}/${safeName}`;

        return {
            name: file.originalname,
            path: relativePath,
            mimeType: file.mimetype,
            size: file.size
        };
    } catch (err) {
        console.error('Local File Storage Error:', err.message);
        throw err;
    }
};

module.exports = { uploadFile };
