import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const document = await db.document.findUnique({
      where: { id },
      include: { student: { select: { id: true, nom: true, prenom: true, matricule: true } } },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération du document' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const document = await db.document.findUnique({ where: { id } })

    if (document?.fichier) {
      const { existsSync, unlinkSync } = await import('fs')
      const { join } = await import('path')
      const fullPath = join(process.cwd(), 'public', document.fichier)
      if (existsSync(fullPath)) {
        unlinkSync(fullPath)
      }
    }

    await db.document.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression du document' }, { status: 500 })
  }
}
