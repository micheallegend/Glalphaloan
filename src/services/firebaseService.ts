import { db } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { Client } from '../types';
import { INITIAL_CLIENTS } from '../data/mockData';

const CLIENTS_COLLECTION = 'clients';

export async function fetchInitialClients(): Promise<Client[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CLIENTS_COLLECTION));
    if (querySnapshot.empty) {
      // Seed initial clients to Firestore if empty
      for (const client of INITIAL_CLIENTS) {
        await setDoc(doc(db, CLIENTS_COLLECTION, client.id), client);
      }
      return INITIAL_CLIENTS;
    }
    const clients: Client[] = [];
    querySnapshot.forEach((document) => {
      clients.push(document.data() as Client);
    });
    return clients;
  } catch (error) {
    console.error('Error fetching clients from Firestore:', error);
    return INITIAL_CLIENTS;
  }
}

export async function saveClientToFirestore(client: Client): Promise<void> {
  try {
    await setDoc(doc(db, CLIENTS_COLLECTION, client.id), client);
  } catch (error) {
    console.error('Error saving client to Firestore:', error);
  }
}

export async function deleteClientFromFirestore(clientId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CLIENTS_COLLECTION, clientId));
  } catch (error) {
    console.error('Error deleting client from Firestore:', error);
  }
}
