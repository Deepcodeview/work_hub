import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const apkPath = path.join(process.cwd(), 'public/downloads/workhub-v1.0.0.apk');
    if (!fs.existsSync(apkPath)) {
      return NextResponse.json({ error: 'APK asset not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(apkPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="workhub-v1.0.0.apk"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Download error' }, { status: 500 });
  }
}
