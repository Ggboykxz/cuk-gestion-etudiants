import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const student = await db.student.findUnique({
      where: { id },
      include: {
        inscriptions: {
          include: {
            promotion: {
              include: { filiere: true }
            },
            notes: {
              include: { matiere: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        documents: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement de l\'étudiant' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const student = await db.student.update({
      where: { id },
      data: {
        matricule: body.matricule,
        nom: body.nom,
        prenom: body.prenom,
        dateNaissance: body.dateNaissance,
        lieuNaissance: body.lieuNaissance,
        sexe: body.sexe,
        nationalite: body.nationalite,
        photo: body.photo,
        telephone: body.telephone,
        email: body.email,
        adresse: body.adresse,
        nomPere: body.nomPere,
        nomMere: body.nomMere,
        telephonePere: body.telephonePere,
        telephoneMere: body.telephoneMere,
        adresseParents: body.adresseParents,
        personneContact: body.personneContact,
        telephoneContact: body.telephoneContact,
        lienParente: body.lienParente,
        etablissementOrigine: body.etablissementOrigine,
        diplomeOrigine: body.diplomeOrigine,
        anneeObtentionDiplome: body.anneeObtentionDiplome,
        bourse: body.bourse,
        chambre: body.chambre,
      }
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'étudiant' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    await db.student.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'étudiant' }, { status: 500 })
  }
}
