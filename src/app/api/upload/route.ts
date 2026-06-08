import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = (formData.get('type') as string) || 'document'

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileName = `${Date.now()}-${file.name}`
    const subDir = type === 'photo' ? 'photos' : 'documents'
    const filePath = `/uploads/${subDir}/${fileName}`

    const { writeFileSync } = await import('fs')
    const { join } = await import('path')
    const fullPath = join(process.cwd(), 'public', filePath)
    writeFileSync(fullPath, buffer)

    return NextResponse.json({ path: filePath, name: file.name, size: file.size })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Erreur lors du téléchargement du fichier' }, { status: 500 })
  }
}
