import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // ✅ Confirm this matches your path
import { prisma } from '@/lib/prisma';
import { parseFileContent } from '@/lib/parsers';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimetype = file.type || 'application/octet-stream';

    const parsedText = await parseFileContent(buffer, mimetype);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.uploadedFile.create({
      data: {
        userId: user.id,
        filename: file.name,
        mimetype,
        content: parsedText,
      },
    });

    console.log(`✅ Uploaded file saved: ${file.name}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('🔥 Upload error:', err.message);
    return NextResponse.json({ error: 'Failed to process upload.' }, { status: 500 });
  }
}