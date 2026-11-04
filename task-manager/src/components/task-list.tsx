"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/trpc/client";
import type { Task } from "@/server/trpc";

type Page = { items: Task[]; nextCursor?: number; total: number };

export function TaskList({ initialPage }: { initialPage: Page }) {
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const tasks = trpc.task.list.useInfiniteQuery(
    { limit: 8 },
    {
      initialData: { pages: [initialPage], pageParams: [undefined] },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const utils = trpc.useUtils();
  const remove = trpc.task.delete.useMutation({
    onSuccess: async () => {
      setNotice({ kind: "success", text: "Tarefa excluída com sucesso." });
      await utils.task.list.invalidate();
    },
    onError: (error) =>
      setNotice({
        kind: "error",
        text: error.message || "Não foi possível excluir a tarefa.",
      }),
  });

  const pages = tasks.data?.pages ?? [];
  const allTasks = pages.flatMap((page) => page.items);
  const message = tasks.error?.message;

  useEffect(() => {
    if (sessionStorage.getItem("task-saved") === "1") {
      sessionStorage.removeItem("task-saved");
      setNotice({ kind: "success", text: "Tarefa salva com sucesso." });
    }
  }, []);

  // Automatically request the next page when the sentinel near the bottom enters view.
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !tasks.hasNextPage || tasks.isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting))
          void tasks.fetchNextPage();
      },
      { rootMargin: "240px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [tasks.hasNextPage, tasks.isFetchingNextPage, tasks.fetchNextPage]);

  return (
    <main className="shell">
      <div className="topline">
        <Link className="brand" href="/">
          ARTEFACT / TASKS
        </Link>
        <span className="badge">Demonstração técnica</span>
      </div>
      <section className="heading-row">
        <div>
          <h1>Suas tarefas</h1>
          <p className="subhead">
            Organize o trabalho, uma tarefa de cada vez.
          </p>
        </div>
        <Link className="primary" href="/tasks/new">
          ＋ Nova tarefa
        </Link>
      </section>

      {notice && (
        <p role="status" className={`status ${notice.kind}`}>
          {notice.text}
        </p>
      )}
      {message && (
        <p role="alert" className="status error">
          Erro ao carregar tarefas: {message}
        </p>
      )}

      {allTasks.length === 0 && !tasks.isLoading ? (
        <div className="empty">
          <strong>Nenhuma tarefa por aqui</strong>Crie sua primeira tarefa para
          começar.
        </div>
      ) : (
        <section className="list" aria-label="Lista de tarefas">
          {allTasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div>
                <h2 className="task-title">{task.titulo}</h2>
                {task.descricao && (
                  <p className="task-description">{task.descricao}</p>
                )}
                <div className="task-date">
                  Criada em{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(task.dataCriacao)}
                </div>
              </div>
              <div className="task-actions">
                <Link className="secondary" href={`/tasks/${task.id}/edit`}>
                  Editar
                </Link>
                <button
                  className="danger"
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => {
                    setNotice(null);
                    if (window.confirm(`Excluir “${task.titulo}”?`))
                      remove.mutate({ id: task.id });
                  }}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {tasks.hasNextPage && (
        <div className="load-more" ref={loadMoreRef}>
          <button
            className="secondary"
            onClick={() => tasks.fetchNextPage()}
            disabled={tasks.isFetchingNextPage}
          >
            {tasks.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
          </button>
        </div>
      )}
      <p className="footer-note">
        {pages[0]?.total ?? 0} tarefa(s) no total · Os dados ficam em memória
        durante a execução.
      </p>
    </main>
  );
}
