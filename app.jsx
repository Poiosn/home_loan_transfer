// Home Loan landing template + Apply modal
const { useState, useEffect, useRef } = React;

// ───────── Icons (small, original) ─────────
const Ico = {
  Close: ({ s = 22, c = '#111' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  More: ({ s = 22, c = '#111' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="1.6" fill={c}/>
      <circle cx="12" cy="12" r="1.6" fill={c}/>
      <circle cx="12" cy="19" r="1.6" fill={c}/>
    </svg>
  ),
  Clock: ({ s = 22, c = '#fff' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6"/>
      <path d="M12 7v5l3.2 2" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Rupee: ({ s = 22, c = '#fff' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M7 5h10M7 9h10M9 5c3 0 5 1.5 5 4s-2 4-5 4H7l8 6" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Doc: ({ s = 22, c = '#fff' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M7 3h7l5 5v13H7V3z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M14 3v5h5" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M10 13h6M10 17h4" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Check: ({ s = 16, c = '#fff' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ArrowRight: ({ s = 18, c = '#fff' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Sparkle: ({ s = 14, c = '#D4A574' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3z" fill={c}/>
    </svg>
  ),
};

// ───────── Tweak defaults ─────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "brand": "SNC Finance",
  "tagline": "Loan Advisors",
  "product": "Home Loan",
  "headline": "Lowest rates, fastest approvals.",
  "rateText": "Starting from 7.75% p.a.",
  "primaryColor": "#1F5C3F",
  "accentColor": "#D4A574",
  "imageStyle": "warm",
  "ctaLabel": "Apply now",
  "showPartners": true
}/*EDITMODE-END*/;

// ───────── Hero image ─────────
function HeroImage() {
  return (
    <div style={{
      position: 'relative', width: '100%',
      aspectRatio: '800 / 720',
      overflow: 'hidden',
      background: 'transparent',
    }}>
      <img
        src="assets/hero-family.png"
        alt="Family with home"
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 35%',
          display: 'block',
        }}
      />
    </div>
  );
}

// ───────── Feature pill ─────────
function Feature({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        border: '1px solid rgba(255,255,255,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{
        fontFamily: 'Inter, system-ui', fontSize: 11, lineHeight: 1.3,
        color: 'rgba(255,255,255,0.95)', fontWeight: 500, whiteSpace: 'pre-line',
      }}>{label}</div>
    </div>
  );
}

// ───────── Partner chip (placeholder, generic) ─────────
function PartnerChip({ name, accent }) {
  return (
    <div style={{
      flexShrink: 0,
      height: 30, padding: '0 12px', borderRadius: 5,
      background: '#fff',
      border: '1px solid #E5E5E5',
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: 'Inter, system-ui', fontSize: 11, fontWeight: 700,
      color: '#1a1a1a', letterSpacing: 0.2,
    }}>
      <span style={{ width: 5, height: 12, background: accent, borderRadius: 1 }} />
      {name}
    </div>
  );
}

// ───────── Custom checkbox ─────────
function CheckBox({ checked, onChange, color }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 22, height: 22, borderRadius: 5,
        background: checked ? color : '#fff',
        border: checked ? `1.5px solid ${color}` : '1.5px solid #C8C8C8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, padding: 0,
        transition: 'all 0.15s ease',
      }}
      aria-checked={checked}
    >
      {checked && <Ico.Check s={14} c="#fff" />}
    </button>
  );
}

