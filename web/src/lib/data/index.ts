// Point d'entrée unique de la couche de données. Pour brancher Supabase : remplacer fakeData ici.
import { fakeData } from "./fake";
import type { DataLayer } from "./layer";

export const data: DataLayer = fakeData;
export * from "./types";
