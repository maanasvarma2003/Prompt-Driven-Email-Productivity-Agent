import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const updated = db.updateDraft(id, {
    subject: body.subject,
    body: body.body
  });

  if (!updated) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const success = db.deleteDraft(id);

  if (!success) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}


