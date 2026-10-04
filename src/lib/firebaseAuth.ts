import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import firebaseConfig from './firebaseConfig';

// Inisialisasi Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
// Scopes untuk email & profil pengguna
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.setCustomParameters({
  prompt: 'select_account', // Membuka layar 'Pilih Akun' seperti di screenshot
});

/**
 * Fungsi resmi untuk membuka pop-up Login dengan Akun Google (Google Account Chooser)
 * Membuka jendela accounts.google.com/v3/signin/accountchooser
 */
export const signInWithGooglePopup = async (): Promise<{
  email: string;
  name: string;
  photoURL?: string | null;
  firebaseUser: FirebaseUser;
}> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (!user.email) {
      throw new Error('Gagal mendapatkan email dari akun Google.');
    }
    return {
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL,
      firebaseUser: user,
    };
  } catch (error: any) {
    console.error('Error saat login Google Popup:', error);
    throw error;
  }
};
