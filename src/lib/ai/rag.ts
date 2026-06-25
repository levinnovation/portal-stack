/** ponytail: RAG stub — enable when pgvector + document embeddings ship (FEATURE_RAG). */
export async function searchDocuments(_query: string): Promise<{ id: string; excerpt: string }[]> {
  if (process.env.FEATURE_RAG !== "true") return [];
  return [];
}
