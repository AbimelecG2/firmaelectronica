import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  Query,
  DocumentReference,
  DocumentSnapshot,
  CollectionReference,
  limit,
} from '@angular/fire/firestore';
import { SweetAlert } from './sweet-alert';

export interface CrudOptions {
  where?: any[];
  orderBy?: any[];
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class FirebaseCrudService {
  private firestore = inject(Firestore);
  private swal = inject(SweetAlert);

  /**
   * Crear un nuevo documento en una colección
   * @param collectionName Nombre de la colección
   * @param data Datos del documento
   * @returns Referencia del documento creado
   */
  async create<T>(collectionName: string, data: T): Promise<DocumentReference> {
    try {
      const colRef = collection(this.firestore, collectionName);
      const docRef = await addDoc(colRef, data as any);
      return docRef;
    } catch (error) {
      this.swal.error(`Error al crear documento en ${collectionName}`);
      throw error;
    }
  }

  /**
   * Obtener todos los documentos de una colección
   * @param collectionName Nombre de la colección
   * @param options Opciones de consulta (where, orderBy, limit)
   * @returns Array de documentos
   */
  async getAll<T>(
    collectionName: string,
    options?: CrudOptions
  ): Promise<(T & { id: string })[]> {
    try {
      const colRef = collection(this.firestore, collectionName);
      const queryConstraints: any[] = [];

      if (options?.where) {
        queryConstraints.push(...options.where);
      }

      if (options?.orderBy) {
        queryConstraints.push(...options.orderBy);
      }

      if (options?.limit) {
        queryConstraints.push(limit(options.limit));
      }

      const q: Query = queryConstraints.length > 0 
        ? query(colRef, ...queryConstraints)
        : colRef;

      const snapshot = await getDocs(q);
      const items: (T & { id: string })[] = [];

      snapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data(),
        } as T & { id: string });
      });

      return items;
    } catch (error) {
      this.swal.error(`Error al obtener documentos de ${collectionName}`);
      throw error;
    }
  }

  /**
   * Obtener un documento por ID
   * @param collectionName Nombre de la colección
   * @param docId ID del documento
   * @returns Documento encontrado o null
   */
  async getById<T>(
    collectionName: string,
    docId: string
  ): Promise<(T & { id: string }) | null> {
    try {
      const docRef = doc(this.firestore, collectionName, docId);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data(),
        } as T & { id: string };
      }
      return null;
    } catch (error) {
      this.swal.error(`Error al obtener el documento ${docId} de ${collectionName}`);
      throw error;
    }
  }

  /**
   * Actualizar un documento
   * @param collectionName Nombre de la colección
   * @param docId ID del documento
   * @param data Datos a actualizar
   */
  async update<T>(
    collectionName: string,
    docId: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(this.firestore, collectionName, docId);
      await updateDoc(docRef, data as any);
    } catch (error) {
      this.swal.error(`Error al actualizar el documento ${docId} en ${collectionName}`);
      throw error;
    }
  }

  /**
   * Eliminar un documento
   * @param collectionName Nombre de la colección
   * @param docId ID del documento
   */
  async delete(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      this.swal.error(`Error al eliminar el documento ${docId} de ${collectionName}`);
      throw error;
    }
  }

  /**
   * Eliminar múltiples documentos
   * @param collectionName Nombre de la colección
   * @param docIds Array de IDs de documentos
   */
  async deleteMany(collectionName: string, docIds: string[]): Promise<void> {
    try {
      await Promise.all(
        docIds.map((docId) => this.delete(collectionName, docId))
      );
    } catch (error) {
      this.swal.error(`Error al eliminar múltiples documentos de ${collectionName}`);
      throw error;
    }
  }

  /**
   * Ejecutar una consulta personalizada
   * @param collectionName Nombre de la colección
   * @param constraints Array de restricciones (where, orderBy, limit)
   * @returns Array de documentos
   */
  async query<T>(
    collectionName: string,
    constraints: any[]
  ): Promise<(T & { id: string })[]> {
    try {
      const colRef = collection(this.firestore, collectionName);
      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);
      const items: (T & { id: string })[] = [];

      snapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data(),
        } as T & { id: string });
      });

      return items;
    } catch (error) {
      this.swal.error(`Error al consultar ${collectionName}`);
      throw error;
    }
  }
}
