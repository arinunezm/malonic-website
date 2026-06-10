/**
 * Blog — escribir, subir portada, publicar. Lo publicado aparece en
 * malonicrecords /blog (lectura local hasta la fase backend).
 */

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ease, dur } from '../../lib/motion';
import { useAdmin } from './AdminContext';
import {
  CARD_STYLE,
  ConfirmDialog,
  EmptyState,
  Field,
  GhostButton,
  HAIRLINE,
  PostPill,
  SignalButton,
  fieldInputStyle,
  IconCheck,
  IconEye,
  IconImage,
  IconPen,
  IconPlus,
  IconTrash,
  IconArrowLeft,
} from './AdminUI';
import { formatDateLongMX, relativeTime, resizeImageToDataURL, slugify, type BlogPost } from '../../lib/admin-store';

type EditorDraft = {
  id?: string;
  title: string;
  excerpt: string;
  body: string;
  cover?: string;
  tags: string;
  slug: string;
};

const emptyDraft: EditorDraft = { title: '', excerpt: '', body: '', tags: '', slug: '' };

export function BlogPage() {
  const { store, savePost, setPostStatus, deletePost, notify } = useAdmin();
  const [editor, setEditor] = useState<EditorDraft | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (editor) {
    return (
      <PostEditor
        draft={editor}
        onBack={() => setEditor(null)}
        onSave={(d, publish) => {
          const slug = d.slug.trim() ? slugify(d.slug) : slugify(d.title);
          const taken = store.posts.some((p) => p.slug === slug && p.id !== d.id);
          const finalSlug = taken ? `${slug}-${Math.random().toString(36).slice(2, 5)}` : slug;
          const saved = savePost({
            id: d.id,
            title: d.title,
            excerpt: d.excerpt,
            body: d.body,
            cover: d.cover ?? '',
            tags: d.tags.split(',').map((t) => t.trim()).filter(Boolean),
            slug: finalSlug,
          });
          if (publish) setPostStatus(saved.id, 'published');
          setEditor(null);
        }}
        notify={notify}
      />
    );
  }

  const posts = [...store.posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>
          {posts.filter((p) => p.status === 'published').length} publicadas · {posts.filter((p) => p.status === 'draft').length} borradores
        </span>
        <div className="flex items-center gap-3">
          <a href="/blog" target="_blank" rel="noreferrer" data-cursor="hover" className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-70 hover:opacity-100 transition-opacity inline-flex items-center gap-1.5" style={{ color: 'var(--color-paper)' }}>
            <IconEye width={12} height={12} /> Ver blog público ↗
          </a>
          <SignalButton small onClick={() => setEditor(emptyDraft)}>
            <IconPlus width={12} height={12} /> Nueva entrada
          </SignalButton>
        </div>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          Icon={IconPen}
          title="Lanza el journal de Malonic"
          body="Escribe la primera entrada: sesiones destacadas, lanzamientos de clientes, detrás de cámaras del estudio. Con portada y al publicar queda visible en malonicrecords /blog."
          action={
            <SignalButton onClick={() => setEditor(emptyDraft)}>
              <IconPen width={13} height={13} /> Escribir primera entrada
            </SignalButton>
          }
        />
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onEdit={() =>
                setEditor({ id: p.id, title: p.title, excerpt: p.excerpt, body: p.body, cover: p.cover, tags: p.tags.join(', '), slug: p.slug })
              }
              onToggle={() => setPostStatus(p.id, p.status === 'published' ? 'draft' : 'published')}
              onDelete={() => setConfirmId(p.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && deletePost(confirmId)}
        title="Eliminar entrada"
        body="Se quitará también del blog público. Esta acción no se puede deshacer."
      />
    </motion.section>
  );
}

function PostCard({ post, onEdit, onToggle, onDelete }: { post: BlogPost; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  return (
    <motion.article whileHover={{ y: -2 }} className="rounded-[14px] overflow-hidden flex flex-col" style={CARD_STYLE}>
      <button type="button" onClick={onEdit} data-cursor="hover" className="text-left">
        <div className="h-[150px] w-full overflow-hidden" style={{ background: 'color-mix(in srgb, var(--color-paper) 4%, transparent)' }}>
          {post.cover ? (
            <img src={post.cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--color-mist)' }}>
              <IconImage width={22} height={22} />
            </div>
          )}
        </div>
      </button>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between gap-3">
          <PostPill status={post.status} />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-mist)' }}>{relativeTime(post.updatedAt)}</span>
        </div>
        <button type="button" onClick={onEdit} data-cursor="hover" className="text-left">
          <h4 className="font-display text-[1.15rem] leading-snug" style={{ color: 'var(--color-paper)', letterSpacing: '-0.014em' }}>{post.title}</h4>
        </button>
        {post.excerpt && <p className="text-[0.82rem] line-clamp-2" style={{ color: 'var(--color-cloud)' }}>{post.excerpt}</p>}
        <div className="flex items-center gap-2 mt-auto pt-3" style={{ borderTop: HAIRLINE }}>
          <GhostButton small onClick={onEdit}><IconPen width={11} height={11} /> Editar</GhostButton>
          {post.status === 'published' ? (
            <>
              <a
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noreferrer"
                data-cursor="hover"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.16em] transition-opacity hover:opacity-75"
                style={{ border: '1px solid color-mix(in srgb, var(--color-paper) 14%, transparent)', color: 'var(--color-paper)' }}
              >
                <IconEye width={11} height={11} /> Ver
              </a>
              <GhostButton small onClick={onToggle}>Despublicar</GhostButton>
            </>
          ) : (
            <SignalButton small onClick={onToggle}>Publicar</SignalButton>
          )}
          <button type="button" onClick={onDelete} title="Eliminar" aria-label={`Eliminar ${post.title}`} data-cursor="hover" className="ml-auto w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/[0.06]" style={{ color: 'var(--color-cloud)' }}>
            <IconTrash width={13} height={13} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Editor
 * ───────────────────────────────────────────────────────────────────────── */

function PostEditor({
  draft,
  onBack,
  onSave,
  notify,
}: {
  draft: EditorDraft;
  onBack: () => void;
  onSave: (d: EditorDraft, publish: boolean) => void;
  notify: (m: string) => void;
}) {
  const [form, setForm] = useState<EditorDraft>(draft);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const valid = form.title.trim().length > 2 && form.body.trim().length > 10;

  const pickCover = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImageToDataURL(file);
      setForm((f) => ({ ...f, cover: dataUrl }));
    } catch {
      notify('No se pudo procesar la imagen');
    } finally {
      setUploading(false);
    }
  };

  const slugPreview = form.slug.trim() ? slugify(form.slug) : slugify(form.title || 'titulo');

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <button type="button" onClick={onBack} data-cursor="hover" className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] uppercase tracking-[0.18em] opacity-70 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-paper)' }}>
        <IconArrowLeft width={13} height={13} /> Volver al listado
      </button>

      <div className="grid gap-6 [grid-template-columns:1fr] lg:[grid-template-columns:1fr_320px]">
        {/* Main column */}
        <div className="rounded-[14px] p-6 flex flex-col gap-5" style={CARD_STYLE}>
          <Field label="Título *" htmlFor="po-title" active={form.title.length > 0}>
            <input
              id="po-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              autoComplete="off"
              style={{ ...fieldInputStyle, fontSize: '1.25rem', fontFamily: 'var(--font-display, inherit)' }}
            />
          </Field>
          <Field label="Resumen (aparece en el listado)" htmlFor="po-excerpt" active={form.excerpt.length > 0}>
            <textarea id="po-excerpt" rows={2} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} style={fieldInputStyle} />
          </Field>
          <Field label="Contenido *" htmlFor="po-body" active={form.body.length > 0} hint="Separa párrafos con una línea en blanco">
            <textarea id="po-body" rows={14} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} style={{ ...fieldInputStyle, lineHeight: 1.7 }} />
          </Field>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[14px] p-5 flex flex-col gap-4" style={CARD_STYLE}>
            <span className="label" style={{ color: 'var(--color-cloud)' }}>Portada</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              data-cursor="hover"
              className="relative h-[160px] rounded-[10px] overflow-hidden flex items-center justify-center transition-opacity hover:opacity-90"
              style={{ background: 'color-mix(in srgb, var(--color-paper) 4%, transparent)', border: '1px dashed color-mix(in srgb, var(--color-paper) 16%, transparent)' }}
            >
              {form.cover ? (
                <img src={form.cover} alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2" style={{ color: 'var(--color-mist)' }}>
                  <IconImage width={20} height={20} />
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em]">{uploading ? 'Procesando…' : 'Subir foto'}</span>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickCover(e.target.files?.[0])} />
            {form.cover && (
              <GhostButton small onClick={() => setForm((f) => ({ ...f, cover: undefined }))}>
                <IconTrash width={11} height={11} /> Quitar portada
              </GhostButton>
            )}
          </div>

          <div className="rounded-[14px] p-5 flex flex-col gap-4" style={CARD_STYLE}>
            <Field label="Tags (separados por coma)" htmlFor="po-tags" active={form.tags.length > 0}>
              <input id="po-tags" type="text" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} autoComplete="off" style={fieldInputStyle} />
            </Field>
            <Field label="URL (slug)" htmlFor="po-slug" active hint={`malonicrecords.com/blog/${slugPreview}`}>
              <input id="po-slug" type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} autoComplete="off" placeholder={slugPreview} style={fieldInputStyle} />
            </Field>
          </div>

          <div className="flex flex-col gap-2.5">
            <SignalButton disabled={!valid} onClick={() => onSave(form, true)}>
              <IconCheck width={13} height={13} strokeWidth={2} /> {form.id ? 'Guardar y publicar' : 'Publicar ahora'}
            </SignalButton>
            <GhostButton disabled={!valid} onClick={() => onSave(form, false)}>Guardar como borrador</GhostButton>
            {!valid && (
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-center" style={{ color: 'var(--color-mist)' }}>
                Título + contenido para poder guardar
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export { formatDateLongMX };
