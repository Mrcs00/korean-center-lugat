// Supabase returns at most 1000 rows per request. A student with a lot of
// progress (or the teacher panel reading every student at once) silently got
// only the first 1000 rows, so numbers were wrong and, worse, an unloaded word
// could later be overwritten with a blank record. This reads every page.

const PAGE_SIZE = 1000;

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

export async function fetchAllRows<T = Record<string, unknown>>(
  buildPage: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildPage(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}
