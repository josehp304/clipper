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

export async function saveProjectToFirestore(project: any) {
    console.log(`[Sync] Saving project ${project.id} to Firestore...`);
    if (!project.userId) {
        console.error("Attempted to save project without userId to Firestore");
        return;
    }

    try {
        const projectRef = doc(db, 'projects', project.id);

        await setDoc(projectRef, {
            ...project,
            lastUpdated: serverTimestamp(),
        }, { merge: true });
        console.log(`[Sync] Successfully saved project ${project.id}`);
    } catch (e) {
        console.error(`[Sync] Failed to save project ${project.id}:`, e);
        throw e;
    }
}
