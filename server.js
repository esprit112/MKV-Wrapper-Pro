import express from 'express';
import cors from 'cors';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5005;
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

const DEFAULT_MAKEMKV_PATH = 'C:\\Program Files (x86)\\MakeMKV\\makemkvcon.exe';
const DEFAULT_CONFIG = {
  tmdbApiKey: '',
  outputPath: '',
  makeMkvPath: DEFAULT_MAKEMKV_PATH,
  autoEject: true,
  minTitleLength: 120
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

let jobQueue = [];
let activeJob = null;
let currentChildProcess = null;
let isHardwareBusy = false;

const cleanup = () => {
  if (currentChildProcess) {
    console.log('Server shutting down, killing child process...');
    currentChildProcess.kill('SIGTERM');
    currentChildProcess = null;
  }
};

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(); });
process.on('SIGTERM', () => { cleanup(); process.exit(); });
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  cleanup();
});

app.get('/api/settings', (req, res) => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      res.json({ ...DEFAULT_CONFIG, ...JSON.parse(data) });
    } else {
      res.json(DEFAULT_CONFIG);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const newConfig = { ...DEFAULT_CONFIG, ...req.body };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newConfig, null, 2));
    res.json({ status: 'ok', config: newConfig });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

const processNextJob = () => {
  if (activeJob || jobQueue.length === 0) return;
  const jobConfig = jobQueue.shift();
  startHardwareRip(jobConfig);
};

const startHardwareRip = (jobConfig) => {
  const { driveIndex, titleId, outputFolder, outputFileName, makeMkvPath } = jobConfig;
  try {
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });
  } catch (err) {
    console.error("FS Error:", err);
    activeJob = { status: 'ERROR', log: [`File System Error: ${err.message}`] };
    return;
  }

  isHardwareBusy = true;
  const mkvBinary = makeMkvPath || DEFAULT_MAKEMKV_PATH;
  activeJob = {
    id: Date.now().toString(),
    currentFile: outputFileName,
    progress: 0,
    speed: 0,
    eta: 0,
    status: 'RUNNING',
    log: [`Starting: ${outputFileName}`, `Target: ${outputFolder}`, `Title ID: ${titleId}`],
    startTime: Date.now(),
    lastUpdate: Date.now(),
    lastProgress: 0,
    jobConfig: jobConfig
  };

  const args = [
    '-r', 
    '--progress=-stdout',
    '--cache=1024', 
    '--noscan',
    '--minlength=0', 
    'mkv', 
    `disc:${driveIndex}`, 
    titleId.toString(), 
    outputFolder
  ];

  activeJob.log.push(`CMD: ${mkvBinary}`);

  try {
    const mkv = spawn(mkvBinary, args);
    currentChildProcess = mkv;
    mkv.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (line.startsWith('PRGV:')) {
          const parts = line.split(':')[1].split(',');
          const current = parseInt(parts[0]);
          const max = parseInt(parts[2]);
          if (max > 0) {
            const currentProgress = current / max;
            const now = Date.now();
            const deltaT = (now - activeJob.lastUpdate) / 1000;
            if (deltaT >= 1) {
              const progressStep = currentProgress - activeJob.lastProgress;
              if (progressStep > 0) {
                 activeJob.speed = Math.min((progressStep * 1000).toFixed(1), 99.9);
                 activeJob.eta = Math.round((1 - currentProgress) / progressStep * deltaT);
              }
              activeJob.lastUpdate = now;
              activeJob.lastProgress = currentProgress;
            }
            activeJob.progress = Math.min(Math.floor(currentProgress * 100), 99);
          }
        } else if (trimmed.startsWith('MSG:')) {
           const parts = trimmed.split(',');
           if (parts.length > 3) {
             const msg = parts[3].replace(/"/g, '');
             if (msg.includes('Saving') || msg.includes('Failed') || msg.includes('Error')) {
                activeJob.log.push(`MKV: ${msg}`);
             }
           }
        }
      });
    });

    mkv.stderr.on('data', (data) => {
      const errLine = data.toString().trim();
      if (errLine) activeJob.log.push(`STDERR: ${errLine}`);
    });

    mkv.on('error', (err) => {
      activeJob.status = 'ERROR';
      activeJob.log.push(`CRITICAL: Launch failed: ${err.message}`);
      isHardwareBusy = false;
      currentChildProcess = null;
    });

    mkv.on('close', (code) => {
      currentChildProcess = null;
      if (code !== 0 && activeJob) {
        activeJob.log.push(`Process exited with code ${code}.`);
        if (activeJob.status !== 'ERROR') activeJob.status = 'DONE_CHECK';
      }
      if (activeJob) {
        try {
          const files = fs.readdirSync(outputFolder);
          const generatedFile = files.find(f => f.includes(`_t${titleId.toString().padStart(2, '0')}.mkv`)) 
                             || files.find(f => f.endsWith('.mkv') && !f.includes(outputFileName) && (Date.now() - fs.statSync(path.join(outputFolder, f)).mtimeMs < 60000));
          if (generatedFile) {
            const oldPath = path.join(outputFolder, generatedFile);
            const newPath = path.join(outputFolder, outputFileName);
            if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
            fs.renameSync(oldPath, newPath);
            activeJob.log.push(`Finalized: ${outputFileName}`);
          }
        } catch (e) {
          activeJob.log.push(`Rename Error: ${e.message}`);
        }
        activeJob.status = 'DONE_ITEM';
        activeJob.progress = 100;
      }
      setTimeout(() => {
        activeJob = null;
        if (jobQueue.length > 0) {
           processNextJob();
        } else {
           isHardwareBusy = false;
           activeJob = { status: 'COMPLETED', progress: 100, log: ['Batch Sequence Finished Successfully.'] };
           setTimeout(() => { if (activeJob && activeJob.status === 'COMPLETED') activeJob = null; }, 10000);
        }
      }, 1000);
    });
  } catch (e) {
    activeJob.status = 'ERROR';
    activeJob.log.push(`Spawn Error: ${e.message}`);
    isHardwareBusy = false;
  }
};