// ───────── Apply modal (sheet) ─────────
function ApplySheet({ open, onClose, onSubmit, color, accentColor, brand }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setName(''); setMobile(''); setEmail('');
      setTouched({}); setSubmitting(false); setSuccess(false);
    }
  }, [open]);

  const nameValid = name.trim().length >= 2;
  const mobileValid = /^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ''));
  const emailValid = email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const formValid = nameValid && mobileValid && emailValid;

  const submit = () => {
    setTouched({ name: true, mobile: true, email: true });
    if (!formValid) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => { onSubmit && onSubmit({ name, mobile, email }); onClose(); }, 1400);
    }, 700);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      pointerEvents: open ? 'auto' : 'none',
    }}>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,28,22,0.55)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />
      {/* sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: '#FAFAF7',
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '10px 22px 28px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
        transform: open ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        maxHeight: '92%', overflow: 'auto',
      }}>
        {/* grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 6, paddingBottom: 14 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#D4D4D0' }} />
        </div>

        {success ? (
          <SuccessState color={color} name={name} onDone={onClose} />
        ) : (
          <>
            {/* header */}
            <div style={{ marginBottom: 22 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'Inter, system-ui', fontSize: 11, fontWeight: 600,
                color: color, letterSpacing: 0.6, textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                <Ico.Sparkle s={12} c={accentColor} />
                Quick application
              </div>
              <h2 style={{
                fontFamily: 'Fraunces, "Times New Roman", serif',
                fontSize: 26, lineHeight: 1.15, fontWeight: 500,
                color: '#1A2E24', margin: 0, letterSpacing: -0.4,
              }}>
                Let's get you<br/>the lowest rate.
              </h2>
              <div style={{
                fontFamily: 'Inter, system-ui', fontSize: 13.5,
                color: '#5C6B63', marginTop: 8, lineHeight: 1.45,
              }}>
                A {brand} advisor will call within 24 hours. No paperwork to start.
              </div>
            </div>

            {/* fields */}
            <Field
              label="Full name"
              required
              value={name}
              onChange={setName}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              error={touched.name && !nameValid ? 'Please enter your name' : ''}
              placeholder="Enter your full name"
              color={color}
              autoFocus
            />
            <Field
              label="Mobile number"
              required
              prefix="+91"
              value={mobile}
              onChange={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
              onBlur={() => setTouched(t => ({ ...t, mobile: true }))}
              error={touched.mobile && !mobileValid ? 'Enter a valid 10-digit mobile' : ''}
              placeholder="98765 43210"
              type="tel"
              color={color}
            />
            <Field
              label="Email"
              optional
              value={email}
              onChange={setEmail}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              error={touched.email && !emailValid ? 'Enter a valid email' : ''}
              placeholder="you@email.com (optional)"
              type="email"
              color={color}
            />

            {/* submit */}
            <button
              onClick={submit}
              disabled={submitting}
              style={{
                width: '100%', height: 56, borderRadius: 10,
                background: formValid ? color : '#9DAFA5',
                color: '#fff', border: 'none',
                fontFamily: 'Inter, system-ui', fontSize: 16, fontWeight: 600,
                letterSpacing: 0.2,
                marginTop: 10, cursor: submitting ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s ease',
                opacity: submitting ? 0.85 : 1,
              }}
            >
              {submitting ? (
                <Spinner />
              ) : (
                <>Continue <Ico.ArrowRight s={18} c="#fff"/></>
              )}
            </button>

            <div style={{
              marginTop: 14, fontFamily: 'Inter, system-ui',
              fontSize: 11.5, color: '#7A8880', textAlign: 'center', lineHeight: 1.5,
            }}>
              By continuing, you agree to our <u>Terms</u> and <u>Privacy Policy</u>.<br/>
              Your data is encrypted end-to-end.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, optional, prefix, value, onChange, onBlur, error, placeholder, type = 'text', color, autoFocus }) {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (autoFocus && ref.current) setTimeout(() => ref.current.focus(), 350); }, [autoFocus]);

  const showError = !!error;
  const borderColor = showError ? '#C5453B' : focused ? color : '#D8D8D2';

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 6,
      }}>
        <label style={{
          fontFamily: 'Inter, system-ui', fontSize: 12.5, fontWeight: 600,
          color: '#3A4842', letterSpacing: 0.1,
        }}>
          {label}
          {required && <span style={{ color: '#C5453B', marginLeft: 3 }}>*</span>}
        </label>
        {optional && (
          <span style={{
            fontFamily: 'Inter, system-ui', fontSize: 11, color: '#9AA8A0',
            fontStyle: 'italic',
          }}>optional</span>
        )}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 50, borderRadius: 10,
        background: '#fff',
        border: `1.5px solid ${borderColor}`,
        transition: 'border-color 0.15s ease',
        padding: '0 14px',
      }}>
        {prefix && (
          <span style={{
            fontFamily: 'Inter, system-ui', fontSize: 15, color: '#3A4842',
            fontWeight: 500, paddingRight: 10, marginRight: 10,
            borderRight: '1px solid #E2E2DD',
          }}>{prefix}</span>
        )}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur && onBlur(); }}
          placeholder={placeholder}
          inputMode={type === 'tel' ? 'numeric' : undefined}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'Inter, system-ui', fontSize: 15, color: '#1A2E24',
            fontWeight: 500,
          }}
        />
      </div>
      {showError && (
        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 11.5, color: '#C5453B',
          marginTop: 5, paddingLeft: 2,
        }}>{error}</div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%',
      border: '2.5px solid rgba(255,255,255,0.35)',
      borderTopColor: '#fff',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

