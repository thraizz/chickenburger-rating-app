import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();

export const deleteUserData = onCall(async (request) => {
  console.log('deleteUserData');
  try {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new Error('User ID is required');
    }

    const batch = db.batch();

    // Delete user's ratings from the top-level ratings collection
    const ratingsSnapshot = await db.collection('ratings')
      .where('userId', '==', uid)
      .get();

    ratingsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Commit all deletions
    await batch.commit();

    return { success: true };
  }
  catch (error) {
    console.error('Error deleting user data:', error);
    throw new Error('Failed to delete user data');
  }
});
