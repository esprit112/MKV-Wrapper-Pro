import React, { useState, useEffect, useCallback, memo } from 'react';
import { AppState, FSMState, EpisodeInfo, MediaMetadata } from '../types';
import { Play, Check, AlertTriangle, Loader2, Info, CheckCircle2, Copy, Search, Layers, X, Film, ChevronDown, ChevronRight, Music, Subtitles, Volume2, Edit3, ListVideo, RefreshCcw, Monitor, Upload } from 'lucide-react';
import { tmdbService } from '../services/tmdbService';

interface MainContentProps {
  state: AppState;
  onSelectionChange: (ids: number[]) => void;
  onStartRip: () => void;
  onSeasonChange: (season: number) => void;
  onMatchEpisode: (trackId: number, episode: EpisodeInfo | undefined) => void;
  onMetadataUpdate: (meta: MediaMetadata) => void;
  onToggleStream: (titleId: number, streamId: number) => void;
  onReset: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ 
  state, 
  onSelectionChange, 
  onStartRip, 
  onSeasonChange,
  onMatchEpisode,
  onMetadataUpdate,
  onToggleStream,
  onReset
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedTitles, setExpandedTitles] = useState<number[]>([]);

  useEffect(() => {
    if (state.status === FSMState.SELECTION && state.selectedTitles.length === 0) {
      const main = state.titles.find(t => t.isMainFeature);
      if (main) {
        onSelectionChange([main.id]);
        setExpandedTitles([main.id]);
      }
    }
  }, [state.status, state.titles, state.selectedTitles.length, onSelectionChange]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedTitles(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await tmdbService.search(searchQuery, state.config.tmdbApiKey);
    setSearchResults(results);
    setIsSearching(false);
  };

  const selectManualMetadata = (meta: MediaMetadata) => {
    onMetadataUpdate(meta);
    setShowSearch(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  if (!state.isServerConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto py-10">
        <div className="w-20 h-20 bg-amber-500/10 rounded-[24px] flex items-center justify-center mb-8 border border-amber-500/20 shadow-2xl relative">
          <Monitor className="text-amber-500" size={36} />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-[#09090b] animate-pulse" />
        </div>
        <h2 className="text-4xl font-black mb-4 tracking-tight uppercase">Initialize Pipeline</h2>
        <p className="text-zinc-400 text-center leading-relaxed mb-10 text-lg">
          The hardware bridge is currently initializing. <br/>
          Ensure the server.js is running on port 5005.
        </p>
      </div>
    );
  }

  if (state.status === FSMState.IDLE) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-10 border border-zinc-800 shadow-xl relative">
          <Loader2 className="text-emerald-500 animate-spin" size={44} strokeWidth={1.5} />
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
        </div>
        <h2 className="text-4xl font-black mb-4 tracking-tight uppercase">Hardware Ready</h2>
        <p className="text-zinc-400 leading-relaxed mb-10 text-lg">
          Waiting for drive initialization...
        </p>
      </div>
    );
  }

  if (state.status === FSMState.CHECKING || (state.status === FSMState.DETECTED && !state.metadata)) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
        <div className="w-20 h-20 border-[6px] border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-8 shadow-lg" />
        <h3 className="text-3xl font-black mb-2 tracking-tight uppercase">Optical Spin-Up</h3>
        <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
          The drive is interrogating the disc structure and identifying streams.
        </p>
      </div>
    );
  }

  if (state.status === FSMState.COMPLETED) {
    const isTrayOpen = state.driveStatus === 'OPEN';
    
    return (
      <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto animate-in fade-in zoom-in duration-500">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 border shadow-[0_0_40px_rgba(16,185,129,0.2)] ${
            isTrayOpen ? 'bg-blue-500/10 border-blue-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
        }`}>
          {isTrayOpen ? <Upload className="text-blue-500" size={48} /> : <CheckCircle2 className="text-emerald-500" size={48} />}
        </div>
        <h2 className="text-4xl font-black mb-4 tracking-tight uppercase">
            {isTrayOpen ? 'Tray Opened' : 'Archival Complete'}
        </h2>
        <p className="text-zinc-400 leading-relaxed mb-10 text-lg">
           {isTrayOpen 
             ? 'Process finished. Please remove the disc from the tray.' 
             : 'Process finished successfully. The media has been added to your library.'}
        </p>
        <button 
          onClick={onReset}
          className="flex items-center gap-3 bg-zinc-100 hover:bg-white text-zinc-950 font-black px-8 py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
        >
          <RefreshCcw size={18} />
          START NEW SESSION
        </button>
      </div>
    );
  }

  const isTV = state.metadata?.type === 'tv';
  const isRipping = state.status === FSMState.RIPPING || state.status === FSMState.PREPARING;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Metadata Header */}
      <div className="flex flex-col xl:flex-row gap-10 glass p-10 rounded-[32px] relative overflow-hidden group border border-emerald-500/10">
        <div className="w-64 h-96 bg-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 relative group-hover:scale-[1.02] transition-transform duration-500">
           {state.metadata?.posterUrl ? (
              <img 
                src={state.metadata.posterUrl} 
                alt="Poster" 
                className="w-full h-full object-cover" 
                loading="lazy" 
                decoding="async" 
              />
           ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Info className="text-zinc-700" size={40} /></div>
           )}
           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => { setShowSearch(true); setSearchQuery(state.metadata?.title || ''); }}
                className="bg-white text-black p-3 rounded-full hover:bg-emerald-500 transition-colors"
              >
                <Search size={24} />
              </button>
           </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-4 mb-4">
              <h2 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
                {state.metadata?.title || 'Unknown Disc'}
              </h2>
              <span className="px-3 py-1 bg-emerald-500 text-zinc-950 rounded-full text-[10px] font-black uppercase tracking-widest">{state.metadata?.year}</span>
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 text-zinc-500 hover:text-emerald-500 transition-colors"
                title="Manual Search"
              >
                <Edit3 size={18} />
              </button>
          </div>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-3xl line-clamp-3 font-light">{state.metadata?.overview}</p>
          
          <div className="flex flex-wrap gap-5 items-center">
              {!isRipping ? (
                <button 
                  onClick={onStartRip}
                  disabled={state.selectedTitles.length === 0}
                  className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-zinc-950 font-black px-10 py-4 rounded-2xl transition-all shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:-translate-y-1"
                >
                  <Play fill="currentColor" size={20} />
                  START BATCH RIP
                </button>
              ) : (
                <div className="flex-1 space-y-5 max-w-md">
                  <div className="flex justify-between items-end">
                     <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Loader2 size={16} className="text-emerald-500 animate-spin" />
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Processing Batch</span>
                        </div>
                        {state.currentJobName && (
                          <span className="text-[10px] text-zinc-400 truncate max-w-[200px] font-mono">{state.currentJobName}</span>
                        )}
                     </div>
                     <div className="text-right">
                        <div className="text-3xl font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{state.progress}%</div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">{state.speed}X SPEED</div>
                     </div>
                  </div>
                  
                  {/* Enhanced Sophisticated Progress Bar */}
                  <div className="h-4 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] relative">
                     <div 
                       className="h-full bg-gradient-to-r from-emerald-700 via-emerald-400 to-emerald-600 transition-all duration-1000 ease-out shadow-[0_0_25px_rgba(16,185,129,0.4)] relative" 
                       style={{ width: `${state.progress}%` }}
                     >
                        {/* Shimmer Overlay */}
                        <div className="absolute inset-0 w-[200px] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        
                        {/* Glowing Active Edge */}
                        <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-white shadow-[0_0_15px_#fff,0_0_30px_#10b981]" />
                     </div>
                  </div>

                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                     <span>Estimated Time</span>
                     <span className="text-emerald-500 tabular-nums font-mono">{state.eta > 0 ? `${Math.floor(state.eta / 60)}m ${state.eta % 60}s` : 'Calculating...'}</span>
                  </div>
                </div>
              )}

              {!isRipping && isTV && (
                <div className="flex items-center gap-3 glass px-5 py-4 rounded-2xl border-zinc-700/50">
                  <Layers size={18} className="text-emerald-500" />
                  <span className="text-xs font-black uppercase text-zinc-400">Target Season</span>
                  <select 
                    value={state.selectedSeason}
                    onChange={(e) => onSeasonChange(parseInt(e.target.value))}
                    className="bg-transparent border-none text-emerald-500 text-lg font-black focus:ring-0 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(s => <option key={s} value={s} className="bg-zinc-900">S{s.toString().padStart(2, '0')}</option>)}
                  </select>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Title Selection Table */}
      {!isRipping && (
        <div className="glass rounded-[32px] overflow-hidden border border-zinc-800/50">
          <div className="px-8 py-6 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-center">
             <h3 className="font-black text-xs tracking-widest uppercase text-zinc-500 flex items-center gap-2">
               <Copy size={14} /> Tracks Discovered
             </h3>
             <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                {state.selectedTitles.length} Track(s) Selected
             </div>
          </div>
          
          <div className="divide-y divide-zinc-800/30">
            {state.titles.map((title) => {
              const isExpanded = expandedTitles.includes(title.id);
              const isSelected = state.selectedTitles.includes(title.id);
              
              return (
                <div key={title.id} className={`${isSelected ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/10'} transition-all duration-300`}>
                  {/* Title Header Row */}
                  <div className="flex items-center px-8 py-6 group">
                    <div className="w-12 flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {
                          const newSelection = isSelected
                            ? state.selectedTitles.filter(id => id !== title.id)
                            : [...state.selectedTitles, title.id];
                          onSelectionChange(newSelection);
                        }}
                        className="w-5 h-5 rounded-lg border-zinc-700 bg-zinc-950 text-emerald-500 cursor-pointer focus:ring-offset-zinc-950 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <button 
                      onClick={() => toggleExpand(title.id)}
                      className="flex-1 text-left flex items-center gap-6"
                    >
                      <div className="w-6 h-6 flex items-center justify-center text-zinc-500 group-hover:text-emerald-500 transition-colors">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-zinc-200 text-lg">{title.name}</span>
                          {title.isMainFeature && !isTV && (
                            <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded text-[9px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">Main Feature</div>
                          )}
                        </div>
                        
                        {isTV && (
                          <div className="mt-2 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2 text-zinc-500">
                              <ListVideo size={14} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Map Episode:</span>
                            </div>
                            <select 
                              className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs py-1 px-2 text-zinc-300 focus:ring-1 focus:ring-emerald-500 outline-none max-w-[250px]"
                              value={title.assignedEpisode?.id || ''}
                              onChange={(e) => {
                                const epId = parseInt(e.target.value);
                                const ep = state.availableEpisodes.find(ep => ep.id === epId);
                                onMatchEpisode(title.id, ep);
                              }}
                            >
                              <option value="">-- Unassigned --</option>
                              {state.availableEpisodes.map(ep => (
                                <option key={ep.id} value={ep.id}>
                                  S{ep.seasonNumber.toString().padStart(2, '0')}E{ep.episodeNumber.toString().padStart(2, '0')} - {ep.name}
                                </option>
                              ))}
                            </select>
                            {title.assignedEpisode && (
                              <span className="text-[10px] text-emerald-500 font-mono">
                                {state.metadata?.title} - S{title.assignedEpisode.seasonNumber.toString().padStart(2,'0')}E{title.assignedEpisode.episodeNumber.toString().padStart(2,'0')}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="text-[10px] font-mono text-zinc-600 mt-1 uppercase">SOURCE: {title.sourceFile}</div>
                      </div>

                      <div className="flex items-center gap-8 font-mono text-zinc-400">
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] text-zinc-600 uppercase font-black">Runtime</span>
                           <span className="font-bold">{title.duration}</span>
                        </div>
                        <div className="flex flex-col items-end w-24">
                           <span className="text-[10px] text-zinc-600 uppercase font-black">Size</span>
                           <span className="font-bold">{title.sizeString}</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Expanded Stream Content */}
                  {isExpanded && (
                    <div className="px-24 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
                      {/* Video Stream (Summary) */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <Film size={12} /> Video Stream
                        </h4>
                        <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
                          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-emerald-500 border border-zinc-800">
                            <Monitor size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-zinc-200">{title.resolution} <span className="text-zinc-500 font-medium">({title.videoCodec})</span></div>
                            <div className="text-[10px] text-zinc-500 uppercase font-bold">Primary Bitstream Decode</div>
                          </div>
                        </div>
                      </div>

                      {/* Audio Tracks */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <Music size={12} /> Audio Tracks
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {title.streams.filter(s => s.type === 'audio').map(stream => (
                            <div 
                              key={stream.id}
                              onClick={() => onToggleStream(title.id, stream.id)}
                              className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                                stream.selected ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]' : 'bg-zinc-950/20 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                stream.selected ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'border-zinc-700'
                              }`}>
                                {stream.selected && <Check size={14} strokeWidth={3} />}
                              </div>
                              <div className="w-8 text-[10px] font-mono text-zinc-600 font-bold uppercase">{stream.languageCode}</div>
                              <div className="flex-1">
                                <div className="text-sm font-bold text-zinc-300">{stream.codec} <span className="text-zinc-500 text-xs ml-2">({stream.details})</span></div>
                                <div className="text-[10px] text-zinc-600 uppercase font-black">{stream.language}</div>
                              </div>
                              <Volume2 size={16} className={stream.selected ? 'text-emerald-500' : 'text-zinc-800'} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Subtitle Tracks */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <Subtitles size={12} /> Subtitle Selections
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {title.streams.filter(s => s.type === 'subtitle').map(stream => (
                            <div 
                              key={stream.id}
                              onClick={() => onToggleStream(title.id, stream.id)}
                              className={`flex items-center gap-4 p-3 rounded-2xl border cursor-pointer transition-all ${
                                stream.selected ? 'bg-blue-500/5 border-blue-500/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]' : 'bg-zinc-950/20 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                stream.selected ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-700'
                              }`}>
                                {stream.selected && <Check size={12} strokeWidth={3} />}
                              </div>
                              <div className="flex-1 flex items-center gap-3">
                                <span className="text-[10px] font-mono text-zinc-600 font-bold uppercase">{stream.languageCode}</span>
                                <span className="text-xs font-bold text-zinc-400">{stream.details || stream.language}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700">
                  <Search className="text-emerald-500" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase">Manual Metadata Search</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Querying TMDB Master Database</p>
                </div>
              </div>
              <button onClick={() => setShowSearch(false)} className="p-3 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"><X /></button>
            </div>

            <div className="p-10 flex flex-col flex-1 overflow-hidden">
              <form onSubmit={handleManualSearch} className="relative mb-8">
                <input 
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type movie or series title..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-emerald-500 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <button 
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-emerald-500 text-zinc-950 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all"
                >
                  Search
                </button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                {isSearching ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Consulting Archives...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((result) => (
                      <div 
                        key={result.tmdbId}
                        onClick={() => selectManualMetadata(result)}
                        className="group flex gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-[24px] hover:border-emerald-500/50 transition-all cursor-pointer relative overflow-hidden"
                      >
                        <div className="w-24 aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden flex-shrink-0">
                          <img 
                            src={result.posterUrl} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            alt="" 
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-start">
                            <h4 className="font-black text-zinc-100 text-lg leading-tight mb-1">{result.title}</h4>
                            <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-bold">{result.year}</span>
                          </div>
                          <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed mb-3">{result.overview}</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">{result.type}</span>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors pointer-events-none" />
                      </div>
                    ))}
                  </div>
                ) : searchQuery && (
                  <div className="h-64 flex flex-col items-center justify-center text-zinc-600">
                    <AlertTriangle size={40} className="mb-4 opacity-20" />
                    <p className="text-lg font-bold">No Records Found</p>
                    <p className="text-xs uppercase tracking-widest">Verify the title spelling and try again</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(MainContent);