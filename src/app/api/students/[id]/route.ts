import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const student = await db.student.findUnique({
      where: { id },
      include: { documents: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération de l\'étudiant' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // If matricule is being changed, check uniqueness
    if (body.matricule) {
      const existing = await db.student.findUnique({
        where: { matricule: body.matricule },
      })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Ce matricule existe déjà' }, { status: 400 })
      }
    }

    const student = await db.student.update({
      where: { id },
      data: {
        matricule: body.matricule,
        nom: body.nom,
        prenom: body.prenom,
        dateNaissance: body.dateNaissance ?? undefined,
        lieuNaissance: body.lieuNaissance ?? undefined,
        sexe: body.sexe ?? undefined,
        nationalite: body.nationalite ?? undefined,
        photo: body.photo ?? undefined,
        telephone: body.telephone ?? undefined,
        email: body.email ?? undefined,
        adresse: body.adresse ?? undefined,
        nomPere: body.nomPere ?? undefined,
        nomMere: body.nomMere ?? undefined,
        telephonePere: body.telephonePere ?? undefined,
        telephoneMere: body.telephoneMere ?? undefined,
        adresseParents: body.adresseParents ?? undefined,
        personneContact: body.personneContact ?? undefined,
        telephoneContact: body.telephoneContact ?? undefined,
        lienParente: body.lienParente ?? undefined,
        filiere: body.filiere ?? undefined,
        niveau: body.niveau ?? undefined,
        anneeInscription: body.anneeInscription ?? undefined,
        statut: body.statut ?? undefined,
        numeroDossier: body.numeroDossier ?? undefined,
        etablissementOrigine: body.etablissementOrigine ?? undefined,
        diplomeOrigine: body.diplomeOrigine ?? undefined,
        anneeObtentionDiplome: body.anneeObtentionDiplome ?? undefined,
        bourse: body.bourse ?? undefined,
        chambre: body.chambre ?? undefined,
      },
      include: { documents: true },
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'étudiant' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.student.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'étudiant' }, { status: 500 })
  }
}
