/** Ruta a un recurso de /public respetando la base configurada en Vite. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
