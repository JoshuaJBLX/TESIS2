<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { api } from '$lib/api';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let documents = $state<any[]>([]);
  let loading = $state(true);
  let showUpload = $state(false);
  let uploadFile = $state<File | null>(null);
  let uploadTitle = $state('');
  let uploadDescription = $state('');
  let uploadChangeDesc = $state('');
  let uploadPassword = $state('');
  let uploading = $state(false);
  let uploadError = $state('');
  let downloadingId = $state('');
  let downloadError = $state('');
  let searchQuery = $state('');
  let searchInput = $state('');
  let searchDebounce: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    auth.init();
    if (!$auth.isAuthenticated) {
      goto('/login');
      return;
    }
    loadDocuments();
  });

  async function downloadDoc(id: string) {
    downloadingId = id;
    downloadError = '';
    const r = await api.downloadDocument(id);
    if (!r.ok) downloadError = r.error || 'No se pudo descargar';
    downloadingId = '';
  }

  async function loadDocuments() {
    loading = true;
    const result = await api.getDocuments(searchQuery || undefined);
    if (result.success && result.data) {
      documents = result.data;
    }
    loading = false;
  }

  function handleSearchInput() {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchQuery = searchInput;
      loadDocuments();
    }, 300);
  }

  function clearSearch() {
    searchInput = '';
    searchQuery = '';
    if (searchDebounce) clearTimeout(searchDebounce);
    loadDocuments();
  }

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      uploadFile = input.files[0];
    }
  }

  async function handleUpload(e: Event) {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadPassword) return;

    uploading = true;
    uploadError = '';

    const result = await api.uploadDocument(
      uploadFile,
      uploadTitle,
      uploadDescription,
      uploadChangeDesc,
      uploadPassword
    );

    if (result.success && result.data) {
      showUpload = false;
      uploadFile = null;
      uploadTitle = '';
      uploadDescription = '';
      uploadChangeDesc = '';
      uploadPassword = '';
      await loadDocuments();
    } else {
      uploadError = result.error || 'Error al subir documento';
    }

    uploading = false;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('es-PE');
  }
</script>

