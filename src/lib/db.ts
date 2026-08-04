import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, HistoryItem, PaymentRequest } from '../types';

export async function saveUserProfileToFirestore(user: UserProfile) {
  if (!user || !user.id) return;
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), {
      ...user,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore write user error:', err, path);
  }
}

export async function fetchUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Firestore fetch user error:', err, path);
    return null;
  }
}

export async function saveHistoryItemToFirestore(userId: string, item: HistoryItem) {
  if (!userId || !item || !item.id) return;
  const path = `users/${userId}/history/${item.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'history', item.id), {
      ...item,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore save history error:', err, path);
  }
}

export async function deleteHistoryItemFromFirestore(userId: string, historyId: string) {
  if (!userId || !historyId) return;
  const path = `users/${userId}/history/${historyId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'history', historyId));
  } catch (err) {
    console.warn('Firestore delete history error:', err, path);
  }
}

export async function fetchUserHistoryFromFirestore(userId: string): Promise<HistoryItem[]> {
  if (!userId) return [];
  const path = `users/${userId}/history`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'history'));
    const items: HistoryItem[] = [];
    snap.forEach((d) => {
      items.push(d.data() as HistoryItem);
    });
    return items;
  } catch (err) {
    console.warn('Firestore fetch history error:', err, path);
    return [];
  }
}

export async function createPaymentRequestInFirestore(req: PaymentRequest) {
  if (!req || !req.id) return;
  try {
    await setDoc(doc(db, 'paymentRequests', req.id), req);
  } catch (err) {
    console.warn('Firestore create payment request error:', err);
  }
}

export async function fetchAllPaymentRequestsFromFirestore(): Promise<PaymentRequest[]> {
  try {
    const snap = await getDocs(collection(db, 'paymentRequests'));
    const requests: PaymentRequest[] = [];
    snap.forEach((d) => {
      requests.push(d.data() as PaymentRequest);
    });
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('Firestore fetch all payment requests error:', err);
    return [];
  }
}

export async function updatePaymentRequestStatusInFirestore(requestId: string, status: 'approved' | 'rejected') {
  if (!requestId) return;
  try {
    await updateDoc(doc(db, 'paymentRequests', requestId), { status });
  } catch (err) {
    console.warn('Firestore update payment request error:', err);
  }
}
