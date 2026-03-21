import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const SUPPORTED_FORMATS = ['.mp3', '.mp4', '.m4a', '.wav', '.flac', '.ogg', '.webm'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../temp'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const ext = path.extname(file.originalname).toLowerCase();
  if (SUPPORTED_FORMATS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`UnsupportedFormatError:${ext}`));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
