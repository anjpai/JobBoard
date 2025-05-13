const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage options
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create folders based on file type
    let folder = 'general';
    
    if (file.fieldname === 'resume' || file.fieldname === 'cv') {
      folder = 'resumes';
    } else if (file.fieldname === 'logo') {
      folder = 'logos';
    } else if (file.fieldname === 'profilePic') {
      folder = 'profile_pics';
    } else if (file.fieldname === 'document' || file.fieldname === 'certificate') {
      folder = 'documents';
    }
    
    const destinationPath = path.join(uploadDir, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
    
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const fileExtension = path.extname(file.originalname);
    cb(null, `${req.user.id}-${uniqueSuffix}${fileExtension}`);
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  // Define allowed file types based on the field
  let allowedTypes;
  
  if (file.fieldname === 'resume' || file.fieldname === 'cv' || file.fieldname === 'document') {
    // Allow PDF, DOC, DOCX for resumes and documents
    allowedTypes = ['.pdf', '.doc', '.docx'];
  } else if (file.fieldname === 'logo' || file.fieldname === 'profilePic') {
    // Allow images for logos and profile pictures
    allowedTypes = ['.jpg', '.jpeg', '.png', '.svg'];
  } else {
    // Default allowed types
    allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
  }
  
  // Check if file extension is allowed
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(fileExtension)) {
    return cb(null, true);
  }
  
  // Reject file if not allowed
  cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

module.exports = upload;