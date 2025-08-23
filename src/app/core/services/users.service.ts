import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc, docData } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Auth, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs/internal/Observable';
import { of, switchMap } from 'rxjs';

export type Role = 'admin' | 'lector';

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  email: string;
  role: Role;
  photoURL?: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private db = inject(Firestore);
  private storage = inject(Storage);
  private auth = inject(Auth);

  private usersCol = collection(this.db, 'users');

  async getMyProfile(): Promise<UserProfile | null> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return null;
    const dref = doc(this.db, 'users', uid);
    const snap = await getDoc(dref);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    const dref = doc(this.db, 'users', uid);
    const snap = await getDoc(dref);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  async upsertProfile(data: Partial<UserProfile> & { uid: string }) {
    const dref = doc(this.db, 'users', data.uid);
    const current = await getDoc(dref);
    if (current.exists()) {
      await updateDoc(dref, { ...data });
    } else {
      await setDoc(dref, {
        firstName: '',
        lastName: '',
        email: '',
        role: 'lector',
        active: true,
        ...data,
      } as UserProfile);
    }
  }

  async uploadAvatar(file: Blob | File, uid: string): Promise<string> {
    const fileRef = ref(this.storage, `avatars/${uid}/avatar.jpg`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await updateDoc(doc(this.db, 'users', uid), { photoURL: url });
    return url;
  }

  observeMyProfile(): Observable<UserProfile | null> {
  const user$ = authState(this.auth);
  return user$.pipe(
    switchMap(u => {
      if (!u) return of(null);
      const ref = doc(this.db, 'users', u.uid);
      return docData(ref) as Observable<UserProfile>;
    })
  );
}

  async listAll(): Promise<UserProfile[]> {
    const snap = await getDocs(this.usersCol);
    const arr: UserProfile[] = [];
    snap.forEach(d => arr.push(d.data() as UserProfile));
    return arr;
  }

  async updateUser(uid: string, patch: Partial<UserProfile>) {
    await updateDoc(doc(this.db, 'users', uid), patch);
  }

  // "Eliminar" = desactivar (no borra en Auth, pero bloquea acceso a la app)
  async deactivateUser(uid: string) {
    await updateDoc(doc(this.db, 'users', uid), { active: false });
  }

  async deleteUserDocument(uid: string) {
    await deleteDoc(doc(this.db, 'users', uid));
  }
}
