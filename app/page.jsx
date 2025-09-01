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
        fetchNotes(); // Notları yeniden yükle
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
                  <div key={note.id || `note-${index}`} className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-black/30 transition-all duration-200 hover:scale-105">
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
    </div>
  );
}
