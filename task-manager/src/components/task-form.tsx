"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/server/trpc";
import { trpc } from "@/trpc/client";

export function TaskForm({ task }: { task?: Task }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descricao, setDescricao] = useState(task?.descricao ?? "");
  const [error, setError] = useState("");
  const create = trpc.task.create.useMutation();
  const update = trpc.task.update.useMutation();
  const utils = trpc.useUtils();
  const isPending = create.isPending || update.isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanTitle = titulo.trim();
    if (!cleanTitle) {
      setError("Informe um título para a tarefa.");
      return;
    }
    try {
      if (task)
        await update.mutateAsync({
          id: task.id,
          titulo: cleanTitle,
          descricao: descricao.trim() || undefined,
        });
      else
        await create.mutateAsync({
          titulo: cleanTitle,
          descricao: descricao.trim() || undefined,
        });
      await utils.task.list.invalidate();
      sessionStorage.setItem("task-saved", "1");
      router.push("/");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar a tarefa.",
      );
    }
  }

  return (
    <main className="shell">
      <div className="topline">
        <Link className="brand" href="/">
          ARTEFACT / TASKS
        </Link>
        <span className="badge">Demonstração técnica</span>
      </div>
      <Link href="/" className="back">
        ← Voltar para tarefas
      </Link>
      <h1>{task ? "Editar tarefa" : "Nova tarefa"}</h1>
      <p className="subhead" style={{ marginBottom: 24 }}>
        {task
          ? "Atualize os detalhes abaixo."
          : "Adicione uma tarefa à sua lista."}
      </p>
      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="titulo">
            Título <span aria-hidden="true">*</span>
          </label>
          <input
            id="titulo"
            name="titulo"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            maxLength={120}
            required
            autoFocus
            placeholder="Ex.: Revisar integração de dados"
          />
          <span className="hint">Obrigatório · até 120 caracteres</span>
        </div>
        <div className="field">
          <label htmlFor="descricao">Descrição</label>
          <textarea
            id="descricao"
            name="descricao"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            maxLength={1000}
            placeholder="Inclua contexto ou próximos passos (opcional)"
          />
          <span className="hint">Opcional · até 1.000 caracteres</span>
        </div>
        {error && (
          <p role="alert" className="status error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="primary" type="submit" disabled={isPending}>
            {isPending
              ? "Salvando…"
              : task
                ? "Salvar alterações"
                : "Criar tarefa"}
          </button>
          <Link className="secondary" href="/">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
