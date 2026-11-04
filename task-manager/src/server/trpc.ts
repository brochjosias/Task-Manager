import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: number;
};

// globalThis keeps demo data stable during Next.js development hot reloads.
const globalForTasks = globalThis as typeof globalThis & { taskStore?: Task[] };
const tasks = (globalForTasks.taskStore ??= [
  {
    id: "demo-1",
    titulo: "Conhecer o projeto",
    descricao: "Revise os requisitos e explore a aplicação.",
    dataCriacao: Date.now() - 86_400_000,
  },
  {
    id: "demo-2",
    titulo: "Planejar a próxima entrega",
    descricao: "Quebre o trabalho em etapas menores.",
    dataCriacao: Date.now() - 3_600_000,
  },
]);

const t = initTRPC.create();
const taskInput = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "O título é obrigatório.")
    .max(120, "Use até 120 caracteres."),
  descricao: z
    .string()
    .trim()
    .max(1000, "Use até 1.000 caracteres.")
    .optional()
    .transform((value) => value || undefined),
});

export const appRouter = t.router({
  task: t.router({
    list: t.procedure
      .input(
        z
          .object({
            limit: z.number().int().min(1).max(50).default(8),
            cursor: z.number().int().min(0).default(0),
          })
          .optional(),
      )
      .query(({ input }) => {
        const { limit, cursor } = input ?? { limit: 8, cursor: 0 };
        const sorted = [...tasks].sort((a, b) => b.dataCriacao - a.dataCriacao);
        const page = sorted.slice(cursor, cursor + limit);
        return {
          items: page,
          nextCursor:
            cursor + page.length < sorted.length
              ? cursor + page.length
              : undefined,
          total: sorted.length,
        };
      }),
    byId: t.procedure
      .input(z.object({ id: z.string().min(1) }))
      .query(({ input }) => {
        const task = tasks.find((item) => item.id === input.id);
        if (!task)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tarefa não encontrada.",
          });
        return task;
      }),
    create: t.procedure.input(taskInput).mutation(({ input }) => {
      const task: Task = {
        ...input,
        id: crypto.randomUUID(),
        dataCriacao: Date.now(),
      };
      tasks.push(task);
      return task;
    }),
    update: t.procedure
      .input(taskInput.extend({ id: z.string().min(1) }))
      .mutation(({ input }) => {
        const index = tasks.findIndex((item) => item.id === input.id);
        if (index === -1)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Não foi possível atualizar: tarefa não encontrada.",
          });
        const updated: Task = {
          ...tasks[index],
          titulo: input.titulo,
          descricao: input.descricao,
        };
        tasks[index] = updated;
        return updated;
      }),
    delete: t.procedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(({ input }) => {
        const index = tasks.findIndex((item) => item.id === input.id);
        if (index === -1)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Não foi possível excluir: tarefa não encontrada.",
          });
        tasks.splice(index, 1);
        return { id: input.id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
