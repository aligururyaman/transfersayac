
import { NextResponse } from 'next/server';

// Geçici in-memory storage (Redis kurulumu tamamlanana kadar)
let notes = [];

// Upstash Redis kullanımı (gelecekte kullanılacak)
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Redis işlemleri için yardımcı fonksiyonlar
async function redisGet(key) {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis environment variables not configured');
  }
  
  const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });
  
  const data = await response.json();
  return data.result;
}

async function redisSet(key, value) {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis environment variables not configured');
  }
  
  const response = await fetch(`${UPSTASH_REDIS_REST_URL}/set/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
  
  return response.json();
}

async function redisLpush(key, value) {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis environment variables not configured');
  }
  
  const response = await fetch(`${UPSTASH_REDIS_REST_URL}/lpush/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
  
  return response.json();
}

async function redisLrange(key, start, end) {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis environment variables not configured');
  }
  
  const response = await fetch(`${UPSTASH_REDIS_REST_URL}/lrange/${key}/${start}/${end}`, {
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });
  
  const data = await response.json();
  return data.result;
}

async function redisLtrim(key, start, end) {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis environment variables not configured');
  }
  
  const response = await fetch(`${UPSTASH_REDIS_REST_URL}/ltrim/${key}/${start}/${end}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });
  
  return response.json();
}

// GET - Notları getir
export async function GET() {
  try {
    // Redis bağlantısı yoksa geçici in-memory storage kullan
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      console.log('Redis not configured, using in-memory storage');
      return NextResponse.json(notes);
    }
    
    const redisNotes = await redisLrange('notes', 0, -1);
    console.log('Redis notes raw:', redisNotes); // Debug için
    
    const parsedNotes = redisNotes.map(note => {
      try {
        return JSON.parse(note);
      } catch (e) {
        console.error('JSON parse error:', e, 'for note:', note);
        return null;
      }
    }).filter(note => note !== null); // null değerleri filtrele
    
    console.log('Parsed notes:', parsedNotes); // Debug için
    return NextResponse.json(parsedNotes);
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json(notes); // Hata durumunda in-memory storage kullan
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

    // Redis bağlantısı yoksa geçici in-memory storage kullan
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      console.log('Redis not configured, using in-memory storage');
      notes.unshift(newNote);
      
      // Maksimum 100 not tut (performans için)
      if (notes.length > 100) {
        notes = notes.slice(0, 100);
      }
      
      return NextResponse.json(newNote);
    }

    // Notu listenin başına ekle (en yeni en üstte)
    await redisLpush('notes', JSON.stringify(newNote));
    
    // Maksimum 100 not tut (performans için)
    await redisLtrim('notes', 0, 99);

    return NextResponse.json(newNote);
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ error: 'Not eklenirken hata oluştu' }, { status: 500 });
  }
}

