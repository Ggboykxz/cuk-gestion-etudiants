import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const filiere = await db.filiere.update({
      where: { id },
      data: {
        code: body.code,
        nom: body.nom,
        description: body.description,
        niveau: body.niveau,
        responsable: body.responsable,
      }
    })

    return NextResponse.json(filiere)
  } catch (error) {
    console.error('Error updating filiere:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la filière' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.filiere.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting filiere:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de la filière' }, { status: 500 })
  }
}
