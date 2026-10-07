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
      const found = (result.data.versions || []).find((v: any) => v.version_number === wanted);
      if (!found) {
        error = `Este documento no tiene una versión ${wanted}`;
      } else {
        doc = result.data.document;
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
  .state { display: grid; place-items: center; gap: 14px; padding: 90px 0; color: #64748b; text-align: center; }
  .state h2 { color: #17213a; margin-bottom: 10px; font-size: 1.15rem; }
  .state a { color: #4f46e5; }
  .spinner { width: 34px; height: 34px; border: 3px solid #c7d2fe; border-top-color: #4f46e5; border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .header { position: relative; overflow: hidden; background: #fff; border: 1px solid #e1e7f0; border-radius: 18px; padding: 28px 28px 26px; display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; box-shadow: 0 8px 25px rgba(30,41,59,.05); }
  .accents { position: absolute; inset: 0 auto 0 0; width: 6px; display: flex; flex-direction: column; }
  .accents span { flex: 1; }
  .accents span:nth-child(1) { background: linear-gradient(#4f46e5, #7c3aed); }
  .accents span:nth-child(2) { background: #7c3aed; }
  .accents span:nth-child(3) { background: #c7d2fe; }
  .header-main { flex: 1; min-width: 260px; }
  .eyebrow { font-size: .66rem; color: #4f46e5; font-weight: 850; letter-spacing: .11em; text-transform: uppercase; }
  .header h1 { color: #101b3d; margin: 8px 0; font-size: clamp(1.4rem, 3.6vw, 2.1rem); letter-spacing: -.045em; }
  .header .sub { color: #64748b; font-size: .85rem; }
  .chips { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
  .chips span { font-size: .73rem; color: #64748b; background: #f4f7fb; border: 1px solid #e1e7f0; padding: 6px 11px; border-radius: 999px; }
  .chips b { color: #334155; }
  .chip-coauthor { color: #047857 !important; background: #ecfdf5 !important; border-color: #bbf7d0 !important; }
  .btn { text-decoration: none; padding: 11px 16px; border-radius: 10px; font-size: .8rem; font-weight: 800; cursor: pointer; border: 0; display: inline-block; font-family: inherit; }
  .btn-primary { background: #4f46e5; color: #fff; }
  .btn-primary:hover { background: #4338ca; }

  .vcard { margin-top: 18px; background: #fff; border: 1px solid #e1e7f0; border-radius: 15px; padding: 22px 24px; box-shadow: 0 8px 25px rgba(30,41,59,.05); }
  .vcard-head { display: flex; align-items: center; gap: 13px; }
  .vcard-title { flex: 1; min-width: 0; }
  .vcard-title h2 { font-size: .95rem; color: #17213a; margin: 0 0 3px; word-break: break-word; }
  .vcard-title p { color: #64748b; font-size: .73rem; margin: 0; }
  .file-badge { background: #eef2ff; color: #4338ca; font-size: .66rem; font-weight: 900; letter-spacing: .04em; padding: 7px 9px; border-radius: 8px; flex-shrink: 0; }
  .version { color: #4338ca; background: #e0e7ff; padding: 5px 11px; border-radius: 6px; font-weight: 850; font-size: .78rem; flex-shrink: 0; }

  .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin: 20px 0 0; padding-top: 18px; border-top: 1px solid #eef2f7; }
  .meta div { min-width: 0; }
  .meta dt { font-size: .64rem; font-weight: 850; letter-spacing: .09em; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px; }
  .meta dd { margin: 0; font-size: .8rem; color: #334155; word-break: break-word; }
  .meta code { background: #f5f7fa; padding: 2px 5px; border-radius: 4px; font-size: .68rem; word-break: break-all; line-height: 1.5; }

  .change-box { margin-top: 18px; padding-top: 16px; border-top: 1px solid #eef2f7; }
  .change-box p { color: #4f46e5; font-size: .84rem; margin: 6px 0 0; }

  .footer-link { margin-top: 20px; text-align: center; }
  .footer-link a { color: #4f46e5; font-size: .8rem; font-weight: 750; text-decoration: none; }
  .footer-link a:hover { text-decoration: underline; }

  @media (max-width: 600px) {
    .header { align-items: flex-start; padding: 20px 18px 20px 24px; }
    .header .btn-primary { width: 100%; text-align: center; }
    .vcard { padding: 18px; }
  }
</style>
