import { Injectable, PLATFORM_ID, Optional } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

import { IndexedDBDatabase } from './indexeddb-database';
import { LocalStorageDatabase } from './localstorage-database';
import { MockLocalDatabase } from './mock-local-database';
import { LOCAL_STORAGE_PREFIX } from '../tokens';

export function localDatabaseFactory(platformId: Object, prefix: string | null) {

  try {

    if (isPlatformBrowser(platformId) && ('indexedDB' in window) && (indexedDB !== undefined) && (indexedDB !== null)) {

      // Check user permissions on using indexedDB
      let r = indexedDB.open('testStorage');
      r.onsuccess = () => {
        indexedDB.deleteDatabase('testStorage');
      };
      r.onerror = (e: any) => {
        throw Error(e.target.error.message);
      };

      /* Try with IndexedDB in modern browsers */
      return new IndexedDBDatabase(prefix);

    } else if (isPlatformBrowser(platformId) && ('localStorage' in window) && (localStorage !== undefined) && (localStorage !== null)) {

      /* Try with localStorage in old browsers (IE9) */
      return new LocalStorageDatabase(prefix);

    }

  } catch (error) {}

  /* Fake database for server-side rendering (Universal) */
  return new MockLocalDatabase();

}

@Injectable({
  providedIn: 'root',
  useFactory: localDatabaseFactory,
  deps: [
    PLATFORM_ID,
    [new Optional(), LOCAL_STORAGE_PREFIX]
  ]
})
export abstract class LocalDatabase {

  abstract getItem<T = any>(key: string): Observable<T | null>;
  abstract setItem(key: string, data: any): Observable<boolean>;
  abstract removeItem(key: string): Observable<boolean>;
  abstract clear(): Observable<boolean>;

}
