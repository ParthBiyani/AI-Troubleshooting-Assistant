import { join } from "node:path";
import { BGE_QUERY_PREFIX } from "./text";

export interface DenseHit {
  id: string;
  score: number;
}

export const EMBEDDING_MODEL = "Xenova/bge-small-en-v1.5";
export const MODEL_CACHE_DIR = join(process.cwd(), ".model-cache");

type Extractor = (
  texts: string[],
  opts: { pooling: "cls"; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

let extractor: Promise<Extractor> | null = null;

async function getExtractor(): Promise<Extractor> {
  if (!extractor) {
    extractor = import("@huggingface/transformers").then((m) => {
      // The index build downloads the model into this project folder, and the deployment
      // bundles it, so serverless functions never download it or write to a read-only path.
      m.env.cacheDir = MODEL_CACHE_DIR;
      return m.pipeline("feature-extraction", EMBEDDING_MODEL, {
        dtype: "q8",
      }) as unknown as Extractor;
    });
  }
  return extractor;
}

export async function embed(texts: string[]): Promise<number[][]> {
  const run = await getExtractor();
  return (await run(texts, { pooling: "cls", normalize: true })).tolist();
}

export const embedQuery = async (q: string) => (await embed([BGE_QUERY_PREFIX + q]))[0];

/** Vectors are L2-normalised, so cosine similarity is a dot product. */
export function cosineRank(
  query: number[],
  vectors: Record<string, number[]>,
  limit = 10,
): DenseHit[] {
  return Object.entries(vectors)
    .map(([id, v]) => ({ id, score: v.reduce((s, x, i) => s + x * query[i], 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