function SuccessState({ color, name, onDone }) {
  return (
    <div style={{ padding: '20px 4px 8px', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: color, margin: '0 auto 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pop 0.4s cubic-bezier(0.32, 0.72, 0, 1.4)',
      }}>
        <Ico.Check s={36} c="#fff" />
      </div>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 500,
        color: '#1A2E24', margin: 0, letterSpacing: -0.3,
      }}>
        Thanks{name ? `, ${name.split(' ')[0]}` : ''}.
      </h2>
      <div style={{
        fontFamily: 'Inter, system-ui', fontSize: 14, color: '#5C6B63',
        marginTop: 8, lineHeight: 1.5,
      }}>
        We'll call you within 24 hours.<br/>
        Reference: <b style={{ color: '#1A2E24' }}>HM{Math.floor(Math.random()*900000+100000)}</b>
      </div>
    </div>
  );
}

// ───────── Main page ─────────
function HomeLoanPage() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreeWA, setAgreeWA] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  const color = tweaks.primaryColor;
  const accent = tweaks.accentColor;

  // gentle CTA pulse to draw attention
  useEffect(() => {
    const t = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 800); }, 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', overflowY: 'auto', position: 'relative' }}>
      {/* Top chrome (close + more) */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px 10px',
      }}>
        <button style={btnReset}><Ico.Close /></button>
        <button style={btnReset}><Ico.More /></button>
      </div>

      {/* HERO */}
      <div style={{
        margin: '0 14px',
        background: `linear-gradient(165deg, ${color} 0%, ${shade(color, -0.15)} 100%)`,
        borderRadius: 18,
        padding: '22px 22px 18px',
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 12px 30px ${color}25`,
      }}>
        {/* subtle texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'radial-gradient(circle at 20% 10%, #fff 0%, transparent 40%)',
          pointerEvents: 'none',
        }} />

        {/* Brand mark */}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 600,
            color: accent, letterSpacing: -1, lineHeight: 1, fontStyle: 'italic',
          }}>{tweaks.brand}</div>
          <div style={{
            fontFamily: 'Inter, system-ui', fontSize: 10, fontWeight: 400,
            color: 'rgba(255,255,255,0.78)', letterSpacing: 0.6,
            textTransform: 'uppercase', marginTop: 2,
          }}>{tweaks.tagline}</div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'Fraunces, serif', fontWeight: 700,
          fontSize: 22, lineHeight: 1.2, color: '#fff',
          margin: '14px 0 8px', letterSpacing: -0.4, whiteSpace: 'pre-line',
          textAlign: 'center',
        }}>{tweaks.headline}</h1>

        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 16, fontWeight: 700,
          color: accent, marginBottom: 16, textAlign: 'center',
          animation: 'rateZoom 2.4s ease-in-out infinite',
          transformOrigin: 'center',
        }}>{tweaks.rateText}</div>

        {/* Features */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <Feature icon={<Ico.Clock s={16} c="#fff"/>} label={'Approval\nin 24 hours*'} />
          <Feature icon={<Ico.Rupee s={16} c="#fff"/>} label={'Repayment\nup to 30 years'} />
          <Feature icon={<Ico.Doc   s={16} c="#fff"/>} label={'₹0 Prepayment\ncharges'} />
        </div>

        {/* Hero image — no border, blends with background */}
        <div>
          <HeroImage />
        </div>
      </div>

      {/* Partners */}
      {tweaks.showPartners && (
        <div style={{
          margin: '22px 14px 0',
          background: '#F4F5F1',
          borderRadius: 10,
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 12,
          overflow: 'hidden',
        }}>
          <span style={{
            fontFamily: 'Inter, system-ui', fontSize: 11.5, color: '#6A766F',
            flexShrink: 0, fontWeight: 500,
          }}>Our partners</span>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1 }}>
            <PartnerChip name="Apex Shelter" accent="#C5453B" />
            <PartnerChip name="MERIDIAN" accent="#E8A04A" />
            <PartnerChip name="NorthCap" accent="#1B4D7A" />
            <PartnerChip name="ORBIT" accent="#1B4D7A" />
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: '20px 18px 12px' }}>
        <button
          onClick={() => setSheetOpen(true)}
          style={{
            width: '100%', height: 56, borderRadius: 10,
            background: color, color: '#fff', border: 'none',
            fontFamily: 'Inter, system-ui', fontSize: 16, fontWeight: 600,
            letterSpacing: 0.3, cursor: 'pointer',
            boxShadow: pulse
              ? `0 0 0 6px ${color}1a, 0 8px 22px ${color}55`
              : `0 6px 18px ${color}40`,
            transition: 'box-shadow 0.6s ease, transform 0.1s ease',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {tweaks.ctaLabel}
        </button>
      </div>

      {/* Consent */}
      <div style={{ padding: '4px 18px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ConsentRow
          checked={agreeTerms}
          onChange={setAgreeTerms}
          color={color}
          text={<>By proceeding, you agree with our <u style={{textDecorationThickness:'1.5px'}}><b>Terms of Service</b></u> & <u style={{textDecorationThickness:'1.5px'}}><b>Privacy Policy</b></u></>}
        />
        <ConsentRow
          checked={agreeWA}
          onChange={setAgreeWA}
          color={color}
          text={<>I agree to receive updates on WhatsApp</>}
        />
      </div>

      <ApplySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={(data) => console.log('Lead captured:', data)}
        color={color}
        accentColor={accent}
        brand={tweaks.brand}
      />

      {/* Tweaks panel */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection title="Brand">
          <window.TweakText label="Brand name" value={tweaks.brand} onChange={v => setTweak('brand', v)} />
          <window.TweakText label="Tagline" value={tweaks.tagline} onChange={v => setTweak('tagline', v)} />
          <window.TweakText label="Product label" value={tweaks.product} onChange={v => setTweak('product', v)} />
        </window.TweakSection>
        <window.TweakSection title="Hero copy">
          <window.TweakText label="Headline (use \\n for line break)" value={tweaks.headline.replace(/\n/g,'\\n')} onChange={v => setTweak('headline', v.replace(/\\n/g,'\n'))} />
          <window.TweakText label="Rate text" value={tweaks.rateText} onChange={v => setTweak('rateText', v)} />
          <window.TweakText label="CTA label" value={tweaks.ctaLabel} onChange={v => setTweak('ctaLabel', v)} />
        </window.TweakSection>
        <window.TweakSection title="Visual">
          <window.TweakColor label="Primary color" value={tweaks.primaryColor} onChange={v => setTweak('primaryColor', v)} />
          <window.TweakColor label="Accent color" value={tweaks.accentColor} onChange={v => setTweak('accentColor', v)} />
          <window.TweakToggle label="Show partners strip" value={tweaks.showPartners} onChange={v => setTweak('showPartners', v)} />
        </window.TweakSection>
        <window.TweakSection title="Try the flow">
          <window.TweakButton label="Open Apply sheet" onClick={() => setSheetOpen(true)} />
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

const btnReset = { background: 'transparent', border: 'none', padding: 6, cursor: 'pointer', display: 'flex' };

function ConsentRow({ checked, onChange, color, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <CheckBox checked={checked} onChange={onChange} color={color} />
      <div style={{
        fontFamily: 'Inter, system-ui', fontSize: 12, color: '#3A4842',
        lineHeight: 1.45, paddingTop: 1,
      }}>{text}</div>
    </div>
  );
}

// ───────── Helpers ─────────
function shade(hex, amt) {
  // amt: -1..1 (negative = darken)
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  const adj = (c) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const toHex = (c) => c.toString(16).padStart(2,'0');
  return '#' + toHex(adj(r)) + toHex(adj(g)) + toHex(adj(b));
}

// ───────── Mount inside iOS frame ─────────
function App() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#E8E8E2', padding: 20 }}>
      <window.IOSDevice width={402} height={874}>
        <div data-screen-label="01 Home Loan landing" style={{ width: '100%', height: '100%' }}>
          <HomeLoanPage />
        </div>
      </window.IOSDevice>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
