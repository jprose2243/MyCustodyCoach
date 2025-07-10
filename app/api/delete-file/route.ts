import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/src/services/fileUploadService';
import { logError } from '@/src/utils/errorHandler';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get('path');
    const userId = searchParams.get('userId');

    if (!storagePath || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const result = await deleteFile(storagePath, userId);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in delete-file:', error);
    logError(error as Error, { endpoint: '/api/delete-file' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 