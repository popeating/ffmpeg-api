import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import fileUpload from 'express-fileupload';
import multer from 'multer';
import { createFFmpeg } from '@ffmpeg/ffmpeg';

const ffmpegInstance = createFFmpeg({ log: true });
let ffmpegLoadingPromise = ffmpegInstance.load();
async function getFFmpeg() {
  if (ffmpegLoadingPromise) {
    await ffmpegLoadingPromise;
    ffmpegLoadingPromise = undefined;
  }

  return ffmpegInstance;
}
const app = express();
const port = 3200;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1000 * 1024 * 1024 },
});

app.post('/oggtomp3', upload.single('audio'), async (req, res) => {
  console.log(upload);
  console.log(req.body.url);

  try {
    const data = await getfile(req.body.url);
    const audioData = Buffer.from(data);

    const ffmpeg = await getFFmpeg();
    const inputFileName = `input-audio.ogg`;
    const outputFileName = `output.mp3`;
    let outputData = null;
    ffmpeg.FS('writeFile', inputFileName, audioData);
    await ffmpeg.run('-i', inputFileName, '-acodec', 'mp3', outputFileName);
    outputData = ffmpeg.FS('readFile', outputFileName);
    ffmpeg.FS('unlink', inputFileName);
    ffmpeg.FS('unlink', outputFileName);
    res.writeHead(200, {
      'Content-Type': 'audio/mp3',
      'Content-Disposition': `attachment;filename=${outputFileName}`,
      'Content-Length': outputData.length,
    });
    res.end(Buffer.from(outputData, 'binary'));
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.use(cors());
app.use(fileUpload());

app.listen(port, () => {
  console.log(`[info] ffmpeg-api listening at http://localhost:${port}`);
});

async function getfile(url) {
  console.log(url);
  const file = await fetch(url);
  return file.arrayBuffer();
}
