import React, { useReducer, useEffect, useCallback, useRef, useState, memo } from 'react';
import { FSMState, AppState, AppAction, DriveInfo, TitleTrack, MediaMetadata, AppView, LibraryItem, EpisodeInfo, SystemConfig, RipJobConfig } from './types';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import StatusBar from './components/StatusBar';
import LibraryView from './components/LibraryView';
import SettingsModal from './components/SettingsModal';
import InsertDiscModal from './components/InsertDiscModal';
import OnboardingModal from './components/OnboardingModal';
import { mkvService } from './services/mkvService';
import { tmdbService } from './services/tmdbService';

const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

const defaultConfig: SystemConfig = {
  tmdbApiKey: '',
  outputPath: '',
  makeMkvPath: '',
  autoEject: true,
  minTitleLength: 120
};

const initialState: AppState = {
  status: FSMState.IDLE,
  currentView: 'monitor',
  drive: null,
  driveStatus: 'NO_DRIVE',
  titles: [],
  selectedTitles: [],
  metadata: null,
  availableEpisodes: [],
  selectedSeason: 1,
  progress: 0,
  speed: 0,
  eta: 0,
  log: ['System initialized. Awaiting hardware link...'],
  error: null,
  library: JSON.parse(localStorage.getItem('mkv_library') || '[]'),
  isServerConnected: false,
  serverUrl: 'http://localhost:5005',
  config: defaultConfig,
  isOnboarding: false,
  showEjectAlert: false
};

function ripReducer(state: AppState, action: AppAction): AppState {
  let newState = state;
  switch (action.type) {
    case 'RESET':
      newState = { 
        ...state, 
        ...initialState, 
        library: state.library, 
        config: state.config, 
        isServerConnected: state.isServerConnected, 
        log: [...state.log, 'Resetting system state...'].slice(-100)
      };
      break;
    case 'DISC_EJECTED':
      newState = {
        ...state,
        ...initialState,
        library: state.library,
        config: state.config,
        isServerConnected: state.isServerConnected,
        showEjectAlert: true,
        log: [...state.log, 'CRITICAL: Disc ejected unexpectedly. Process halted.'].slice(-100)
      };
      break;
    case 'CLEAR_EJECT_ALERT':
      newState = { ...state, showEjectAlert: false };
      break;
    case 'SWITCH_VIEW':
      newState = { ...state, currentView: action.payload };
      break;
    case 'SET_SERVER_STATUS':
      if (state.isServerConnected === action.payload) return state;
      newState = { ...state, isServerConnected: action.payload };
      break;
    case 'SET_DRIVE_SPINNING':
      newState = { ...state, driveStatus: 'SPINNING' };
      break;
    case 'SET_TRAY_OPEN':
      newState = { ...state, driveStatus: 'OPEN', status: FSMState.COMPLETED };
      break;
    case 'DRIVE_FOUND':
      newState = { 
        ...state, 
        status: FSMState.CHECKING, 
        drive: action.payload,
        driveStatus: 'LOADED',
        log: [...state.log, `Hardware linked. Disc detected: ${action.payload.discName}`].slice(-100) 
      };
      break;
    case 'SET_DRIVE_EMPTY':
      let newDriveStatus = state.driveStatus;
      if (action.payload.wasSpinning) {
        newDriveStatus = 'EMPTY';
      } else if (state.driveStatus === 'OPEN') {
        newDriveStatus = 'OPEN';
      } else {
        newDriveStatus = 'EMPTY';
      }
      newState = {
        ...state,
        drive: action.payload.drive,
        driveStatus: newDriveStatus,
        status: FSMState.IDLE
      };
      break;
    case 'SCAN_SUCCESS':
      newState = { 
        ...state, 
        status: FSMState.DETECTED, 
        titles: action.payload,
        log: [...state.log, `Scan complete. Found ${action.payload.length} master titles.`].slice(-100) 
      };
      break;
    case 'TOGGLE_STREAM':
      newState = {
        ...state,
        titles: state.titles.map(t => 
          t.id === action.payload.titleId 
          ? { 
              ...t, 
              streams: t.streams.map(s => s.id === action.payload.streamId ? { ...s, selected: !s.selected } : s)
            } 
          : t
        )
      };
      break;
    case 'METADATA_LOADED':
      newState = { 
        ...state, 
        status: FSMState.SELECTION, 
        metadata: action.payload,
        log: [...state.log, `Metadata updated: ${action.payload.title} (${action.payload.year})`].slice(-100) 
      };
      break;
    case 'EPISODES_LOADED':
      newState = { ...state, availableEpisodes: action.payload };
      break;
    case 'SET_SEASON':
      newState = { ...state, selectedSeason: action.payload };
      break;
    case 'ASSIGN_EPISODE':
      newState = { 
        ...state, 
        titles: state.titles.map(t => 
          t.id === action.payload.trackId ? { ...t, assignedEpisode: action.payload.episode } : t
        )
      };
      break;
    case 'SET_SELECTION':
      newState = { ...state, selectedTitles: action.payload };
      break;
    case 'SET_LAST_COMMAND':
      newState = { ...state, lastCommand: action.payload };
      break;
    case 'SET_STATE':
      newState = { ...state, status: action.payload };
      break;
    case 'UPDATE_PROGRESS':
      newState = { 
        ...state, 
        progress: action.payload.progress,
        speed: action.payload.speed,
        eta: action.payload.eta,
        currentJobName: action.payload.currentFile
      };
      break;
    case 'ADD_LOG':
      if (state.log.length > 0 && state.log[state.log.length - 1] === action.payload) return state;
      newState = { ...state, log: [...state.log, action.payload].slice(-100) };
      break;
    case 'SET_ERROR':
      newState = { ...state, status: FSMState.ERROR, error: action.payload, log: [...state.log, `CRITICAL: ${action.payload}`].slice(-100) };
      break;
    case 'ADD_TO_LIBRARY':
      newState = { ...state, library: [...state.library, action.payload] };
      break;
    case 'UPDATE_LIBRARY_ITEM':
      newState = { ...state, library: state.library.map(item => item.id === action.payload.id ? action.payload : item) };
      break;
    case 'DELETE_LIBRARY_ITEM':
      newState = { ...state, library: state.library.filter(item => item.id !== action.payload) };
      break;
    case 'UPDATE_CONFIG':
      newState = { ...state, config: { ...state.config, ...action.payload } };
      break;
    case 'SET_ONBOARDING':
      newState = { ...state, isOnboarding: action.payload };
      break;
    default:
      return state;
  }
  
  if (action.type.includes('LIBRARY')) {
    localStorage.setItem('mkv_library', JSON.stringify(newState.library));
  }
  return newState;
}

