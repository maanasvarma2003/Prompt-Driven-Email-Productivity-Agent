import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET() {
  return NextResponse.json(db.getPrompts());
}

export async function POST(req: Request) {
  const { id, template } = await req.json();
  
  const updated = db.updatePrompt(id, template);
  
  if (!updated) {
    return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
  }
  
  return NextResponse.json(updated);
}