<div class="documents-page">
  <div class="page-header">
    <div>
      <span class="eyebrow">Gestiona tu archivo</span>
      <h1>Mis Documentos</h1>
      <p class="sub">Cada versión queda firmada y enlazada a la cadena de confianza.</p>
    </div>
    <button class="btn-primary btn-anim" onclick={() => showUpload = !showUpload}>
      {showUpload ? 'Cancelar' : '+ Subir Documento'}
    </button>
  </div>

  <div class="search-bar">
    <div class="search-input-wrapper">
      <span class="search-icon">&#128269;</span>
      <input
        type="text"
        class="search-input"
        placeholder="Buscar por titulo, descripcion o propietario..."
        bind:value={searchInput}
        oninput={handleSearchInput}
      />
      {#if searchInput}
        <button class="search-clear" onclick={clearSearch} title="Limpiar búsqueda">&times;</button>
      {/if}
    </div>
    {#if searchQuery}
      <span class="search-results-info">
        {documents.length} resultado{documents.length !== 1 ? 's' : ''} para "{searchQuery}"
      </span>
    {/if}
  </div>

  {#if showUpload}
    <div class="upload-panel anim-slide">
      <div class="upload-head"><span class="eyebrow">Nuevo documento</span><h2>Subir y firmar</h2></div>
      <p class="hint">El archivo se firmará automáticamente con tu clave privada (RSA-2048) y quedará anclado a la cadena.</p>

      {#if uploadError}
        <div class="error-message anim-shake">⚠ {uploadError}</div>
      {/if}

      <form onsubmit={handleUpload}>
        <div class="form-group">
          <label for="file">Archivo</label>
          <div class="file-zone">
            <span class="file-zone-icon">↥</span>
            <span class="file-zone-copy">{uploadFile ? uploadFile.name : 'Selecciona el archivo'}<small>{uploadFile ? (uploadFile.size / 1024).toFixed(1) + ' KB' : 'PDF, Word o texto · máximo 10 MB'}</small></span>
            <input type="file" id="file" onchange={handleFileChange} required disabled={uploading} />
          </div>
        </div>

        <div class="form-group">
          <label for="title">Titulo del documento</label>
          <input type="text" id="title" class="dt-input" bind:value={uploadTitle} placeholder="Ej: Contrato de Arrendamiento" required disabled={uploading} />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="desc">Descripcion (opcional)</label>
            <input type="text" id="desc" class="dt-input" bind:value={uploadDescription} placeholder="Descripcion breve" disabled={uploading} />
          </div>
          <div class="form-group">
            <label for="change">Que se modifico</label>
            <input type="text" id="change" class="dt-input" bind:value={uploadChangeDesc} placeholder="Ej: Version inicial del contrato" disabled={uploading} />
          </div>
        </div>

        <div class="form-group">
          <label for="pwd">Tu contrasena (para descifrar clave privada y firmar)</label>
          <input type="password" id="pwd" class="dt-input" bind:value={uploadPassword} placeholder="Tu contrasena de login" required disabled={uploading} />
        </div>

        <button type="submit" class="btn-primary btn-anim" class:is-loading={uploading} disabled={uploading || !uploadFile || !uploadTitle || !uploadPassword}>
          {uploading ? 'Subiendo y firmando...' : 'Subir y Firmar'}
        </button>
      </form>
    </div>
  {/if}

  {#if loading}
    <div class="skeletons-list" aria-label="Cargando documentos">
      {#each Array(4) as _}
        <div class="skeleton-row">
          <span class="skeleton sk-pill"></span>
          <span class="skeleton sk-line w70"></span>
          <span class="skeleton sk-line w45"></span>
          <span class="skeleton sk-square"></span>
        </div>
      {/each}
    </div>
  {:else if documents.length === 0}
    <div class="empty-state">
      <span class="empty-icon">🗂</span>
      <p><strong>No tienes documentos aun.</strong></p>
      <p>Sube tu primer documento para que sea firmado digitalmente.</p>
    </div>
  {:else}
    {#if downloadError}
      <div class="download-error anim-shake">⚠ {downloadError}</div>
    {/if}
    <div class="documents-list stagger">
      {#each documents as doc}
        <div class="document-row">
          <a href="/documents/{doc.id}" class="document-card">
            <div class="doc-icon">&#128196;</div>
            <div class="doc-info">
              <h3>{doc.title}</h3>
              <p class="doc-meta">
                v{doc.current_version} &middot; {doc.owner_username} &middot; {formatDate(doc.updated_at)}
                {#if doc.is_public}
                  <span class="public-tag"><i></i>Público</span>
                {:else}
                  <span class="private-tag">Privado</span>
                {/if}
              </p>
            </div>
            <div class="doc-arrow">&#8250;</div>
          </a>
          <button
            class="doc-download btn-anim"
            onclick={() => downloadDoc(doc.id)}
            disabled={downloadingId === doc.id}
            title={downloadingId === doc.id ? 'Descargando...' : 'Descargar versión actual'}
          >
            {downloadingId === doc.id ? '…' : '⭳'}
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .documents-page {
    padding: 1rem 0 3rem;
    max-width: 960px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .page-header h1 {
    color: var(--dt-ink);
    letter-spacing: -0.04em;
    margin: 9px 0 4px;
    font-size: clamp(1.7rem, 4vw, 2.4rem);
  }
  .page-header .sub {
    color: var(--dt-body);
    font-size: 0.85rem;
  }
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    background: #fff;
    color: var(--dt-pri);
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid var(--dt-line2);
    box-shadow: 0 6px 18px -8px rgba(109, 92, 255, 0.35);
  }
  .eyebrow::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--dt-grad);
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.16);
    animation: dtPulse 2.4s ease-out infinite;
  }

  .btn-primary {
    background: var(--dt-grad);
    color: white;
    border: none;
    padding: 0.8rem 1.6rem;
    border-radius: 12px;
    font-weight: 750;
    cursor: pointer;
    font-size: 0.9rem;
    box-shadow: var(--dt-glow-sm);
  }
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--dt-glow);
    filter: brightness(1.04);
  }
  .btn-primary:disabled {
    background: #c6cbdd;
    cursor: not-allowed;
    box-shadow: none;
  }

  .search-bar {
    margin-bottom: 1.5rem;
  }
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-icon {
    position: absolute;
    left: 1.1rem;
    font-size: 1rem;
    color: var(--dt-mute);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    padding: 0.8rem 3rem 0.8rem 2.9rem;
    border: 1px solid var(--dt-line2);
    border-radius: 14px;
    font-size: 0.93rem;
    background: rgba(255, 255, 255, 0.9);
    color: var(--dt-ink);
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  }
  .search-input:focus {
    outline: none;
    border-color: var(--dt-pri);
    background: #fff;
    box-shadow: 0 0 0 4px rgba(109, 92, 255, 0.14);
  }
  .search-clear {
    position: absolute;
    right: 0.9rem;
    background: none;
    border: none;
    font-size: 1.4rem;
    color: var(--dt-mute);
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
    border-radius: 6px;
    transition: color 0.18s;
  }
  .search-clear:hover {
    color: var(--dt-pri);
  }
  .search-results-info {
    display: block;
    margin-top: 0.55rem;
    font-size: 0.78rem;
    color: var(--dt-body);
  }

  .upload-panel {
    position: relative;
    background: #fff;
    padding: 1.7rem;
    border-radius: 20px;
    box-shadow: var(--dt-shadow-lg);
    margin-bottom: 2rem;
    border: 1px solid var(--dt-line);
    overflow: hidden;
  }
  .upload-panel::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: var(--dt-grad-hot);
  }
  .upload-head h2 {
    color: var(--dt-ink);
    margin-top: 8px;
    letter-spacing: -0.03em;
  }
  .hint {
    color: var(--dt-body);
    font-size: 0.85rem;
    margin-bottom: 1.2rem;
  }
  .error-message {
    background: var(--dt-err-bg);
    border: 1px solid var(--dt-err-line);
    color: #be123c;
    padding: 0.8rem;
    border-radius: 11px;
    margin-bottom: 1rem;
    font-size: 0.8rem;
  }
  .form-group {
    margin-bottom: 1rem;
    flex: 1;
  }
  .form-row {
    display: flex;
    gap: 14px;
  }
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 700;
    font-size: 0.78rem;
    color: #35415c;
  }
  .dt-input:invalid {
    box-shadow: none;
  }
  .file-zone {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    border: 1.5px dashed var(--dt-line2);
    border-radius: 14px;
    background: linear-gradient(160deg, #fbfcff, #f4f1ff);
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
  }
  .file-zone:hover {
    border-color: var(--dt-pri);
    background: #f3f0ff;
  }
  .file-zone-icon {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: var(--dt-grad);
    color: #fff;
    font-size: 1.3rem;
    font-weight: 900;
    box-shadow: var(--dt-glow-sm);
  }
  .file-zone-copy {
    font-size: 0.88rem;
    color: var(--dt-ink);
    display: grid;
    gap: 3px;
  }
  .file-zone-copy small {
    color: var(--dt-mute);
    font-size: 0.7rem;
  }
  .file-zone input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .empty-state {
    text-align: center;
    padding: 3.4rem 1.5rem;
    color: var(--dt-body);
    background: #fff;
    border: 1.5px dashed var(--dt-line2);
    border-radius: 20px;
    display: grid;
    justify-items: center;
    gap: 6px;
  }
  .empty-icon {
    font-size: 1.9rem;
    margin: 0 0 4px;
  }

  .skeletons-list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .skeleton-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    height: 72px;
    padding: 0 1.25rem;
    background: #fff;
    border: 1px solid var(--dt-line);
    border-radius: 15px;
    box-shadow: var(--dt-shadow);
  }
  .sk-pill {
    width: 44px;
    height: 44px;
    border-radius: 13px;
    flex: none;
  }
  .sk-line {
    height: 12px;
  }
  .w70 { width: 55%; }
  .w45 { width: 30%; }
  .sk-square {
    width: 36px;
    height: 36px;
    border-radius: 11px;
    margin-left: auto;
    flex: none;
  }
  @media (max-width: 600px) {
    .sk-line.w70 { width: 45%; }
    .sk-line.w45 { display: none; }
    .form-row { flex-direction: column; gap: 0; }
  }

  .documents-list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .document-row {
    position: relative;
  }
  .document-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #fff;
    padding: 1rem 1.3rem;
    border-radius: 16px;
    box-shadow: var(--dt-shadow);
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    border: 1px solid var(--dt-line);
    padding-right: 62px;
  }
  .document-card:hover {
    box-shadow: var(--dt-shadow-lg);
    transform: translateY(-2px);
    border-color: #cdd6f2;
  }
  .doc-icon {
    font-size: 1.4rem;
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: var(--dt-grad-soft);
    color: var(--dt-pri);
    border: 1px solid #ddd7fa;
    flex: none;
  }
  .doc-info {
    flex: 1;
    min-width: 0;
  }
  .doc-info h3 {
    color: var(--dt-ink);
    margin-bottom: 0.3rem;
    font-size: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .doc-meta {
    color: var(--dt-body);
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .public-tag,
  .private-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 750;
  }
  .public-tag {
    background: var(--dt-ok-bg);
    color: #047857;
    border: 1px solid var(--dt-ok-line);
  }
  .public-tag i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.18);
  }
  .private-tag {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
  .doc-arrow {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #f4f1ff;
    color: var(--dt-pri);
    font-size: 1.3rem;
    font-weight: 800;
    flex: none;
    transition: transform 0.18s, background 0.18s;
  }
  .document-card:hover .doc-arrow {
    background: var(--dt-grad);
    color: #fff;
    transform: translateX(3px);
  }
  .doc-download {
    position: absolute;
    right: 1.3rem;
    top: 50%;
    transform: translateY(-50%);
    background: #fff;
    color: var(--dt-pri);
    border: 1px solid var(--dt-line2);
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    font-size: 1.1rem;
    text-decoration: none;
    transition: background 0.18s, border-color 0.18s, transform 0.18s;
    cursor: pointer;
    box-shadow: 0 4px 12px -6px rgba(15, 23, 42, 0.15);
  }
  .doc-download:hover:not(:disabled) {
    background: var(--dt-grad);
    border-color: transparent;
    color: #fff;
    transform: translateY(-50%) translateY(-2px);
  }
  .doc-download:disabled {
    opacity: 0.5;
    cursor: wait;
  }
  .download-error {
    background: var(--dt-err-bg);
    border: 1px solid var(--dt-err-line);
    color: #be123c;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
    font-size: 0.8rem;
  }
</style>