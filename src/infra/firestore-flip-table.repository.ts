import 'dotenv/config';
import { IFlipTableRepository } from 'application/ports/flip-table-repository.interface';
import { FlipTableRow } from 'application/use-cases/generate-flip-table.use-case';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      projectId: process.env.FIREBASE_PROJECT_ID,
    }),
  });
}

const db = admin.firestore();

export default class FirestoreFlipTableRepository implements IFlipTableRepository {
  async save(table: FlipTableRow[], league: string): Promise<void> {
    await db.collection('flipTables').doc(league).set({ table });
  }
} 