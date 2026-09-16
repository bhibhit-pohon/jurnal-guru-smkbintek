import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';

// Pastikan inisialisasi Firebase Admin hanya terjadi sekali
if (!admin.apps.length) {
  try {
    // Membaca file kredensial Service Account.
    // File ini HARUS diletakkan di root project dengan nama 'serviceAccountKey.json'
    // atau path nya diset via environment variable FIREBASE_SERVICE_ACCOUNT_PATH
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error: Pastikan serviceAccountKey.json tersedia.', error);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

export async function GET(request: Request) {
  // Simple authentication for the cron job using a query parameter
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const cronToken = process.env.CRON_SECRET || 'backup-rahasia-123';

  if (token !== cronToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ error: 'Firebase Admin belum terinisialisasi. Pastikan serviceAccountKey.json ada di folder app-next.' }, { status: 500 });
  }

  try {
    // 1. Fetch semua data dari koleksi 'journals'
    const snapshot = await db.collection('journals').orderBy('createdAt', 'asc').get();
    
    if (snapshot.empty) {
      return NextResponse.json({ message: 'Tidak ada data jurnal untuk di-backup.' });
    }

    const journals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. Simpan ke dalam file backup lokal
    const backupDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-journals-${timestamp}.json`;
    const filePath = path.join(backupDir, filename);

    await fs.writeFile(filePath, JSON.stringify(journals, null, 2), 'utf-8');
    
    // 3. Logika Cleanup (Menghapus data yang lebih tua jika total data > 3000)
    const MAX_JOURNALS = 3000;
    let deletedCount = 0;

    if (journals.length > MAX_JOURNALS) {
      const deleteCount = journals.length - MAX_JOURNALS;
      // Kita menghapus yang paling lama (paling awal di list karena order by asc)
      const docsToDelete = journals.slice(0, deleteCount);

      const batch = db.batch();
      docsToDelete.forEach(docData => {
        const docRef = db.collection('journals').doc(docData.id);
        batch.delete(docRef);
      });

      await batch.commit();
      deletedCount = docsToDelete.length;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Backup berhasil dilakukan.',
      backupFile: filename,
      totalDataBackedUp: journals.length,
      totalDataDeleted: deletedCount
    });

  } catch (error: any) {
    console.error('Backup Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
