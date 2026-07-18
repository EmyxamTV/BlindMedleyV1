import { defineConfig } from "@adonisjs/transmit";

export default defineConfig({
  // Garde l'unique flux SSE ouvert entre deux événements sans créer de
  // requête HTTP supplémentaire côté navigateur.
  pingInterval: "25s",
  transport: null,
});
