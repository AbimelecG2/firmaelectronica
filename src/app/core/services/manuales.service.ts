import { Injectable, inject } from '@angular/core';
import { Storage, ref, listAll, getDownloadURL } from '@angular/fire/storage';

export interface Manual {
  name: string;  
  path: string;   
  url: string;   
}

@Injectable({ providedIn: 'root' })
export class ManualesService {
  private storage = inject(Storage);

  async list(folder = 'manuales'): Promise<Manual[]> {
    const folderRef = ref(this.storage, folder);
    const res = await listAll(folderRef);

    const items = await Promise.all(
      res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          path: itemRef.fullPath,
          url,
        } as Manual;
      })
    );


    return items.sort((a, b) => a.name.localeCompare(b.name));
  }
}