const LogConsole = memo(({ logs, lastCommand }: { logs: string[], lastCommand?: string }) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-44 border-t border-zinc-800 bg-[#0c0c0e]/95 backdrop-blur-md flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-40">
      <div className="px-5 py-2 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/30">
        <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-tighter font-bold text-[10px]">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          IO Pipeline Log
        </div>
        {lastCommand && (
           <div className="flex items-center gap-2">
             <span className="text-[10px] text-zinc-600 font-mono">Last CMD:</span>
             <code className="text-[10px] text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 font-mono">{lastCommand}</code>
           </div>
        )}
      </div>
      <div className="flex-1 p-5 font-mono text-[11px] overflow-y-auto space-y-1 custom-scrollbar">
        {logs.map((line, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-zinc-600 shrink-0 select-none">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
            <span className={line.startsWith('CRITICAL') || line.startsWith('ERROR') || line.includes('BRIDGE_MSG') ? 'text-red-400' : 'text-zinc-400'}>{line}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
});

const App: React.FC = () => {
  const [state, dispatch] = useReducer(ripReducer, initialState);
  const [showSettings, setShowSettings] = useState(false);
  const consecutiveFailures = useRef(0);

  useEffect(() => {
    const init = async () => {
      const config = await mkvService.getSettings();
      if (config) {
        dispatch({ type: 'UPDATE_CONFIG', payload: config });
        if (!config.tmdbApiKey) {
           dispatch({ type: 'SET_ONBOARDING', payload: true });
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    const check = async () => {
      const isUp = await mkvService.pingServer();
      if (!isUp) {
        consecutiveFailures.current++;
        if (consecutiveFailures.current >= 2 && state.isServerConnected) {
          dispatch({ type: 'SET_SERVER_STATUS', payload: false });
          dispatch({ type: 'ADD_LOG', payload: 'Lost connection to local bridge server.' });
        }
      } else {
        consecutiveFailures.current = 0;
        if (!state.isServerConnected) {
          dispatch({ type: 'SET_SERVER_STATUS', payload: true });
          dispatch({ type: 'ADD_LOG', payload: 'Connection established with local bridge.' });
        }
      }
    };
    check();
    const interval = setInterval(check, 4000);
    return () => clearInterval(interval);
  }, [state.isServerConnected]);

  useEffect(() => {
    if (state.showEjectAlert) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_EJECT_ALERT' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state.showEjectAlert]);

  const pollDrive = useCallback(async () => {
    const isWorking = [FSMState.CHECKING, FSMState.DETECTED, FSMState.SELECTION, FSMState.PREPARING, FSMState.RIPPING].includes(state.status);
    
    if ((state.status === FSMState.IDLE || state.status === FSMState.COMPLETED || isWorking) && state.isServerConnected) {
      try {
        const startTime = Date.now();
        const spinTimer = setTimeout(() => {
            if (state.driveStatus !== 'SPINNING') {
                dispatch({ type: 'SET_DRIVE_SPINNING' });
            }
        }, 2500);

        const drive = await mkvService.detectDrive(state.config.makeMkvPath);
        clearTimeout(spinTimer);
        const duration = Date.now() - startTime;
        const wasSpinning = duration > 2500;

        if (drive) {
          const isActuallyEmpty = drive.discName === 'Empty Drive';
          
          if (isWorking && isActuallyEmpty) {
            await mkvService.cancelCurrentJob();
            dispatch({ type: 'DISC_EJECTED' });
            return;
          }

          if (!isActuallyEmpty) {
            if (state.status === FSMState.COMPLETED && state.drive?.discName === drive.discName) return;
            if (state.status === FSMState.IDLE && state.drive?.discName === drive.discName && state.driveStatus === 'LOADED') return;
            dispatch({ type: 'DRIVE_FOUND', payload: drive });
          } else if (!isWorking) {
            dispatch({ type: 'SET_DRIVE_EMPTY', payload: { drive, wasSpinning } });
          }
        }
      } catch (e) {}
    }
  }, [state.status, state.isServerConnected, state.config.makeMkvPath, state.driveStatus, state.drive]);

  useEffect(() => {
    let timeoutId: any;
    let isMounted = true;
    const loop = async () => {
      if (!isMounted) return;
      await pollDrive();
      if (isMounted) {
        timeoutId = setTimeout(loop, 5000);
      }
    };
    loop();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [pollDrive]);

  useEffect(() => {
    if (state.status === FSMState.CHECKING && state.drive) {
      const analyze = async () => {
        try {
          dispatch({ type: 'SET_LAST_COMMAND', payload: `makemkvcon -r info disc:${state.drive!.index}` });
          const titles = await mkvService.scanDisc(state.drive!.index, state.config.makeMkvPath);
          dispatch({ type: 'SCAN_SUCCESS', payload: titles });
          dispatch({ type: 'ADD_LOG', payload: `Interrogating disc: ${state.drive!.discName}` });
          const metadata = await tmdbService.fetchMetadata(state.drive!.discName, state.config.tmdbApiKey);
          dispatch({ type: 'METADATA_LOADED', payload: metadata });
        } catch (e: any) {
          dispatch({ type: 'SET_ERROR', payload: e.message || "Hardware interrogation failed" });
        }
      };
      analyze();
    }
  }, [state.status, state.drive, state.config.makeMkvPath, state.config.tmdbApiKey]);

  useEffect(() => {
    if (state.metadata?.type === 'tv' && state.metadata.tmdbId) {
      const loadEpisodes = async () => {
        const episodes = await tmdbService.fetchSeasonEpisodes(state.metadata!.tmdbId!, state.selectedSeason, state.config.tmdbApiKey);
        dispatch({ type: 'EPISODES_LOADED', payload: episodes });
      };
      loadEpisodes();
    }
  }, [state.metadata?.tmdbId, state.selectedSeason, state.metadata?.type, state.config.tmdbApiKey]);

  const handleStartRip = useCallback(async () => {
    if (state.selectedTitles.length === 0 || !state.drive || !state.metadata) return;
    const jobs: RipJobConfig[] = [];
    const isTV = state.metadata.type === 'tv';
    state.selectedTitles.forEach(titleId => {
      const track = state.titles.find(t => t.id === titleId);
      if (!track) return;
      let finalFileName = '';
      let relativeFolder = '';
      const cleanTitle = state.metadata!.title.replace(/[<>:"/\\|?*]/g, '').trim();
      if (isTV && track.assignedEpisode) {
        const s = track.assignedEpisode.seasonNumber.toString().padStart(2, '0');
        const e = track.assignedEpisode.episodeNumber.toString().padStart(2, '0');
        const epName = track.assignedEpisode.name.replace(/[<>:"/\\|?*]/g, '').trim();
        finalFileName = `${cleanTitle} - S${s} E${e} - ${epName}.mkv`;
        relativeFolder = `${cleanTitle} (${state.metadata!.year})/Season ${track.assignedEpisode.seasonNumber}`;
      } else {
        relativeFolder = `${cleanTitle} (${state.metadata!.year})`;
        finalFileName = `${cleanTitle} (${state.metadata!.year}).mkv`;
        if (state.selectedTitles.length > 1) {
           finalFileName = `${cleanTitle} - ${track.name}.mkv`;
        }
      }
      const absoluteFolder = `${state.config.outputPath}\\${relativeFolder.replace(/\//g, '\\')}`;
      jobs.push({
        driveIndex: state.drive!.index,
        titleId: track.id,
        outputFolder: absoluteFolder,
        outputFileName: finalFileName,
        metadata: { title: state.metadata!.title, year: state.metadata!.year, overview: isTV && track.assignedEpisode ? track.assignedEpisode.overview : state.metadata!.overview },
        streamSelections: track.streams.map(s => ({ id: s.id, selected: s.selected }))
      });
    });
    try {
      dispatch({ type: 'SET_STATE', payload: FSMState.PREPARING });
      const jobId = await mkvService.startBatchRip(jobs, state.config.makeMkvPath);
      dispatch({ type: 'SET_LAST_COMMAND', payload: `Batch Sequence Initiated (${jobs.length} items)` });
      dispatch({ type: 'ADD_LOG', payload: `Archival sequence initiated for ${jobs.length} title(s)` });
      dispatch({ type: 'SET_STATE', payload: FSMState.RIPPING });
      const pollProgress = setInterval(async () => {
        const statusResponse = await mkvService.getJobStatus(jobId);
        dispatch({ type: 'UPDATE_PROGRESS', payload: { progress: statusResponse.progress, speed: statusResponse.speed, eta: statusResponse.eta, currentFile: statusResponse.currentFile } });
        if (statusResponse.log && statusResponse.log.length > 0) {
           const lastLog = statusResponse.log[statusResponse.log.length - 1];
           if (lastLog) dispatch({ type: 'ADD_LOG', payload: lastLog });
        }
        if (statusResponse.status === 'COMPLETED') {
          clearInterval(pollProgress);
          const newItem: LibraryItem = { ...state.metadata!, id: generateId(), rippedDate: new Date().toISOString(), fileSize: 'Archived', genres: state.metadata!.genres || ['Archive'], actors: [], tags: [state.metadata!.type.toUpperCase()], episodes: jobs.map(j => ({ title: j.outputFileName, season: state.selectedSeason, episode: 0, fileName: j.outputFileName })) };
          dispatch({ type: 'ADD_TO_LIBRARY', payload: newItem });
          dispatch({ type: 'ADD_LOG', payload: `Master Archival Complete: ${state.metadata!.title}` });
          if (state.config.autoEject) {
            dispatch({ type: 'ADD_LOG', payload: 'Auto-Eject triggered. Tray opening...' });
            dispatch({ type: 'SET_TRAY_OPEN' });
          } else {
            dispatch({ type: 'SET_STATE', payload: FSMState.COMPLETED });
          }
        } else if (statusResponse.status === 'ERROR' || statusResponse.status === 'IDLE') {
          clearInterval(pollProgress);
          if (statusResponse.status === 'ERROR') dispatch({ type: 'SET_ERROR', payload: `Bridge Failure` });
        }
      }, 1000); 
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    }
  }, [state.selectedTitles, state.drive, state.metadata, state.config.outputPath, state.config.makeMkvPath, state.titles, state.selectedSeason, state.config.autoEject]);

  const handleReset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const handleSwitchView = useCallback((view: AppView) => dispatch({ type: 'SWITCH_VIEW', payload: view }), []);
  const handleOpenSettings = useCallback(() => setShowSettings(true), []);
  const handleSelectionChange = useCallback((ids: number[]) => dispatch({ type: 'SET_SELECTION', payload: ids }), []);
  const handleSeasonChange = useCallback((s: number) => dispatch({ type: 'SET_SEASON', payload: s }), []);
  const handleMatchEpisode = useCallback((trackId: number, ep: EpisodeInfo | undefined) => dispatch({ type: 'ASSIGN_EPISODE', payload: { trackId, episode: ep } }), []);
  const handleMetadataUpdate = useCallback((meta: MediaMetadata) => dispatch({ type: 'METADATA_LOADED', payload: meta }), []);
  const handleToggleStream = useCallback((titleId: number, streamId: number) => dispatch({ type: 'TOGGLE_STREAM', payload: { titleId, streamId } }), []);
  const handleUpdateLibrary = useCallback((item: LibraryItem) => dispatch({ type: 'UPDATE_LIBRARY_ITEM', payload: item }), []);
  const handleDeleteLibrary = useCallback((id: string) => dispatch({ type: 'DELETE_LIBRARY_ITEM', payload: id }), []);
  const handleConfigUpdate = useCallback(async (cfg: SystemConfig) => {
    await mkvService.saveSettings(cfg);
    dispatch({ type: 'UPDATE_CONFIG', payload: cfg });
    setShowSettings(false);
    dispatch({ type: 'ADD_LOG', payload: `System settings updated: ${cfg.outputPath}` });
  }, []);

  const handleOnboardingComplete = useCallback(async (cfg: SystemConfig) => {
      await mkvService.saveSettings(cfg);
      dispatch({ type: 'UPDATE_CONFIG', payload: cfg });
      dispatch({ type: 'SET_ONBOARDING', payload: false });
      dispatch({ type: 'ADD_LOG', payload: 'System initialized with user configuration.' });
  }, []);

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans selection:bg-emerald-500/30">
      <Sidebar state={state} onReset={handleReset} onSwitchView={handleSwitchView} onOpenSettings={handleOpenSettings} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <StatusBar status={state.status} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative custom-scrollbar">
          {state.currentView === 'monitor' ? (
            <MainContent state={state} onSelectionChange={handleSelectionChange} onStartRip={handleStartRip} onSeasonChange={handleSeasonChange} onMatchEpisode={handleMatchEpisode} onMetadataUpdate={handleMetadataUpdate} onToggleStream={handleToggleStream} onReset={handleReset} />
          ) : (
            <LibraryView library={state.library} onUpdate={handleUpdateLibrary} onDelete={handleDeleteLibrary} />
          )}
        </main>
        <LogConsole logs={state.log} lastCommand={state.lastCommand} />
      </div>
      {showSettings && <SettingsModal config={state.config} onClose={() => setShowSettings(false)} onSave={handleConfigUpdate} />}
      {state.isOnboarding && <OnboardingModal defaultConfig={state.config} onComplete={handleOnboardingComplete} />}
      {(state.status === FSMState.IDLE || state.showEjectAlert) && !state.isOnboarding && (
        <InsertDiscModal status={state.driveStatus} driveName={state.drive?.name || 'Optical Drive'} onRefresh={pollDrive} isEjectAlert={state.showEjectAlert} />
      )}
    </div>
  );
};

export default App;