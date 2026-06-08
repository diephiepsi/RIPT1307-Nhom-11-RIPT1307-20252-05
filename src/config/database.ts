/**
 * Chuỗi kết nối MySQL cho Prisma adapter.
 * Ưu tiên DATABASE_URL; nếu không có thì ghép từ DB_HOST, DB_PORT, ...
 */
export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  const host = process.env.DB_HOST ?? 'localhost';
  const port = process.env.DB_PORT ?? '3306';
  const user = process.env.DB_USERNAME ?? 'root';
  const password = process.env.DB_PASSWORD ?? '';
  const database = process.env.DB_DATABASE ?? 'student_forum';

  const encUser = encodeURIComponent(user);
  const encPass = encodeURIComponent(password);

  return `mysql://${encUser}:${encPass}@${host}:${port}/${database}`;
}
