import { DriveInfo, TitleTrack, RipJobConfig, SystemConfig } from '../types';

const API_BASE = 'http://localhost:5005/api';

export const mkvService = {
  pingServer: async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${API_BASE}/status`, { signal: controller.signal });
      clearTimeout(id);
      return response.ok;
    } catch {
      return false;
    }
  },

  getSettings: async (): Promise<SystemConfig | null> => {
    try {
      const response = await fetch(`${API_BASE}/settings`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },

  saveSettings: async (config: SystemConfig): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  detectDrive: async (makeMkvPath?: string): Promise<DriveInfo | null> => {
    try {
      const response = await fetch(`${API_BASE}/drives?path=${encodeURIComponent(makeMkvPath || '')}`);
      if (response.status === 503) return null;
      if (!response.ok) return null;
      const drives: DriveInfo[] = await response.json();
      return drives.find(d => d.discName !== 'Empty Drive') || null;
    } catch {
      return null;
    }
  },

  scanDisc: async (index: number, makeMkvPath?: string): Promise<TitleTrack[]> => {
    try {
      const response = await fetch(`${API_BASE}/scan/${index}?path=${encodeURIComponent(makeMkvPath || '')}`);
      if (response.status === 503) throw new Error('Hardware is busy spinning up the disc...');
      if (!response.ok) throw new Error('Hardware busy or communication error.');
      return await response.json();
    } catch (e: any) {
      throw new Error(e.message || 'Scan failed');
    }
  },

  startBatchRip: async (
    jobs: RipJobConfig[],
    makeMkvPath: string
  ): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE}/rip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs, makeMkvPath })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Ripping process failed to initiate.');
      }
      const data = await response.json();
      return data.jobId;
    } catch (e: any) {
      throw new Error(e.message || 'Initialization failed');
    }
  },

  getJobStatus: async (jobId: string): Promise<{ progress: number, speed: number, eta: number, log: string[], status: string, currentFile?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/job/${jobId}`);
      if (!response.ok) return { progress: 0, speed: 0, eta: 0, log: [], status: 'ERROR' };
      return await response.json();
    } catch {
      return { progress: 0, speed: 0, eta: 0, log: [], status: 'STALLED' };
    }
  },

  cancelCurrentJob: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/cancel`, { method: 'POST' });
      return response.ok;
    } catch {
      return false;
    }
  }
};