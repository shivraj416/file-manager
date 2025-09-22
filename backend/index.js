import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ===================
// MongoDB Connection
// ===================
const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/filemanager";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ===================
// Cloudinary Config
// ===================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===================
// Mongo Schema
// ===================
const FileSchema = new mongoose.Schema({
  year: String,
  fileKey: String,
  fileUrl: String,     // Main Cloudinary URL
  publicId: String,    // Main Cloudinary public_id
  backupUrl: String,   // Backup Cloudinary URL
  backupId: String,    // Backup Cloudinary public_id
  fileType: String,
  uploadedAt: { type: Date, default: Date.now },
});
const File = mongoose.model("File", FileSchema);

// ===================
// Multer (with limits)
// ===================
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB per file
});

// ===================
// Helper: Stream upload
// ===================
const streamUpload = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        quality: "auto",
        fetch_format: "auto",
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// ===================
// Routes
// ===================

// ⚡ Upload with backup
app.post("/upload/:year/:fileKey", upload.array("files"), async (req, res) => {
  try {
    const year = decodeURIComponent(req.params.year);
    const fileKey = decodeURIComponent(req.params.fileKey);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const results = [];
    for (const file of req.files) {
      try {
        // 👉 Main upload
        const result = await streamUpload(file, `${year}/${fileKey}`);

        // 👉 Backup upload
        const backup = await streamUpload(file, `backup/${year}/${fileKey}`);

        results.push({
          year,
          fileKey,
          fileUrl: result.secure_url,
          publicId: result.public_id,
          backupUrl: backup.secure_url,
          backupId: backup.public_id,
          fileType: file.mimetype,
        });

        // Save to DB
        File.create({
          year,
          fileKey,
          fileUrl: result.secure_url,
          publicId: result.public_id,
          backupUrl: backup.secure_url,
          backupId: backup.public_id,
          fileType: file.mimetype,
        }).catch((err) => console.error("DB save failed:", err));
      } catch (err) {
        console.error("❌ Upload error (one file):", err);
        results.push({
          error: true,
          fileName: file.originalname,
          reason: err.message || "Cloudinary upload failed",
        });
      }
    }

    res.json({ success: true, files: results });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// Get files by year + fileKey
app.get("/files/:year/:fileKey", async (req, res) => {
  try {
    const year = decodeURIComponent(req.params.year);
    const fileKey = decodeURIComponent(req.params.fileKey);
    const files = await File.find({ year, fileKey }).sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// ⚡ Instant delete (supports both body and query params)
app.delete("/file/:id?", async (req, res) => {
  try {
    const id = req.body.id || req.query.id;
    const publicId = req.body.publicId || req.query.publicId;

    if (!id || !publicId) {
      return res.status(400).json({ error: "id and publicId are required" });
    }

    const file = await File.findById(id);
    if (!file) return res.status(404).json({ error: "File not found" });

    res.json({ success: true });

    // delete from main storage
    let resourceType = "image";
    if (file.fileType === "application/pdf") resourceType = "raw";
    else if (file.fileType.startsWith("video/")) resourceType = "video";

    cloudinary.uploader
      .destroy(file.publicId, { resource_type: resourceType })
      .catch((err) => console.error("❌ Cloudinary delete (main) failed:", err));

    // delete from backup too
    cloudinary.uploader
      .destroy(file.backupId, { resource_type: resourceType })
      .catch((err) =>
        console.error("❌ Cloudinary delete (backup) failed:", err)
      );

    File.findByIdAndDelete(id).catch((err) =>
      console.error("❌ DB delete failed:", err)
    );
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

// ===================
// Start Server
// ===================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`)
);
