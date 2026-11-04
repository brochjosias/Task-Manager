import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { appRouter } from "@/server/trpc";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const task = await appRouter.createCaller({}).task.byId({ id });
    return <TaskForm task={task} />;
  } catch {
    notFound();
  }
}
