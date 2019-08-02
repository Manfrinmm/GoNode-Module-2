import multer from "multer";
import crypto from "crypto";
import { extname, resolve } from "path";

export default {
  //como o multer irá guardar os arquivos de imagens
  storage: multer.diskStorage({
    destination: resolve(__dirname, "..", "..", "tmp", "uploads"),
    filename: (req, file, cb) => {
      //add codigo unico, concatenando random byts + extensão do arquivo
      crypto.randomBytes(16, (err, res) => {
        if (err) return cb(err);

        return cb(null, res.toString("hex") + extname(file.originalname));
      });
    }
  })
};
