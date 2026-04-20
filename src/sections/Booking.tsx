import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLang, content } from '../lib/i18n';
import { ease, dur } from '../lib/motion';
import { useSectionTheme, Label, MagneticButton } from '../components/primitives';

export function Booking() {
  const ref = useSectionTheme<HTMLElement>('paper');
  const { lang } = useLang();
  const headline = content.booking.headline[lang];

  const [form, setForm] = useState({
    name: '',
    email: '',
    project: '',
    service: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const onChange =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      id="booking"
      ref={ref}
      className="relative w-full"
      style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}
    >
      <div className="container-x section-y">
        {/* Header */}
        <div className="grid grid-cols-12 gap-6 mb-14 md:mb-20">
          <div className="col-span-12 md:col-span-3">
            <Label>{content.booking.label[lang]}</Label>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-display-lg" style={{ letterSpacing: '-0.028em' }}>
              {headline.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: '110%' }}
                    whileInView={{ y: '0%' }}
                    viewport={{ once: true, margin: '-12%' }}
                    transition={{ duration: dur.lg, ease: ease.reveal, delay: i * 0.08 }}
                    style={{ willChange: 'transform' }}
                  >
                    {i === 1 ? <em className="italic-emphasis">{line}</em> : line}
                  </motion.span>
                </span>
              ))}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 lg:gap-12">
          {/* Intro / contact column */}
          <div className="col-span-12 lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-8%' }}
              transition={{ duration: 1, ease: ease.outExpo }}
              className="space-y-10"
            >
              <p className="text-body-lg max-w-md" style={{ opacity: 0.88 }}>
                {content.booking.intro[lang]}
              </p>

              <div className="space-y-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ opacity: 0.8 }}>
                    {content.booking.contact.label[lang]}
                  </p>
                  <a
                    href={`mailto:${content.booking.contact.email}`}
                    className="font-display text-2xl md:text-3xl block hover:opacity-70 transition-opacity"
                    style={{ letterSpacing: '-0.018em' }}
                    data-cursor="hover"
                  >
                    {content.booking.contact.email}
                  </a>
                </div>
                <div>
                  <a
                    href={`tel:${content.booking.contact.phone.replace(/\s+/g, '')}`}
                    className="font-display text-2xl md:text-3xl block hover:opacity-70 transition-opacity"
                    style={{ letterSpacing: '-0.018em' }}
                    data-cursor="hover"
                  >
                    {content.booking.contact.phone}
                  </a>
                </div>
              </div>

              <div className="pt-6 border-t border-current/30 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ opacity: 0.82 }}>
                <p>San Pedro Garza García</p>
                <p>Nuevo León · México</p>
              </div>
            </motion.div>
          </div>

          {/* Form column */}
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            {!submitted ? (
              <form onSubmit={onSubmit} className="space-y-2">
                <Field
                  label={content.booking.fields.name[lang]}
                  value={form.name}
                  onChange={onChange('name')}
                  type="text"
                  required
                  name="name"
                />
                <Field
                  label={content.booking.fields.email[lang]}
                  value={form.email}
                  onChange={onChange('email')}
                  type="email"
                  required
                  name="email"
                />
                <Field
                  label={content.booking.fields.project[lang]}
                  value={form.project}
                  onChange={onChange('project')}
                  type="text"
                  name="project"
                />
                <SelectField
                  label={content.booking.fields.service[lang]}
                  value={form.service}
                  onChange={onChange('service')}
                  options={content.booking.serviceOptions[lang]}
                  name="service"
                />
                <Field
                  label={content.booking.fields.message[lang]}
                  value={form.message}
                  onChange={onChange('message')}
                  type="textarea"
                  name="message"
                />

                <div className="pt-12">
                  <MagneticButton variant="outline">
                    {content.booking.submit[lang]}
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
                      <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
                    </svg>
                  </MagneticButton>
                </div>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: ease.outExpo }}
                className="border-t border-current/30 pt-16"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] mb-6" style={{ opacity: 0.8 }}>
                  {lang === 'es' ? 'Recibido' : 'Received'}
                </p>
                <h3 className="font-display text-display-md mb-6" style={{ letterSpacing: '-0.025em' }}>
                  {lang === 'es' ? (
                    <>Gracias, <em className="italic-emphasis">{form.name || 'amig@'}</em>.</>
                  ) : (
                    <>Thank you, <em className="italic-emphasis">{form.name || 'friend'}</em>.</>
                  )}
                </h3>
                <p className="text-body-lg max-w-md" style={{ opacity: 0.88 }}>
                  {lang === 'es'
                    ? 'Te escribimos en menos de 24 horas con disponibilidad y un plan a medida.'
                    : 'We will reply within 24 hours with availability and a tailored plan.'}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type: 'text' | 'email' | 'textarea';
  name: string;
  required?: boolean;
};

function Field(props: FieldProps) {
  const { label, value, onChange, type, name, required } = props;
  const isActive = value.length > 0;
  const id = `field-${name}`;
  return (
    <div className={`field ${isActive ? 'is-active' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          rows={4}
          required={required}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          required={required}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  name,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: readonly string[];
  name: string;
}) {
  const isActive = value.length > 0;
  const id = `field-${name}`;
  return (
    <div className={`field ${isActive ? 'is-active' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <select id={id} name={name} value={value} onChange={onChange}>
        <option value=""></option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
