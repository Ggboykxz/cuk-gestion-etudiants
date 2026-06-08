import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.code) {
      const existing = await db.filiere.findUnique({
        where: { code: body.code },
      })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Ce code de filière existe déjà' }, { status: 400 })
      }
    }

    const filiere = await db.filiere.update({
      where: { id },
      data: {
        code: body.code ?? undefined,
        nom: body.nom ?? undefined,
        description: body.description ?? undefined,
        niveau: body.niveau ?? undefined,
        responsable: body.responsable ?? undefined,
      },
    })

    return NextResponse.json(filiere)
  } catch (error) {
    console.error('Error updating filière:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la filière' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.filiere.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting filière:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de la filière' }, { status: 500 })
  }
}