app.post('/api/cancel', (req, res) => {
  if (currentChildProcess) {
    currentChildProcess.kill('SIGTERM');
    currentChildProcess = null;
  }
  jobQueue = [];
  activeJob = null;
  isHardwareBusy = false;
  res.json({ status: 'cancelled' });
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', busy: isHardwareBusy, jobActive: !!activeJob && activeJob.status !== 'COMPLETED' });
});

app.get('/api/drives', (req, res) => {
  if (isHardwareBusy) return res.status(503).json({ error: 'Hardware is busy' });
  const mkvPath = req.query.path || DEFAULT_MAKEMKV_PATH;
  exec(`"${mkvPath}" -r --cache=128 info disc:-1`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const drives = [];
    stdout.split('\n').forEach(line => {
      if (line.startsWith('DRV:')) {
        const parts = line.substring(4).split(',');
        drives.push({
          index: parseInt(parts[0]),
          name: (parts[4] || 'Unknown').replace(/"/g, ''),
          discName: (parts[5] || '').replace(/"/g, '') || 'Empty Drive',
          visible: parts[1] === '1',
          enabled: parts[2] === '1'
        });
      }
    });
    res.json(drives);
  });
});

app.get('/api/scan/:index', (req, res) => {
  if (isHardwareBusy) return res.status(503).json({ error: 'Hardware is busy' });
  const mkvPath = req.query.path || DEFAULT_MAKEMKV_PATH;
  isHardwareBusy = true;
  exec(`"${mkvPath}" -r --cache=128 info disc:${req.params.index}`, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout) => {
    isHardwareBusy = false;
    if (err) return res.status(500).json({ error: err.message });
    const titles = [];
    stdout.split('\n').forEach(line => {
      if (line.startsWith('TINFO:')) {
        const parts = line.substring(6).split(',');
        const tIndex = parseInt(parts[0]);
        const attr = parseInt(parts[1]);
        if (!titles[tIndex]) titles[tIndex] = { id: tIndex, name: `Title ${tIndex + 1}`, sizeBytes: 0, confidence: 0, isMainFeature: false, durationSeconds: 0, streams: [] };
        if (attr === 9) {
          titles[tIndex].duration = parts[3].replace(/"/g, '');
          const hms = titles[tIndex].duration.split(':');
          titles[tIndex].durationSeconds = (+hms[0]) * 3600 + (+hms[1]) * 60 + (+hms[2]);
        }
        if (attr === 10) titles[tIndex].sizeString = parts[3].replace(/"/g, '');
        if (attr === 11) titles[tIndex].sizeBytes = parseInt(parts[3].replace(/"/g, ''));
        if (attr === 16) titles[tIndex].sourceFile = parts[3].replace(/"/g, '');
      }
      if (line.startsWith('SINFO:')) {
        const parts = line.substring(6).split(',');
        const tIndex = parseInt(parts[0]);
        const sIndex = parseInt(parts[1]);
        const attr = parseInt(parts[2]);
        if (titles[tIndex]) {
          if (!titles[tIndex].streams[sIndex]) titles[tIndex].streams[sIndex] = { id: sIndex, type: 'unknown', selected: true, codec: '', language: '', languageCode: '', details: '' };
          const stream = titles[tIndex].streams[sIndex];
          const val = parts[4].replace(/"/g, '');
          if (attr === 1) { 
            if (val === '6201' || val.toLowerCase().includes('video')) stream.type = 'video';
            if (val === '6202' || val.toLowerCase().includes('audio')) stream.type = 'audio';
            if (val === '6203' || val.toLowerCase().includes('subtitle')) stream.type = 'subtitle';
          }
          if (attr === 2) stream.language = val;
          if (attr === 3) stream.languageCode = val;
          if (attr === 5) stream.codec = val;
          if (attr === 6) stream.details = val;
          if (stream.type === 'video' && attr === 19) titles[tIndex].resolution = val;
          if (stream.type === 'video' && attr === 5) titles[tIndex].videoCodec = val;
          if (stream.type === 'audio' && sIndex === 0) {
            if (attr === 5) titles[tIndex].audioCodec = val;
            if (attr === 2) titles[tIndex].audioLanguage = val;
          }
        }
      }
    });
    const filteredTitles = titles.filter(t => t).map(t => ({ ...t, streams: t.streams.filter(s => s && s.type !== 'unknown') }));
    if (filteredTitles.length > 0) {
      const maxDuration = Math.max(...filteredTitles.map(t => t.durationSeconds));
      const maxSize = Math.max(...filteredTitles.map(t => t.sizeBytes));
      filteredTitles.forEach(t => {
        let score = 0;
        if (t.durationSeconds > 2700) score += 40;
        if (t.durationSeconds === maxDuration) score += 30;
        if (t.sizeBytes === maxSize) score += 20;
        t.confidence = score;
      });
      const mainFeature = [...filteredTitles].sort((a, b) => b.confidence - a.confidence)[0];
      if (mainFeature && mainFeature.confidence > 50) mainFeature.isMainFeature = true;
    }
    res.json(filteredTitles);
  });
});

app.post('/api/rip', (req, res) => {
  if (isHardwareBusy) return res.status(503).json({ error: 'Hardware is busy' });
  const { jobs, makeMkvPath } = req.body;
  if (!jobs || !jobs.length) return res.status(400).json({ error: "No jobs provided" });
  if (activeJob && activeJob.status === 'COMPLETED') activeJob = null;
  jobQueue = jobs.map(j => ({ ...j, makeMkvPath }));
  processNextJob();
  res.json({ jobId: "batch-sequence", queueLength: jobQueue.length });
});

app.get('/api/job/:id', (req, res) => {
  if (activeJob) res.json(activeJob);
  else res.json({ status: 'IDLE', progress: 0, log: [] }); 
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not Found' });
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => console.log(`Hardware Bridge: http://localhost:${port}`));