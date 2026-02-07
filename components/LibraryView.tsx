import React, { useState, useMemo } from 'react';
import { LibraryItem } from '../types';
import { Search, Filter, Edit2, Trash2, Calendar, HardDrive, Tag, X, Save, History, ChevronRight } from 'lucide-react';

interface LibraryViewProps {
  library: LibraryItem[];
  onUpdate: (item: LibraryItem) => void;
  onDelete: (id: string) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ library, onUpdate, onDelete }) => {
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<LibraryItem | null>(null);

  const filteredLibrary = useMemo(() => {
    return library.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.year.includes(search) ||
        item.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
        item.genres.some(g => g.toLowerCase().includes(search.toLowerCase()))
    );
  }, [library, search]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Media Library</h2>
          <p className="text-zinc-500 text-sm">Manage your archived media collection.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text"
              placeholder="Search title, year, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          <button className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl hover:bg-zinc-800 transition-colors">
            <Filter size={20} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {filteredLibrary.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-600">
          <History className="mb-4 opacity-20" size={64} />
          <p className="text-lg font-medium">No archived content found</p>
          <p className="text-sm">Start an archival sequence to populate your library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLibrary.map(item => (
            <div key={item.id} className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all hover:shadow-2xl hover:shadow-emerald-500/5 flex flex-col">
              <div className="aspect-[2/3] relative overflow-hidden bg-zinc-950">
                <img 
                  src={item.posterUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <div className="flex flex-col gap-2 w-full">
                    {item.type === 'tv' && (
                       <button 
                          onClick={() => setSelectedSeries(item)}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 text-xs font-bold py-2 rounded-lg hover:bg-emerald-400"
                       >
                         View Episodes <ChevronRight size={14} />
                       </button>
                    )}
                    <div className="flex gap-2">
                      <button 
                          onClick={() => setEditingItem(item)}
                          className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 text-xs font-bold py-2 rounded-lg hover:bg-white"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button 
                          onClick={() => onDelete(item.id)}
                          className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-zinc-100 uppercase tracking-widest border border-white/10">{item.type}</span>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-zinc-100 truncate flex-1">{item.title}</h3>
                  <span className="text-xs text-zinc-500 ml-2">{item.year}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {item.genres.slice(0, 2).map(g => (
                    <span key={g} className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">{g}</span>
                  ))}
                  {item.episodes && (
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                      {item.episodes.length} Eps
                    </span>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-800">
                  <div className="flex items-center gap-1">
                    <Calendar size={10} /> {new Date(item.rippedDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <HardDrive size={10} /> {item.fileSize}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Episodes Modal */}
      {selectedSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                 <div className="flex items-center gap-4">
                    <img src={selectedSeries.posterUrl} className="w-12 h-18 object-cover rounded-lg" alt="Poster" />
                    <div>
                       <h2 className="text-xl font-bold">{selectedSeries.title}</h2>
                       <p className="text-zinc-500 text-xs">Archived Episodes</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedSeries(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                 {selectedSeries.episodes && selectedSeries.episodes.length > 0 ? (
                    <div className="space-y-3">
                       {selectedSeries.episodes.map((ep, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl hover:border-emerald-500/30 transition-colors">
                             <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center font-bold text-emerald-500">
                                S{ep.season}E{ep.episode}
                             </div>
                             <div className="flex-1">
                                <h4 className="text-sm font-bold">{ep.title}</h4>
                                <p className="text-[10px] font-mono text-zinc-500">{ep.fileName}</p>
                             </div>
                             <button className="text-xs text-zinc-400 hover:text-white underline">Play</button>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 italic">
                       No individual episodes mapped for this series.
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
                <div className="w-full md:w-1/3 aspect-[2/3] md:aspect-auto">
                    <img src={editingItem.posterUrl} className="w-full h-full object-cover" alt="Poster" />
                </div>
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold">Edit Metadata</h2>
                        <button onClick={() => setEditingItem(null)} className="text-zinc-500 hover:text-white"><X /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Title</label>
                            <input 
                                value={editingItem.title} 
                                onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Year</label>
                                <input 
                                    value={editingItem.year} 
                                    onChange={(e) => setEditingItem({...editingItem, year: e.target.value})}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Type</label>
                                <select 
                                    value={editingItem.type}
                                    onChange={(e) => setEditingItem({...editingItem, type: e.target.value as any})}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="movie">Movie</option>
                                    <option value="tv">TV Series</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Synopsis</label>
                            <textarea 
                                rows={3}
                                value={editingItem.overview} 
                                onChange={(e) => setEditingItem({...editingItem, overview: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none resize-none" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Genres (comma separated)</label>
                            <input 
                                value={editingItem.genres.join(', ')} 
                                onChange={(e) => setEditingItem({...editingItem, genres: e.target.value.split(',').map(s => s.trim())})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Tags</label>
                            <div className="flex gap-2 flex-wrap mt-2">
                                {editingItem.tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md text-[10px] font-bold">
                                        <Tag size={10} /> {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button 
                            onClick={() => { onUpdate(editingItem); setEditingItem(null); }}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl hover:bg-emerald-400 transition-all"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(LibraryView);