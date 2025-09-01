import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// GET - Notları getir
export async function GET() {
  try {
    const notes = await kv.lrange('notes', 0, -1);
    const parsedNotes = notes.map(note => JSON.parse(note));
    return NextResponse.json(parsedNotes);
  } catch (error) {
    return NextResponse.json({ error: 'Notlar yüklenirken hata oluştu' }, { status: 500 });
  }
}

// POST - Yeni not ekle
export async function POST(request) {
  try {
    const { text, author } = await request.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Not metni gerekli' }, { status: 400 });
    }

    const newNote = {
      id: Date.now().toString(),
      text: text.trim(),
      author: author || 'Anonim',
      timestamp: new Date().toISOString(),
    };

    // Notu listenin başına ekle (en yeni en üstte)
    await kv.lpush('notes', JSON.stringify(newNote));
    
    // Maksimum 100 not tut (performans için)
    await kv.ltrim('notes', 0, 99);

    return NextResponse.json(newNote);
  } catch (error) {
    return NextResponse.json({ error: 'Not eklenirken hata oluştu' }, { status: 500 });
  }
}

