import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const subfolder = (formData.get('subfolder') as string) || 'documents'

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const ext = path.extname(file.name) || '.bin'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder)
    const filePath = path.join(uploadDir, uniqueName)

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true })

    // Write file
    await writeFile(filePath, buffer)

    const url = `/uploads/${subfolder}/${uniqueName}`

    return NextResponse.json({ url, filename: uniqueName, size: file.size })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Erreur lors du téléchargement du fichier' }, { status: 500 })
  }
}
