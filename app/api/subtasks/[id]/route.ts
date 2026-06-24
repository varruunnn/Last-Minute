import { NextResponse } from 'next/server';
import { prisma } from '../../../../db'; 
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { status } = await req.json(); 
    const resolvedParams = await params;
    const subTaskId = resolvedParams.id;
    
    const updated = await prisma.subTask.update({
      where: { id: subTaskId },
      data: { status }
    });
    
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating subtask:", error);
    return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
  }
}