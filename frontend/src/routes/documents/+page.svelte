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
    <h1>Mis Documentos</h1>
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
      <h2>Subir Nuevo Documento</h2>
      <p class="hint">El documento sera firmado automaticamente con tu clave privada (RSA-2048).</p>

      {#if uploadError}
        <div class="error-message anim-shake">{uploadError}</div>
      {/if}

      <form onsubmit={handleUpload}>
        <div class="form-group">
          <label for="file">Archivo</label>
          <input type="file" id="file" onchange={handleFileChange} required disabled={uploading} />
          {#if uploadFile}
            <span class="file-info">{uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="title">Titulo del documento</label>
          <input type="text" id="title" bind:value={uploadTitle} placeholder="Ej: Contrato de Arrendamiento" required disabled={uploading} />
        </div>

        <div class="form-group">
          <label for="desc">Descripcion (opcional)</label>
          <input type="text" id="desc" bind:value={uploadDescription} placeholder="Descripcion breve" disabled={uploading} />
        </div>

        <div class="form-group">
          <label for="change">Que se modifico</label>
          <input type="text" id="change" bind:value={uploadChangeDesc} placeholder="Ej: Version inicial del contrato" disabled={uploading} />
        </div>

        <div class="form-group">
          <label for="pwd">Tu contrasena (para descifrar clave privada y firmar)</label>
          <input type="password" id="pwd" bind:value={uploadPassword} placeholder="Tu contrasena de login" required disabled={uploading} />
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
      <p>No tienes documentos aun.</p>
      <p>Sube tu primer documento para que sea firmado digitalmente.</p>
    </div>
  {:else}
    {#if downloadError}
      <div class="download-error anim-shake">{downloadError}</div>
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
                  <span class="public-tag">Público</span>
                {:else}
                  <span class="private-tag">Privado</span>
                {/if}
              </p>
            </div>
            <div class="doc-arrow">&rsaquo;</div>
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
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  h1 {
    color: #1a1a2e;
  }

  .btn-primary {
    background-color: #4f46e5;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #4338ca;
  }

  .btn-primary:disabled {
    background-color: #ccc;
    cursor: not-allowed;
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
    left: 1rem;
    font-size: 1rem;
    color: #9ca3af;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 2.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.95rem;
    background: #fbfdff;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79,70,229,.12);
  }

  .search-clear {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    font-size: 1.25rem;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
    border-radius: 4px;
    transition: color 0.2s;
  }

  .search-clear:hover {
    color: #4f46e5;
  }

  .search-results-info {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .upload-panel {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
    border: 1px solid #e5eaf2;
  }

  .hint {
    color: #666;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .error-message {
    background-color: #fee;
    border: 1px solid #fcc;
    color: #c00;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.95rem;
    background: #fbfdff;
  }

  input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79,70,229,.12);
  }

  .file-info {
    display: block;
    margin-top: 0.5rem;
    color: #666;
    font-size: 0.85rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
  }

  .skeletons-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .skeleton-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    height: 66px;
    padding: 0 1.25rem;
    background: #fff;
    border: 1px solid #e5eaf2;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  .sk-pill {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    flex: none;
  }

  .sk-line {
    height: 12px;
  }

  .w70 { width: 55%; }
  .w45 { width: 30%; }

  .sk-square {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    margin-left: auto;
    flex: none;
  }

  @media (max-width: 600px) {
    .sk-line.w70 { width: 45%; }
    .sk-line.w45 { display: none; }
  }

  .documents-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .document-row {
    position: relative;
  }

  .document-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: white;
    padding: 1rem 1.25rem;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    text-decoration: none;
    color: inherit;
    transition: box-shadow 0.2s;
    border: 1px solid #e5eaf2;
  }

  .document-card:hover {
    box-shadow: 0 8px 24px rgba(30,41,59,.12);
    transform: translateY(-1px);
  }

  .doc-download {
    position: absolute;
    right: 1.1rem;
    top: 50%;
    transform: translateY(-50%);
    background: #fff;
    color: #4f46e5;
    border: 1px solid #c7d2fe;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    font-size: 1rem;
    text-decoration: none;
    transition: background 0.2s;
    cursor: pointer;
  }

  .doc-download:hover:not(:disabled) {
    background: #eef2ff;
    border-color: #818cf8;
  }

  .doc-download:disabled {
    opacity: 0.5;
    cursor: wait;
  }

  .download-error {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    color: #be123c;
    padding: 0.7rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.82rem;
  }

  .public-tag {
    display: inline-block;
    margin-left: 6px;
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #bbf7d0;
    padding: 1px 7px;
    border-radius: 5px;
    font-size: 0.68rem;
    font-weight: 700;
  }

  .private-tag {
    display: inline-block;
    margin-left: 6px;
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
    padding: 1px 7px;
    border-radius: 5px;
    font-size: 0.68rem;
    font-weight: 700;
  }

  .doc-icon {
    font-size: 2rem;
  }

  .doc-info {
    flex: 1;
  }

  .doc-info h3 {
    color: #1a1a2e;
    margin-bottom: 0.25rem;
  }

  .doc-meta {
    color: #666;
    font-size: 0.85rem;
  }

  .doc-arrow {
    font-size: 1.5rem;
    color: #ccc;
  }
</style>
