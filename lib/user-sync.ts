import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function syncClerkUserToFirestore(user: any) {
    if (!user) return;

    const userRef = doc(db, 'users', user.id);

    await setDoc(userRef, {
        uid: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        fullName: user.fullName || '',
        imageUrl: user.imageUrl || '',
        lastSync: serverTimestamp(),
    }, { merge: true });
}
