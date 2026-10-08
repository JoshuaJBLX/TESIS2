<script lang="ts">
  import { api } from '$lib/api';
  import { page } from '$app/state';

  let doc = $state<any>(null);
  let ver = $state<any>(null);
  let loading = $state(true);
  let error = $state('');

  let token = 0;

  async function load(id?: string, rawVersion?: string) {
    const me = ++token;
    loading = true;
    error = '';
    doc = null;
    ver = null;

    const parsed = /^[vV]?(\d+)$/.exec(rawVersion || '');
    if (!id || !parsed) {
      error = 'El enlace de la versión no es válido';
      loading = false;
      return;
    }
    const wanted = Number(parsed[1]);

    const result = await api.getPublicDocument(id);
    if (me !== token) return;

    if (result.success && result.data) {
      doc = result.data.document || null;
      const found = (result.data.versions || []).find((v: any) => v.version_number === wanted);
      if (!found) {
        error = `La versión v${wanted} no está disponible públicamente en este momento.`;
      } else {
        ver = found;
      }
    } else {
      error = result.error || 'Documento no encontrado';
    }
    loading = false;
  }

  $effect(() => {
    void load(page.params.id, page.params.version);
  });

  const heading = $derived(
    doc && ver
      ? ver.change_description
        ? `${doc.title} (V${ver.version_number} · ${ver.change_description})`
        : `${doc.title} (V${ver.version_number})`
      : ''
  );

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function ext(name: string) {
    return name.includes('.') ? name.split('.').pop()!.toUpperCase() : 'DOC';
  }

  function sizeOf(bytes: number) {
    return (bytes / 1024).toFixed(1);
  }
</script>

<svelte:head>
  <title>{ver ? `V${ver.version_number} · ${doc?.title || 'Documento'}` : doc?.title || 'Documento'} · DocuTrust</title>
</svelte:head>

