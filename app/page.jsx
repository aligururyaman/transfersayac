"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [author, setAuthor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Sayaç hesaplama
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 2); // 2 gün sonrası (24 saat daha)
      targetDate.setHours(0, 0, 0, 0);

      const difference = targetDate - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  // Notları yükle
  useEffect(() => {
    fetchNotes();
  }, []);

  // ESC tuşu ile modal kapatma
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showModal]);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      const data = await response.json();
      
      console.log('API Response:', data); // Debug için
      
      // API'den gelen verinin array olup olmadığını kontrol et
      if (Array.isArray(data)) {
        // Eğer data içinde JSON string'ler varsa parse et
        const parsedData = data.map(item => {
          if (typeof item === 'string') {
            try {
              return JSON.parse(item);
            } catch (e) {
              console.error('Frontend JSON parse error:', e);
              return null;
            }
          }
          return item;
        }).filter(item => item !== null);
        
        console.log('Final parsed data:', parsedData);
        setNotes(parsedData);
      } else {
        console.error('API geçersiz veri döndürdü:', data);
        setNotes([]); // Hata durumunda boş array kullan
      }
    } catch (error) {
      console.error('Notlar yüklenirken hata:', error);
      setNotes([]); // Hata durumunda boş array kullan
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newNote,
          author: author || 'Anonim'
        }),
      });

      if (response.ok) {
        setNewNote("");
        setAuthor("");
        setShowSuccess(true);
        fetchNotes(); // Notları yeniden yükle
        
        // 5 saniye sonra başarı mesajını gizle
        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Not eklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openNoteModal = (note) => {
    setSelectedNote(note);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedNote(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700 p-4">
      {/* Sayaç Bölümü */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 drop-shadow-lg">
          UCL Kadro Bildirimine Kalan Süre
        </h1>
        
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="text-6xl md:text-8xl lg:text-9xl font-mono font-bold text-white drop-shadow-lg">
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
        </div>
        
        <div className="mt-6 text-white/80 text-lg md:text-xl">
          Saat • Dakika • Saniye
        </div>
      </div>

      {/* Not Sistemi */}
      <div className="max-w-4xl mx-auto">
        {/* Not Ekleme Formu */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Not Bırak</h2>
          <form onSubmit={addNote} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Adınız (opsiyonel)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40"
              />
            </div>
            <div>
              <textarea
                placeholder="Notunuzu buraya yazın..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows="3"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !newNote.trim()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              {isLoading ? 'Gönderiliyor...' : 'Not Gönder'}
            </button>
          </form>
          
          {/* Başarı Mesajı */}
          {showSuccess && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-300 font-semibold text-center mb-3">✅ Mesajınız eklendi!</p>
              
              {/* Sosyal Medya Bölümü */}
              <div className="text-center">
                <h3 className="text-white font-semibold mb-3">Bizi Sosyal Medyadan Takip Edin</h3>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <a 
                    href="https://instagram.com/4231formasyonu" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </a>
                  
                  <a 
                    href="https://x.com/4231formasyon" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X (Twitter)
                  </a>
                  
                  <a 
                    href="https://youtube.com/@4231formasyonu" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notlar Listesi */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Notlar</h2>
          {!Array.isArray(notes) || notes.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              Henüz not bırakılmamış. İlk notu siz bırakın!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {notes.map((note, index) => {
                // Geçersiz note objelerini filtrele
                if (!note || typeof note !== 'object') {
                  return null;
                }
                
                return (
                  <div 
                    key={note.id || `note-${index}`} 
                    className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-black/30 transition-all duration-200 hover:scale-105 cursor-pointer"
                    onClick={() => openNoteModal(note)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-semibold text-white text-sm truncate max-w-[60%]">{note.author || 'Anonim'}</span>
                      <span className="text-white/60 text-xs">{note.timestamp ? formatDate(note.timestamp) : 'Tarih yok'}</span>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>{note.text || 'Not içeriği yok'}</p>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-black/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Not Detayı</h3>
              <button
                onClick={closeModal}
                className="text-white/60 hover:text-white text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-white text-lg">{selectedNote.author || 'Anonim'}</span>
                <span className="text-white/60 text-sm">{selectedNote.timestamp ? formatDate(selectedNote.timestamp) : 'Tarih yok'}</span>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/90 leading-relaxed text-base whitespace-pre-wrap">
                  {selectedNote.text || 'Not içeriği yok'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
