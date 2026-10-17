// Pour brancher les vrais modèles : remplacer simulatedGen par un client qui appelle /api/generations.
import { simulatedGen } from "./provider";
export const gen = simulatedGen;
export const GEN_IS_SIMULATED = true;