<div class="page">
  {#if loading}
    <div class="state">
      <div class="spinner"></div>
      <p>Cargando versión...</p>
    </div>
  {:else if error}
    <div class="state">
      <h2>{error}</h2>
      <a href="/">Volver al inicio</a>
    </div>
  {:else if doc && ver}
    <section class="header anim-rise">
      <div class="accents anim-fade" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="header-orb" aria-hidden="true"></div>
      <div class="header-main">
        <span class="eyebrow">Versión {ver.version_number} de {doc.current_version}</span>
        <h1>{heading}</h1>
        {#if doc.description}<p class="sub">{doc.description}</p>{/if}
        <div class="chips">
          <span>Propietario: <b>{doc.owner_username}</b></span>
          <span>Publicado <b>{formatDate(ver.upload_date)}</b></span>
          {#if ver.coauthor_username}
            <span class="chip-coauthor">Coautor: <b>{ver.coauthor_username}</b></span>
          {/if}
        </div>
      </div>
      <a
        class="btn btn-primary"
        href={api.downloadDocumentUrl(doc.id, ver.id)}
        download
      >
        ⭳ Descargar esta versión
      </a>
    </section>

    <section class="vcard anim-rise d1">
      <div class="vcard-head">
        <span class="file-badge">{ext(ver.file_name)}</span>
        <div class="vcard-title">
          <h2>{ver.file_name}</h2>
          <p>{sizeOf(ver.file_size)} KB · v{ver.version_number} · Firmado por {ver.signer_username || '—'}</p>
        </div>
        <span class="version">V{ver.version_number}</span>
      </div>

      <dl class="meta">
        <div>
          <dt>Hash SHA-256</dt>
          <dd><code>{ver.content_hash}</code></dd>
        </div>
        <div>
          <dt>Algoritmo</dt>
          <dd>{ver.signature_algorithm || '—'}</dd>
        </div>
        <div>
          <dt>Registrado</dt>
          <dd>{formatDate(ver.upload_date)}</dd>
        </div>
        <div>
          <dt>Subido por</dt>
          <dd>{ver.uploader_username || '—'}</dd>
        </div>
      </dl>

      {#if ver.change_description}
        <div class="change-box">
          <span class="eyebrow">Qué cambió en esta versión</span>
          <p>{ver.change_description}</p>
        </div>
      {/if}
    </section>

    <div class="footer-link anim-rise d2">
      <a href="/v/{doc.id}">Ver el documento completo y sus {doc.current_version} versiones →</a>
    </div>
  {/if}
</div>

<style>
  .page { max-width: 900px; margin: 0 auto; padding: 0 0 45px; }
  .state { display: grid; place-items: center; gap: 14px; padding: 90px 0; color: var(--dt-body); text-align: center; }
  .state h2 { color: var(--dt-ink); margin-bottom: 10px; font-size: 1.15rem; }
  .state a { color: var(--dt-pri); }
  .spinner { width: 34px; height: 34px; border: 3px solid #ddd7fa; border-top-color: var(--dt-pri); border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .header { position: relative; overflow: hidden; background: #fff; border: 1px solid var(--dt-line); border-radius: 22px; padding: 28px 28px 26px; display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; box-shadow: var(--dt-shadow); }
  .header::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 4px; background: var(--dt-grad-hot); }
  .header-orb { position: absolute; width: 260px; height: 260px; border-radius: 50%; right: -80px; top: -100px; background: radial-gradient(circle at 40% 40%, rgba(167,139,250,.28), rgba(109,92,255,0) 70%); pointer-events: none; }
  .accents { position: absolute; inset: 0 auto 0 0; width: 6px; display: flex; flex-direction: column; }
  .accents span { flex: 1; }
  .accents span:nth-child(1) { background: var(--dt-pri); }
  .accents span:nth-child(2) { background: var(--dt-pri2); }
  .accents span:nth-child(3) { background: #c7d2fe; }
  .header-main { flex: 1; min-width: 260px; }
  .eyebrow { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; background: #fff; color: var(--dt-pri); font-size: .66rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; border: 1px solid var(--dt-line2); box-shadow: 0 6px 18px -8px rgba(109, 92, 255, .35); }
  .eyebrow::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--dt-grad); box-shadow: 0 0 0 4px rgba(139, 92, 246, .16); animation: dtPulse 2.4s ease-out infinite; }
  .header h1 { color: var(--dt-ink); margin: 10px 0; font-size: clamp(1.4rem, 3.6vw, 2.1rem); letter-spacing: -.045em; }
  .header .sub { color: var(--dt-body); font-size: .85rem; max-width: 640px; }
  .chips { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
  .chips span { font-size: .73rem; color: var(--dt-body); background: #f4f7fb; border: 1px solid var(--dt-line); padding: 6px 11px; border-radius: 999px; }
  .chips b { color: #334155; }
  .chip-coauthor { color: #047857 !important; background: #ecfdf5 !important; border-color: #bbf7d0 !important; font-weight: 700; }
  .btn { text-decoration: none; padding: 11px 16px; border-radius: 12px; font-size: .8rem; font-weight: 800; cursor: pointer; border: 0; display: inline-block; font-family: inherit; transition: background 0.18s, transform 0.18s, box-shadow 0.18s, border-color 0.18s; }
  .btn:active { transform: scale(0.97); }
  .btn-primary { background: var(--dt-grad); color: #fff; box-shadow: var(--dt-glow-sm); }
  .btn-primary:hover { box-shadow: var(--dt-glow); transform: translateY(-2px); filter: brightness(1.05); }

  .vcard { position: relative; margin-top: 18px; background: #fff; border: 1px solid var(--dt-line); border-radius: 20px; padding: 22px 24px; box-shadow: var(--dt-shadow); overflow: hidden; }
  .vcard::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 4px; background: var(--dt-grad-hot); }
  .vcard-head { display: flex; align-items: center; gap: 13px; }
  .vcard-title { flex: 1; min-width: 0; }
  .vcard-title h2 { font-size: .95rem; color: var(--dt-ink); margin: 0 0 3px; word-break: break-word; }
  .vcard-title p { color: var(--dt-body); font-size: .73rem; margin: 0; }
  .file-badge { background: linear-gradient(135deg, #eef2ff, #e9e4ff); color: var(--dt-pri2); font-size: .66rem; font-weight: 900; letter-spacing: .04em; padding: 7px 9px; border-radius: 9px; border: 1px solid #e2dbfb; flex-shrink: 0; }
  .version { color: #fff; background: var(--dt-grad); padding: 5px 11px; border-radius: 999px; font-weight: 850; font-size: .78rem; flex-shrink: 0; box-shadow: var(--dt-glow-sm); }

  .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin: 20px 0 0; padding-top: 18px; border-top: 1px solid var(--dt-line); }
  .meta div { min-width: 0; }
  .meta dt { font-size: .64rem; font-weight: 850; letter-spacing: .09em; text-transform: uppercase; color: var(--dt-mute); margin-bottom: 5px; }
  .meta dd { margin: 0; font-size: .8rem; color: #334155; word-break: break-word; }
  .meta code { background: #f3f0ff; border: 1px solid #e5e0fb; padding: 3px 6px; border-radius: 7px; font-size: .68rem; word-break: break-all; line-height: 1.5; color: var(--dt-pri); }

  .change-box { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--dt-line); }
  .change-box p { color: var(--dt-pri); font-size: .84rem; margin: 6px 0 0; }
  .change-box .eyebrow { box-shadow: none; }

  .footer-link { margin-top: 20px; text-align: center; }
  .footer-link a { color: var(--dt-pri); font-size: .8rem; font-weight: 750; text-decoration: none; background: #fff; border: 1px solid var(--dt-line); padding: 11px 18px; border-radius: 999px; display: inline-block; transition: border-color .18s, box-shadow .18s, transform .18s; }
  .footer-link a:hover { border-color: var(--dt-pri); box-shadow: var(--dt-shadow); transform: translateY(-2px); }

  @media (max-width: 600px) {
    .header { align-items: flex-start; padding: 20px 18px 20px 24px; }
    .header .btn-primary { width: 100%; text-align: center; }
    .vcard { padding: 18px; }
  }
</style>