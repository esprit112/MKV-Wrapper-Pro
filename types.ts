export enum FSMState {
  IDLE = 'IDLE',
  CHECKING = 'CHECKING',
  DETECTED = 'DETECTED',
  SELECTION = 'SELECTION',
  PREPARING = 'PREPARING',
  RIPPING = 'RIPPING',
  TRANSCODING = 'TRANSCODING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface MediaStream {
  id: number;
  type: 'video' | 'audio' | 'subtitle';
  codec: string;
  language: string;
  languageCode: string;
  details: string;
  selected: boolean;
}

export interface DriveInfo {
  index: number;
  name: string;
  discName: string;
  visible: boolean;
  enabled: boolean;
}

export interface TitleTrack {
  id: number;
  name: string;
  duration: string;
  durationSeconds: number;
  sizeBytes: number;
  sizeString: string;
  chapters: number;
  sourceFile: string;
  outputFile: string;
  isMainFeature: boolean;
  confidence: number;
  resolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  audioLanguage?: string;
  isLionsgateObfuscated?: boolean;
  assignedEpisode?: EpisodeInfo;
  streams: MediaStream[];
}

export interface EpisodeInfo {
  id: number;
  name: string;
  episodeNumber: number;
  seasonNumber: number;
  overview: string;
  airDate: string;
  stillPath?: string;
}

export interface MediaMetadata {
  tmdbId?: number;
  title: string;
  year: string;
  posterUrl: string;
  overview: string;
  type: 'movie' | 'tv';
  genres?: string[];
  seasonsCount?: number;
}

export interface LibraryItem extends MediaMetadata {
  id: string;
  rippedDate: string;
  fileSize: string;
  genres: string[];
  actors: string[];
  tags: string[];
  episodes?: {
    title: string;
    season: number;
    episode: number;
    fileName: string;
  }[];
}

export interface SystemConfig {
  tmdbApiKey: string;
  outputPath: string;
  makeMkvPath: string;
  autoEject: boolean;
  minTitleLength: number;
}

export interface RipJobConfig {
  driveIndex: number;
  titleId: number;
  outputFolder: string;
  outputFileName: string;
  metadata: {
    title: string;
    year: string;
    overview: string;
  };
  streamSelections: { id: number; selected: boolean }[];
}

export type AppView = 'monitor' | 'library';
export type DriveStatus = 'NO_DRIVE' | 'EMPTY' | 'OPEN' | 'SPINNING' | 'LOADED';

export interface AppState {
  status: FSMState;
  currentView: AppView;
  drive: DriveInfo | null;
  driveStatus: DriveStatus;
  titles: TitleTrack[];
  selectedTitles: number[];
  metadata: MediaMetadata | null;
  availableEpisodes: EpisodeInfo[];
  selectedSeason: number;
  progress: number;
  speed: number;
  eta: number;
  currentJobName?: string;
  log: string[];
  error: string | null;
  library: LibraryItem[];
  isServerConnected: boolean;
  serverUrl: string;
  lastCommand?: string;
  config: SystemConfig;
  isOnboarding: boolean;
  showEjectAlert: boolean;
}

export type AppAction =
  | { type: 'RESET' }
  | { type: 'SWITCH_VIEW'; payload: AppView }
  | { type: 'SET_SERVER_STATUS'; payload: boolean }
  | { type: 'DRIVE_FOUND'; payload: DriveInfo }
  | { type: 'SET_DRIVE_EMPTY'; payload: { drive: DriveInfo; wasSpinning: boolean } }
  | { type: 'SET_DRIVE_SPINNING' }
  | { type: 'SET_TRAY_OPEN' }
  | { type: 'SCAN_SUCCESS'; payload: TitleTrack[] }
  | { type: 'TOGGLE_STREAM'; payload: { titleId: number; streamId: number } }
  | { type: 'METADATA_LOADED'; payload: MediaMetadata }
  | { type: 'EPISODES_LOADED'; payload: EpisodeInfo[] }
  | { type: 'SET_SEASON'; payload: number }
  | { type: 'ASSIGN_EPISODE'; payload: { trackId: number; episode: EpisodeInfo | undefined } }
  | { type: 'SET_SELECTION'; payload: number[] }
  | { type: 'SET_LAST_COMMAND'; payload: string }
  | { type: 'UPDATE_PROGRESS'; payload: { progress: number; speed: number; eta: number; currentFile?: string } }
  | { type: 'ADD_LOG'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_STATE'; payload: FSMState }
  | { type: 'ADD_TO_LIBRARY'; payload: LibraryItem }
  | { type: 'UPDATE_LIBRARY_ITEM'; payload: LibraryItem }
  | { type: 'DELETE_LIBRARY_ITEM'; payload: string }
  | { type: 'UPDATE_CONFIG'; payload: Partial<SystemConfig> }
  | { type: 'SET_ONBOARDING'; payload: boolean }
  | { type: 'DISC_EJECTED' }
  | { type: 'CLEAR_EJECT_ALERT' };