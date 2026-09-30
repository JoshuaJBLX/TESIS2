<script lang="ts">
  import { api } from '$lib/api';
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let doc = $state<any>(null);
  let versions = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');

  let showPropose = $state(false);
  let proposeFile = $state<File | null>(null);
  let proposeDesc = $state('');
  let proposePassword = $state('');
  let proposing = $state(false);
  let proposeError = $state('');
  let proposeSuccess = $state('');

  onMount(async () => {
    auth.init();
    const id = $page.params.id;
    if (!id) { error = 'Documento no encontrado'; loading = false; return; }
    const result = await api.getPublicDocument(id);
    if (result.success && result.data) {
      doc = result.data.document;
      versions = result.data.versions || [];
    } else {
      error = result.error || 'Documento no encontrado';
    }
    loading = false;
  });

  function isOwner() {
    return $auth.user?.id && doc && $auth.user.id === doc.owner_id;
  }

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    proposeFile = input.files?.[0] || null;
  }

  async function submitProposal(e: Event) {
    e.preventDefault();
    const id = $page.params.id;
    if (!id || !proposeFile || !proposeDesc || !proposePassword) return;
    proposing = true;
    proposeError = '';
    proposeSuccess = '';
    const result = await api.createProposal(id, proposeFile, proposeDesc, proposePassword);
    if (result.success) {
      proposeSuccess = '¡Propuesta enviada! El propietario la revisará y, si la acepta, quedarás registrado como coautor del documento.';
      showPropose = false;
      proposeFile = null;
      proposeDesc = '';
      proposePassword = '';
    } else {
      proposeError = result.error || 'No se pudo enviar la propuesta';
    }
    proposing = false;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('es-PE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function ext(name: string) {
    return name.includes('.') ? name.split('.').pop()!.toUpperCase() : 'DOC';
  }
</script>

<svelte:head><title>{doc?.title || 'Documento'} · DocuTrust</title></svelte:head>

<div class="page">
  {#if loading}
    <div class="state">
      <div class="spinner"></div>
      <p>Cargando documento...</p>
    </div>
  {:else if error}
    <div class="state"><h2>{error}</h2><a href="/">Volver al inicio</a></div>
  {:else if doc}
    <section class="header anim-rise">
      <div class="accents anim-fade" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="header-main">
        <span class="eyebrow">Documento público</span>
        <h1>{doc.title}</h1>
        {#if doc.description}<p class="sub">{doc.description}</p>{/if}
        <div class="chips">
          <span>Propietario: <b>{doc.owner_username}</b></span>
          <span>Versión actual <b>v{doc.latestVersion?.version_number || 0}</b></span>
          {#if doc.latestVersion?.coauthor_username}
            <span class="chip-coauthor">Coautores: <b>{doc.latestVersion.coauthor_username}</b></span>
          {/if}
        </div>
      </div>
      <a class="btn btn-primary" href={api.downloadDocumentUrl(doc.id)} download>
        ⭳ Descargar versión actual
      </a>
    </section>

    {#if proposeSuccess}
      <div class="success anim-pop">{proposeSuccess}</div>
    {/if}

    {#if isOwner()}
      <div class="owner-note anim-rise d1">
        <span class="note-icon">📋</span>
        <div>
          <strong>Eres el propietario de este documento.</strong>
          <p>Administra versiones, propuestas y la visibilidad desde tu panel.</p>
        </div>
        <a class="btn btn-primary" href="/documents/{doc.id}">Ir al panel →</a>
      </div>
    {:else if $auth.isAuthenticated}
      <section class="propose anim-rise">
        <div class="propose-head">
          <div>
            <span class="eyebrow">Colaboración</span>
            <h2>Proponer cambios</h2>
            <p class="hint">Envía una versión propuesta del archivo. El propietario la revisará y, si la acepta, se convierte en versión oficial y quedas registrado como coautor.</p>
          </div>
          <button class="btn btn-primary" onclick={() => { showPropose = !showPropose; proposeError = ''; }}>
            {showPropose ? 'Cerrar' : '+ Enviar propuesta'}
          </button>
        </div>

        {#if showPropose}
          {#if proposeError}
            <div class="alert anim-shake">{proposeError}</div>
          {/if}
          <form class="anim-slide" onsubmit={submitProposal}>
            <label class="file">
              <span>{proposeFile ? '✓ ' + proposeFile.name : 'Selecciona tu archivo propuesto'}</span>
              <small>PDF, Word o texto — máximo 10 MB</small>
              <input type="file" onchange={handleFileChange} required disabled={proposing} />
            </label>
            <label>
              Describe los cambios que realizaste
              <textarea bind:value={proposeDesc} placeholder="Ej. Modifiqué la cláusula 4.2 y añadí una nueva sección de anexos" required disabled={proposing}></textarea>
            </label>
            <label>
              Tu contraseña (para firmar tu propuesta)
              <input type="password" bind:value={proposePassword} placeholder="Tu contraseña de login" required disabled={proposing} />
            </label>
            <button class="btn btn-primary submit-btn" disabled={proposing || !proposeFile || !proposeDesc || !proposePassword}>
              {proposing ? 'Firmando propuesta…' : 'Enviar propuesta firmada →'}
            </button>
          </form>
        {/if}
      </section>
    {:else}
      <section class="auth-note anim-rise d1">
        <span class="note-icon">🔐</span>
        <div>
          <strong>¿Quieres proponer cambios a este documento?</strong>
          <p>Inicia sesión para enviar una propuesta firmada y aparecer como coautor si es aceptada.</p>
        </div>
        <div class="auth-actions">
          <a class="btn btn-primary" href="/login">Iniciar sesión</a>
          <a class="btn btn-ghost" href="/register">Crear cuenta</a>
        </div>
      </section>
    {/if}

    <div class="section-head anim-rise">
      <div><h2>Historial público de versiones</h2><span class="sub">&nbsp;{versions.length} {(versions.length === 1 ? 'versión' : 'versiones')}</span></div>
      <span class="count">{versions.length}</span>
    </div>

    <section class="timeline stagger">
      {#each versions as ver, i}
        <article class="tl-item">
          <div class="tl-marker {i === 0 ? 'tl-current' : ''}"><i></i></div>
          <div class="tl-card">
            <div class="tl-head">
              <span class="version">v{ver.version_number}</span>
              <span class="date">{formatDate(ver.upload_date)}</span>
            </div>
            <div class="tl-body">
              <span class="file-badge">{ext(ver.file_name)}</span>
              <div class="tl-info">
                <h3>{ver.file_name}</h3>
                <p>{(ver.file_size / 1024).toFixed(1)} KB · Firmado por {ver.signer_username || '—'}{ver.coauthor_username ? ' + ' + ver.coauthor_username : ''}</p>
                {#if ver.change_description}
                  <p class="change">¿ {ver.change_description}</p>
                {/if}
              </div>
              <a class="btn btn-download" href={api.downloadDocumentUrl(doc.id, ver.id)} download>⭳</a>
            </div>
          </div>
        </article>
      {/each}
    </section>
  {/if}
</div>

<style>
  .page { max-width: 900px; margin: 0 auto; padding: 0 0 45px; }
  .state { display: grid; place-items: center; gap: 14px; padding: 90px 0; color: #64748b; text-align: center; }
  .state h2 { color: #17213a; margin-bottom: 10px; }
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
  .header h1 { color: #101b3d; margin: 8px 0; font-size: clamp(1.55rem, 4vw, 2.4rem); letter-spacing: -.045em; }
  .header .sub { color: #64748b; font-size: .85rem; }
  .chips { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
  .chips span { font-size: .73rem; color: #64748b; background: #f4f7fb; border: 1px solid #e1e7f0; padding: 6px 11px; border-radius: 999px; }
  .chips b { color: #334155; }
  .chip-coauthor { color: #047857 !important; background: #ecfdf5 !important; border-color: #bbf7d0 !important; }
  .btn { text-decoration: none; padding: 11px 16px; border-radius: 10px; font-size: .8rem; font-weight: 800; cursor: pointer; border: 0; display: inline-block; font-family: inherit; }
  .btn-primary { background: #4f46e5; color: #fff; }
  .btn-primary:hover:not(:disabled) { background: #4338ca; }
  .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
  .btn-ghost { background: #eef2ff; color: #4f46e5; }
  .btn-ghost:hover { background: #e0e7ff; }
  .btn-download { background: #fff; color: #4f46e5; border: 1px solid #c7d2fe; }
  .btn-download:hover { background: #eef2ff; }
  .success { margin-top: 16px; padding: 14px 16px; background: #ecfdf5; color: #047857; border: 1px solid #bbf7d0; border-radius: 11px; font-size: .82rem; font-weight: 700; }
  .propose { margin-top: 18px; background: #fff; border: 1px solid #e1e7f0; border-radius: 15px; padding: 24px; box-shadow: 0 8px 25px rgba(30,41,59,.05); }
  .propose-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
  .propose h2 { color: #17213a; font-size: 1.15rem; margin: 6px 0; }
  .hint { color: #64748b; font-size: .8rem; margin: 0; max-width: 560px; }
  .propose form { display: grid; gap: 13px; margin-top: 18px; }
  .propose label { display: grid; gap: 7px; color: #334155; font-size: .75rem; font-weight: 750; }
  .propose input, .propose textarea { width: 100%; padding: 11px 12px; border: 1px solid #d9e1ec; border-radius: 9px; background: #fbfdff; color: #17213a; font-family: inherit; }
  .propose textarea { min-height: 75px; resize: vertical; }
  .propose input:focus, .propose textarea:focus { outline: 0; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.12); }
  .file { display: grid; place-items: center; padding: 18px; border: 1.5px dashed #bec9dc; border-radius: 10px; background: #f8fafc; cursor: pointer; text-align: center; transition: .15s; }
  .file:hover { background: #eef2ff; border-color: #818cf8; }
  .file span { font-size: .85rem; }
  .file small { color: #94a3b8; font-size: .7rem; }
  .file input { display: none; }
  .submit-btn { justify-self: start; }
  .alert { padding: 11px 13px; background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; border-radius: 9px; font-size: .78rem; }
  .owner-note, .auth-note { margin-top: 18px; display: flex; align-items: center; gap: 14px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 15px 18px; color: #3730a3; flex-wrap: wrap; }
  .owner-note > div, .auth-note > div { flex: 1; min-width: 200px; }
  .owner-note strong, .auth-note strong { font-size: .85rem; }
  .owner-note p, .auth-note p { color: #5b21b6; font-size: .76rem; margin: 3px 0 0; }
  .note-icon { font-size: 1.4rem; }
  .auth-note { background: #fff; border-color: #e1e7f0; }
  .auth-note p { color: #64748b; }
  .auth-actions { display: flex; gap: 9px; }
  .section-head { display: flex; align-items: center; justify-content: space-between; margin: 30px 0 16px; }
  .section-head h2 { color: #17213a; font-size: 1.2rem; display: inline; }
  .section-head .sub { color: #94a3b8; font-size: .8rem; font-weight: 600; }
  .count { color: #64748b; background: #fff; padding: 7px 10px; border: 1px solid #e1e7f0; border-radius: 7px; font-size: .7rem; }
  .timeline { display: grid; gap: 0; }
  .tl-item { display: flex; gap: 16px; }
  .tl-marker { display: flex; flex-direction: column; align-items: center; width: 24px; padding-top: 6px; position: relative; }
  .tl-marker::after { content: ''; position: absolute; top: 26px; bottom: -2px; width: 2px; background: #e2e8f0; }
  .tl-item:last-child .tl-marker::after { display: none; }
  .tl-marker i { width: 14px; height: 14px; border-radius: 50%; border: 3px solid #94a3b8; background: #fff; z-index: 1; }
  .tl-marker.tl-current i { border-color: #4f46e5; background: #4f46e5; box-shadow: 0 0 0 4px rgba(79,70,229,.15); }
  .tl-card { flex: 1; margin-bottom: 12px; background: #fff; border: 1px solid #e1e7f0; border-radius: 13px; padding: 15px 17px; box-shadow: 0 1px 3px rgba(30,41,59,.05); }
  .tl-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .version { color: #4338ca; background: #e0e7ff; padding: 4px 10px; border-radius: 6px; font-weight: 850; font-size: .76rem; }
  .date { color: #94a3b8; font-size: .7rem; }
  .tl-body { display: flex; align-items: center; gap: 13px; }
  .file-badge { background: #eef2ff; color: #4338ca; font-size: .66rem; font-weight: 900; letter-spacing: .04em; padding: 7px 9px; border-radius: 8px; flex-shrink: 0; }
  .tl-info { flex: 1; min-width: 0; }
  .tl-info h3 { font-size: .9rem; color: #334155; margin: 0 0 3px; }
  .tl-info p { color: #64748b; font-size: .72rem; margin: 1px 0; }
  .tl-info .change { color: #4f46e5; }
  .tl-body .btn-download { padding: 8px 11px; font-size: .9rem; flex-shrink: 0; }
  @media (max-width: 600px) {
    .header { align-items: flex-start; padding: 20px 18px 20px 24px; }
    .header .btn-primary { width: 100%; text-align: center; }
    .propose-head .btn { width: 100%; text-align: center; }
    .tl-body { flex-wrap: wrap; }
    .owner-note, .auth-note { flex-direction: column; align-items: flex-start; }
  }
.tl-marker.tl-current i {
    animation: ringPulse 2s ease-out infinite;
  }
  .tl-card {
    transition: transform 0.18s cubic-bezier(0.22, 0.9, 0.34, 1),
      box-shadow 0.18s, border-color 0.18s;
  }
  .tl-card:hover {
    transform: translateX(3px);
    box-shadow: 0 10px 22px rgba(30, 41, 59, 0.1);
    border-color: #c7d2fe;
  }
  .btn {
    transition: background 0.18s, transform 0.18s, box-shadow 0.18s,
      border-color 0.18s;
  }
  .btn:active {
    transform: scale(0.97);
  }
</style>