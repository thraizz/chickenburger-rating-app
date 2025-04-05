import { firebaseApp } from '@/firebase';
import type { UserCredential } from 'firebase/auth';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
];

export const logInWithFirebase: (
  email: string,
  password: string
) => Promise<void | UserCredential> = async (email, password) => {
  const auth = getAuth(firebaseApp);
  try {
    return signInWithEmailAndPassword(auth, email, password);
  }
  catch (error) {
    return Promise.reject(error);
  }
};

export async function signOut() {
  const auth = getAuth(firebaseApp);
  await auth.signOut();
}
