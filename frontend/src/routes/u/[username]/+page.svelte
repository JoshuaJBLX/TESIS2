<script lang="ts">
  import { api } from '$lib/api';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let profile = $state<any>(null);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    const username = $page.params.username;
    if (!username) { error = 'Usuario no encontrado'; loading = false; return; }
    const result = await api.getPublicProfile(username);
    if (result.success && result.data) {
      profile = result.data;
    } else {
      error = result.error || 'Perfil no encontrado';
    }
    loading = false;
  });

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function ext(name: string) {
    return name.includes('.') ? name.split('.').pop()!.toUpperCase() : 'DOC';
  }
</script>

<svelte:head><title>{profile?.user?.username || 'Perfil'} · DocuTrust</title></svelte:head>

<div class="page">
  {#if loading}
    <div class="state">
      <div class="spinner"></div>
      <p>Cargando perfil...</p>
    </div>
  {:else if error}
    <div class="state"><h2>{error}</h2><a href="/">Volver al inicio</a></div>
  {:else if profile}
    <section class="banner anim-rise">
      <div class="banner-top">
        <div class="avatar anim-pop">{(profile.user.full_name || profile.user.username || 'U').charAt(0).toUpperCase()}</div>
        <div class="ident">
          <span class="eyebrow">Perfil público</span>
          <h1>{profile.user.full_name || profile.user.username}</h1>
          <div class="username-row">
            <span class="username">@{profile.user.username}</span>
            <span class="role-pill">{profile.user.role === 'admin' ? 'Administrador' : 'Usuario verificado'}</span>
          </div>
        </div>
      </div>
      <div class="stats stagger">
        <div class="stat"><b>{profile.documents.length}</b><span>documentos públicos</span></div>
        <div class="stat"><b>{formatDate(profile.user.created_at)}</b><span>miembro desde</span></div>
        <div class="stat"><b>RSA-2048</b><span>claves activas</span></div>
      </div>
    </section>

    <section class="docs-section anim-rise d2">
      <div class="section-head">
        <h2>Documentos públicos</h2>
        <span class="count">{profile.documents.length} {profile.documents.length === 1 ? 'documento' : 'documentos'}</span>
      </div>

      {#if profile.documents.length === 0}
        <div class="empty anim-fade">
          <p class="empty-icon">🗂</p>
          <p>Este usuario aún no comparte documentos públicamente.</p>
        </div>
      {:else}
        <div class="doc-grid stagger">
          {#each profile.documents as doc}
            <article class="doc-card">
              <div class="doc-head">
                <span class="file-badge">{ext(doc.latest_file_name)}</span>
                <span class="doc-ver">v{doc.latest_version_number}</span>
              </div>
              <h3>{doc.title}</h3>
              {#if doc.description}<p class="desc">{doc.description}</p>{/if}
              <p class="meta">
                {doc.latest_file_name} · {(doc.latest_file_size / 1024).toFixed(1)} KB
              </p>
              <p class="updated">{formatDate(doc.latest_upload_date)}</p>
              <div class="doc-actions">
                <a class="btn btn-view" href="/v/{doc.id}">Ver →</a>
                <a class="btn btn-download" href={api.downloadDocumentUrl(doc.id)} download>⭳ Descargar</a>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .page { max-width: 940px; margin: 0 auto; padding: 0 0 45px; }
  .state { display: grid; place-items: center; gap: 14px; padding: 90px 0; color: #64748b; text-align: center; }
  .state h2 { color: #17213a; margin-bottom: 10px; }
  .state a { color: #4f46e5; }
  .spinner { width: 34px; height: 34px; border: 3px solid #c7d2fe; border-top-color: #4f46e5; border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .banner { background: linear-gradient(150deg, #101b3d 0%, #2a2a6e 55%, #4f46e5 130%); border-radius: 18px; padding: 30px 30px 26px; color: #fff; box-shadow: 0 16px 40px rgba(16,27,61,.28); }
  .banner-top { display: flex; align-items: center; gap: 22px; }
  .avatar { width: 78px; height: 78px; border-radius: 50%; background: linear-gradient(135deg, #818cf8, #4f46e5); border: 3px solid rgba(255,255,255,.35); display: grid; place-items: center; font-size: 2.2rem; font-weight: 800; flex-shrink: 0; }
  .eyebrow { font-size: .66rem; color: #a5b4fc; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  .ident h1 { font-size: clamp(1.5rem, 4vw, 2.2rem); letter-spacing: -.035em; margin: 6px 0 8px; color: #fff; }
  .username-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .username { color: #c7d2fe; font-size: .88rem; }
  .role-pill { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22); color: #e0e7ff; font-size: .68rem; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 26px; }
  .stat { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 13px 15px; display: grid; gap: 3px; }
  .stat b { font-size: 1rem; color: #fff; font-weight: 800; }
  .stat span { font-size: .68rem; color: #aab5d0; }
  .docs-section { margin-top: 30px; }
  .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
  .section-head h2 { color: #17213a; font-size: 1.2rem; }
  .count { color: #64748b; background: #fff; padding: 7px 10px; border: 1px solid #e1e7f0; border-radius: 7px; font-size: .7rem; }
  .doc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }
  .doc-card { background: #fff; border: 1px solid #e1e7f0; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 5px; box-shadow: 0 1px 3px rgba(30,41,59,.05); transition: .18s; }
  .doc-card:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(30,41,59,.12); border-color: #c7d2fe; }
  .doc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .file-badge { background: #eef2ff; color: #4338ca; font-size: .66rem; font-weight: 900; letter-spacing: .05em; padding: 5px 9px; border-radius: 7px; }
  .doc-ver { color: #94a3b8; font-size: .72rem; font-weight: 700; }
  .doc-card h3 { color: #1a1a2e; font-size: 1rem; margin: 0; }
  .doc-card .desc { color: #64748b; font-size: .8rem; margin: 0; flex: 1; }
  .doc-card .meta, .doc-card .updated { color: #94a3b8; font-size: .72rem; margin: 0; }
  .doc-actions { display: flex; gap: 8px; margin-top: 14px; }
  .btn { text-decoration: none; padding: 8px 12px; border-radius: 9px; font-size: .76rem; font-weight: 800; flex: 1; text-align: center; }
  .btn-view { background: #4f46e5; color: #fff; }
  .btn-view:hover { background: #4338ca; }
  .btn-download { background: #fff; color: #4f46e5; border: 1px solid #c7d2fe; }
  .btn-download:hover { background: #eef2ff; }
  .empty { background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 44px; text-align: center; color: #64748b; display: grid; gap: 6px; justify-items: center; }
  .empty-icon { font-size: 1.8rem; margin: 0; }
  @media (max-width: 600px) {
    .banner { padding: 22px 20px; }
    .banner-top { flex-direction: column; text-align: center; }
    .username-row { justify-content: center; }
    .stats { grid-template-columns: 1fr; }
    .section-head { flex-direction: column; align-items: flex-start; gap: 8px; }
  }
.avatar {
    transition: transform 0.25s cubic-bezier(0.22, 0.9, 0.34, 1);
  }
  .banner:hover .avatar {
    transform: scale(1.06);
  }
  .stat {
    transition: transform 0.18s, background 0.18s;
  }
  .stat:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.12);
  }
  .btn {
    transition: background 0.18s, transform 0.18s, border-color 0.18s,
      color 0.18s;
  }
  .btn:active {
    transform: scale(0.97);
  }
</style>