/**
 * Malonic Records · /blog — journal público.
 * Renderiza las entradas publicadas desde el admin (admin-store). Mientras
 * no exista backend, los posts viven en localStorage del navegador que los
 * publicó; el layout y la ruta ya están listos para la fase API.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ease, dur } from '../lib/motion';
import { Wordmark } from '../components/Nav';
import { getPublishedPosts, findPostBySlug, formatDateLongMX, onStoreChanged, type BlogPost } from '../lib/admin-store';

function BlogChrome({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.dataset.theme = 'dark';
  }, []);
  return (
    <div className="relative min-h-screen w-full" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <div aria-hidden className="absolute inset-0 bg-hairline-grid opacity-30 pointer-events-none" />
      <header className="relative z-10 container-x h-[88px] flex items-center justify-between">
        <a href="/" data-cursor="hover" aria-label="Malonic Records · home">
          <Wordmark size="sm" />
        </a>
        <a href="/#booking" data-cursor="hover" className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70 hover:opacity-100 transition-opacity">
          Reservar →
        </a>
      </header>
      <main className="relative z-10 container-x pb-24">{children}</main>
    </div>
  );
}

function PostCoverFrame({ post, tall }: { post: BlogPost; tall?: boolean }) {
  return (
    <div className={`w-full overflow-hidden rounded-[14px] ${tall ? 'max-h-[460px]' : 'h-[220px]'}`} style={{ background: 'color-mix(in srgb, var(--color-paper) 4%, transparent)' }}>
      {post.cover ? (
        <img src={post.cover} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full ${tall ? 'h-[220px]' : 'h-full'} flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.22em]`} style={{ color: 'var(--color-mist)' }}>
          Malonic · Journal
        </div>
      )}
    </div>
  );
}

export function BlogIndex() {
  const [posts, setPosts] = useState<BlogPost[]>(() => getPublishedPosts());

  useEffect(() => {
    document.title = 'Journal · Malonic Records';
    return onStoreChanged(() => setPosts(getPublishedPosts()));
  }, []);

  return (
    <BlogChrome>
      <div className="pt-10 md:pt-16 mb-12 md:mb-16 max-w-[820px]">
        <span className="label" style={{ color: 'var(--color-cloud)' }}>Journal · Estudio</span>
        <h1 className="font-display text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.95] mt-3" style={{ letterSpacing: '-0.028em' }}>
          Notas desde la <span className="italic-emphasis">sala de control.</span>
        </h1>
      </div>

      {posts.length === 0 ? (
        <div className="max-w-[560px] py-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--color-signal)' }}>Próximamente</p>
          <p className="text-[1.05rem]" style={{ color: 'var(--color-cloud)' }}>
            Estamos preparando historias del estudio: sesiones Atmos, lanzamientos de clientes y el detrás de cámaras de Malonic Records.
          </p>
          <a href="/" data-cursor="hover" className="inline-block mt-8 font-mono text-[10px] uppercase tracking-[0.2em] opacity-70 hover:opacity-100 transition-opacity">
            ← Regresar al sitio
          </a>
        </div>
      ) : (
        <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {posts.map((p, i) => (
            <motion.a
              key={p.id}
              href={`/blog/${p.slug}`}
              data-cursor="hover"
              className="group flex flex-col gap-4"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.md, ease: ease.outExpo, delay: 0.05 + i * 0.06 }}
            >
              <div className="overflow-hidden rounded-[14px]">
                <div className="transition-transform duration-700 group-hover:scale-[1.03]">
                  <PostCoverFrame post={p} />
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--color-mist)' }}>
                  {formatDateLongMX((p.publishedAt ?? p.createdAt).slice(0, 10))}
                  {p.tags.length > 0 && ` · ${p.tags[0]}`}
                </div>
                <h2 className="font-display text-[1.5rem] leading-snug" style={{ letterSpacing: '-0.018em', color: 'var(--color-paper)' }}>
                  {p.title}
                </h2>
                {p.excerpt && (
                  <p className="mt-2 text-[0.9rem] line-clamp-2" style={{ color: 'var(--color-cloud)' }}>{p.excerpt}</p>
                )}
                <span className="inline-block mt-3 font-mono text-[10px] uppercase tracking-[0.18em] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-signal)' }}>
                  Leer →
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </BlogChrome>
  );
}

export function BlogPost({ slug }: { slug: string }) {
  const post = useMemo(() => findPostBySlug(slug), [slug]);

  useEffect(() => {
    document.title = post ? `${post.title} · Malonic Records` : 'Journal · Malonic Records';
  }, [post]);

  if (!post) {
    return (
      <BlogChrome>
        <div className="max-w-[560px] py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--color-mist)' }}>404</p>
          <h1 className="font-display text-[2.2rem] mb-4" style={{ letterSpacing: '-0.024em' }}>
            Esta entrada no <span className="italic-emphasis">existe.</span>
          </h1>
          <a href="/blog" data-cursor="hover" className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70 hover:opacity-100 transition-opacity">
            ← Ver el journal
          </a>
        </div>
      </BlogChrome>
    );
  }

  const paragraphs = post.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <BlogChrome>
      <motion.article
        className="max-w-[760px] mx-auto pt-6 md:pt-12"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur.md, ease: ease.outExpo }}
      >
        <a href="/blog" data-cursor="hover" className="inline-block mb-8 font-mono text-[10px] uppercase tracking-[0.2em] opacity-70 hover:opacity-100 transition-opacity">
          ← Journal
        </a>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-4" style={{ color: 'var(--color-mist)' }}>
          {formatDateLongMX((post.publishedAt ?? post.createdAt).slice(0, 10))}
          {post.tags.length > 0 && (
            <>
              {' · '}
              <span style={{ color: 'var(--color-signal)' }}>{post.tags.join(' · ')}</span>
            </>
          )}
        </div>
        <h1 className="font-display text-[clamp(2rem,5vw,3.4rem)] leading-[1.02] mb-8" style={{ letterSpacing: '-0.026em' }}>
          {post.title}
        </h1>
        {post.cover && (
          <div className="mb-10">
            <PostCoverFrame post={post} tall />
          </div>
        )}
        <div className="space-y-6">
          {post.excerpt && (
            <p className="text-[1.15rem] leading-relaxed" style={{ color: 'var(--color-pearl)' }}>{post.excerpt}</p>
          )}
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[1rem] leading-[1.85]" style={{ color: 'var(--color-cloud)' }}>{p}</p>
          ))}
        </div>
        <div className="mt-14 pt-8 flex items-center justify-between" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-paper) 8%, transparent)' }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>Malonic Records · MTY</span>
          <a href="/#booking" data-cursor="hover" className="font-mono text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-80" style={{ color: 'var(--color-signal)' }}>
            Reservar sesión →
          </a>
        </div>
      </motion.article>
    </BlogChrome>
  );
}
