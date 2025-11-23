import { NextResponse } from 'next/server';
import { db } from '@/lib/store';
import { learnFromEdit } from '@/lib/style-learner';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Retrieve original draft to compare (for Style Learning)
  const originalDraft = db.getDrafts().find(d => d.id === id);

  const updated = db.updateDraft(id, {
    subject: body.subject,
    body: body.body,
    attachments: body.attachments
  });

  if (!updated) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  // 🧬 Digital DNA: Learn from the edit
  if (originalDraft && originalDraft.body !== body.body) {
     // Fire and forget - don't block response
     console.log("🧬 Detecting Style Change...");
     learnFromEdit(originalDraft.body, body.body);
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






