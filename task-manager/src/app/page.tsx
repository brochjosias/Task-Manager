import { appRouter } from "@/server/trpc";
import { TaskList } from "@/components/task-list";

export const dynamic = "force-dynamic";

// The caller runs on the server during the initial render, so the first page is SSR content.
export default async function HomePage() {
  const initialPage = await appRouter.createCaller({}).task.list({ limit: 8, cursor: 0 });
  return <TaskList initialPage={initialPage} />;
}
