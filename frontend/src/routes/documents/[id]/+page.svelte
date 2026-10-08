<script lang="ts">
  import { api } from '$lib/api';
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let document = $state<any>(null);
  let versions = $state<any[]>([]);
  let proposals = $state<any[]>([]);
  let loading = $state(true);

  let showUpdate = $state(false);
  let updateFile = $state<File | null>(null);
  let updateChangeDesc = $state('');
  let updatePassword = $state('');
  let updating = $state(false);
  let updateError = $state('');
  let updateSuccess = $state<any>(null);

  let toggling = $state(false);
  let copied = $state(false);
  let downloading = $state('');
  let downloadError = $state('');
  let shareQr = $state('');
  let shareUrl = $state('');
  let loadingQr = $state(false);
  let shareMode = $state<'all' | 'latest' | 'explicit'>('all');
  let togglingShare = $state(false);
  let shareError = $state('');

  let graph = $state<{
    width: number;
    height: number;
    versionY: Record<string, number>;
    proposalY: Record<string, number>;
    spine: { y1: number; y2: number }[];
    pLinks: { x1: number; y1: number; y2: number }[];
  }>({ width: 760, height: 80, versionY: {}, proposalY: {}, spine: [], pLinks: [] });

  let baseOpts = $state<any[]>([]);
  let targetOpts = $state<any[]>([]);
  let baseSel = $state('');
  let targetSel = $state('');
  let compareResult = $state<any>(null);
  let compareError = $state('');
  let comparing = $state(false);

  let acceptingProposalId = $state('');
  let acceptPassword = $state('');
  let acceptError = $state('');
  let accepting = $state(false);
  let busyProposal = $state('');

  onMount(() => {
    auth.init();
    if (!$auth.isAuthenticated) {
      goto('/login');
      return;
    }
    const id = $page.params.id;
    if (id) loadDocument(id);
  });

  async function loadDocument(id: string) {
    loading = true;
    const d = await api.getDocument(id);
    if (d.success) document = d.data;
    shareMode = (d.data as any)?.share_mode || 'all';
    const v = await api.getDocumentVersions(id);
    if (v.success) versions = v.data || [];
    const p = await api.getDocumentProposals(id);
    if (p.success) proposals = p.data || [];
    buildGraph();
    buildOptions();
    if (document?.is_public) {
      await loadShareQr(id);
    }
    loading = false;
  }

  function buildGraph() {
    const sorted = [...versions].sort((a, b) => a.version_number - b.version_number);
    const VX = 95;
    const PX = 430;
    const STEP = 86;
    const yStart = 60;
    const versionY: Record<string, number> = {};
    const spine: { y1: number; y2: number }[] = [];
    sorted.forEach((v, i) => {
      versionY[v.id] = yStart + i * STEP;
      if (i > 0) spine.push({ y1: versionY[sorted[i - 1].id], y2: versionY[v.id] });
    });
    const baseVersionByNumber: Record<number, any> = {};
    sorted.forEach((v) => {
      baseVersionByNumber[v.version_number] = v;
    });
    const byBase: Record<number, any[]> = {};
    proposals.forEach((p) => {
      const bn = p.base_version_number || 1;
      (byBase[bn] ||= []).push(p);
    });
    const proposalY: Record<string, number> = {};
    const pLinks: { x1: number; y1: number; y2: number }[] = [];
    let maxY = yStart + Math.max(0, sorted.length - 1) * STEP;
    Object.entries(byBase).forEach(([bnStr, list]) => {
      const baseVer = baseVersionByNumber[Number(bnStr)];
      const baseY = baseVer ? versionY[baseVer.id] : yStart;
      list.forEach((p, k) => {
        const y = baseY + (k + 1) * 36;
        proposalY[p.id] = y;
        pLinks.push({ x1: VX, y1: baseY, y2: y });
        maxY = Math.max(maxY, y);
      });
    });
    graph = { width: 780, height: Math.max(maxY + 76, 140), versionY, proposalY, spine, pLinks };
  }

  function buildOptions() {
    const vOpts = [...versions]
      .sort((a, b) => a.version_number - b.version_number)
      .map((v) => ({
        key: `version:${v.id}`,
        group: 'Versión oficial',
        label: `v${v.version_number} — ${v.file_name}`
      }));
    const pOpts = proposals.map((p) => ({
      key: `proposal:${p.id}`,
      group: 'Propuesta',
      label: `@${p.proposed_by_username} — ${p.change_description?.slice(0, 34) || 'sin descripción'}`
    }));
    baseOpts = [...vOpts, ...pOpts];
    targetOpts = [...vOpts, ...pOpts];
    if (vOpts.length > 0) {
      baseSel = vOpts[vOpts.length - 1].key;
      const pending = pOpts.find((o) => o.key.startsWith('proposal:'));
      targetSel = pending ? pending.key : vOpts[0].key;
    }
  }

  async function toggleVisibility() {
    const id = $page.params.id;
    if (!id || !document) return;
    toggling = true;
    const r = await api.setDocumentVisibility(id, !document.is_public);
    if (r.success && r.data) {
      document = { ...document, is_public: r.data.isPublic ? 1 : 0 };
      if (document.is_public) {
        await loadShareQr(id);
      } else {
        shareQr = '';
        shareUrl = '';
      }
    }
    toggling = false;
  }

  async function loadShareQr(id: string) {
    loadingQr = true;
    const r = await api.getDocumentShareQr(id);
    if (r.success && r.data) {
      shareQr = r.data.qrCode;
      shareUrl = r.data.shareUrl;
    }
    loadingQr = false;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${$page.url.origin}/v/${$page.params.id}`);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      copied = false;
    }
  }

  async function changeShareMode(mode: 'all' | 'latest' | 'explicit') {
    const id = $page.params.id;
    if (!id || !document) return;
    togglingShare = true;
    shareError = '';
    const r = await api.setDocumentSharing(id, mode);
    if (r.success && document) {
      shareMode = mode;
      document = { ...document, share_mode: mode };
    } else {
      shareError = r.error || 'No se pudo actualizar la compartición';
    }
    togglingShare = false;
  }

  async function toggleVersionPublic(version: any) {
    const id = $page.params.id;
    if (!id || !document || togglingShare) return;
    const idx = versions.findIndex((v) => v.id === version.id);
    if (idx === -1) return;
    const next = versions[idx].is_public === 1 ? 0 : 1;
    const publicIds = versions
      .map((v, i) => ({ v, i }))
      .filter(({ v, i }) => (i === idx ? next === 1 : Number(v.is_public) === 1))
      .map(({ v }) => v.id);
    togglingShare = true;
    shareError = '';
    const r = await api.setDocumentSharing(id, 'explicit', publicIds);
    if (r.success && document) {
      shareMode = 'explicit';
      document = { ...document, share_mode: 'explicit' };
      versions[idx] = { ...versions[idx], is_public: next };
    } else {
      shareError = r.error || 'No se pudo actualizar la versión';
    }
    togglingShare = false;
  }

  async function handleDownload(kind: 'doc' | 'proposal', id: string, versionId?: string) {
    downloading = `${kind}:${id}`;
    downloadError = '';
    const r = kind === 'doc' ? await api.downloadDocument(document.id, versionId) : await api.downloadProposal(document.id, id);
    if (!r.ok) downloadError = r.error || 'No se pudo descargar';
    downloading = '';
  }

  function choose(e: Event) {
    updateFile = (e.target as HTMLInputElement).files?.[0] || null;
  }

  async function submit(e: Event) {
    e.preventDefault();
    const id = $page.params.id;
    if (!id || !updateFile || !updatePassword) return;
    updating = true;
    updateError = '';
    const r = await api.updateDocument(id, updateFile, updateChangeDesc, updatePassword);
    if (r.success) {
      updateSuccess = r.data;
      showUpdate = false;
      updateFile = null;
      updateChangeDesc = '';
      updatePassword = '';
      await loadDocument(id);
    } else {
      updateError = r.error || 'No se pudo crear la versión';
    }
    updating = false;
  }

  async function doCompare(e: Event) {
    e.preventDefault();
    const id = $page.params.id;
    if (!id || !baseSel || !targetSel) return;
    comparing = true;
    compareError = '';
    compareResult = null;
    const [st, si] = baseSel.split(':');
    const [tt, ti] = targetSel.split(':');
    const r = await api.compareArtifacts(id, st as 'version' | 'proposal', si, tt as 'version' | 'proposal', ti);
    if (r.success) {
      compareResult = r.data;
    } else {
      compareError = r.error || 'No se pudo realizar la comparación';
    }
    comparing = false;
  }

  async function acceptProposal(proposalId: string) {
    const id = $page.params.id;
    if (!id || !acceptPassword) return;
    accepting = true;
    acceptError = '';
    busyProposal = proposalId;
    const r = await api.acceptProposal(id, proposalId, acceptPassword);
    if (r.success) {
      acceptingProposalId = '';
      acceptPassword = '';
      await loadDocument(id);
    } else {
      acceptError = r.error || 'No se pudo aceptar la propuesta';
    }
    accepting = false;
    busyProposal = '';
  }

  async function rejectProposal(proposalId: string) {
    const id = $page.params.id;
    const p = proposals.find((x) => x.id === proposalId);
    if (!id || !p) return;
    if (!confirm(`¿Rechazar la propuesta de @${p.proposed_by_username}?`)) return;
    busyProposal = proposalId;
    const r = await api.rejectProposal(id, proposalId);
    if (r.success) {
      await loadDocument(id);
    }
    busyProposal = '';
  }

  function statusColor(status: string) {
    return status === 'accepted' ? '#059669' : status === 'rejected' ? '#dc2626' : '#d97706';
  }
  function statusLabel(status: string) {
    return status === 'accepted' ? 'Aceptada' : status === 'rejected' ? 'Rechazada' : 'Pendiente';
  }
  const date = (v: string) => new Date(v).toLocaleString('es-PE');
  const hash = (v: string) => v.slice(0, 20);
  const short = (v: string, n = 34) => (v && v.length > n ? v.slice(0, n) + '…' : v || '');
</script>

<svelte:head><title>{document?.title || 'Documento'} · DocuTrust</title></svelte:head>

<div class="page">
  {#if loading}
    <div class="state">
      <div class="spinner"></div>
      <p>Cargando documento...</p>
    </div>
  {:else if !document}
    <div class="state"><h2>Documento no encontrado</h2><a href="/documents">Volver a documentos</a></div>
  {:else}
    <a class="back" href="/documents">← Mis documentos</a>

    <section class="header anim-rise">
      <div class="header-main">
        <span class="eyebrow">Documento protegido</span>
        <h1>{document.title}</h1>
        {#if document.description}<p class="sub">{document.description}</p>{/if}
        <div class="chips">
          <span class="chip-owner">Propietario: <b>{document.owner_username}</b></span>
          <span class="chip-ver">Versión actual <b>v{document.latestVersion?.version_number || 0}</b></span>
          <span class:chip-public={document.is_public} class:chip-private={!document.is_public}>
            {document.is_public ? 'Público' : 'Privado'}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn ghost action-download" onclick={() => handleDownload('doc', document.id)} disabled={downloading === 'doc:' + document.id}>
          {downloading === 'doc:' + document.id ? 'Descargando…' : 'Descargar'}
        </button>
        <button class="btn ghost" onclick={toggleVisibility} disabled={toggling}>
          {document.is_public ? 'Dejar de compartir' : 'Compartir'}
        </button>
        <button class="btn primary action-new" onclick={() => (showUpdate = !showUpdate)}>
          <span>{showUpdate ? 'Cerrar' : 'Nueva versión'}</span><b>+</b>
        </button>
      </div>
    </section>

    {#if document.is_public}
      <section class="share-bar anim-slide">
        <div class="share-state"><span class="dot ok"></span> Documento público</div>
        <code class="share-link">{$page.url.origin}/v/{document.id}</code>
        <button class="btn ghost tiny" onclick={copyLink}>{copied ? '¡Copiado!' : 'Copiar enlace'}</button>
        {#if loadingQr}
          <div class="qr-loading">Cargando QR...</div>
        {:else if shareQr}
          <div class="qr-container">
            <img src={shareQr} alt="Código QR del documento" class="qr-image" />
            <span class="qr-label">Escanea para ver</span>
          </div>
        {/if}
      </section>
    {/if}

    <section class="panel sharing-panel anim-slide">
      <div class="sharing-head">
        <div>
          <span class="eyebrow">Compartición de versiones</span>
          <h2>¿Qué versiones se comparten?</h2>
          <p class="hint">
            {document.is_public
              ? 'Controla qué versiones pueden ver y descargar las personas con el enlace público. Las versiones que no compartas dejarán de estar disponibles incluso con un enlace directo que ya exista.'
              : 'Este documento aún no está compartido. Activa «Compartir» para aplicar estos ajustes a la vista pública.'}
          </p>
        </div>
      </div>

      {#if shareError}<div class="alert">{shareError}</div>{/if}

      <div class="share-modes">
        <button class="mode-pill" class:active={shareMode === 'all'} disabled={togglingShare} onclick={() => changeShareMode('all')}>
          <b>Todas</b><small>Todo el historial es visible</small>
        </button>
        <button class="mode-pill" class:active={shareMode === 'latest'} disabled={togglingShare} onclick={() => changeShareMode('latest')}>
          <b>Solo la última</b><small>Únicamente la versión actual</small>
        </button>
        <button class="mode-pill" class:active={shareMode === 'explicit'} disabled={togglingShare} onclick={() => changeShareMode('explicit')}>
          <b>Seleccionadas</b><small>Tú eliges cada versión</small>
        </button>
      </div>

      {#if shareMode === 'explicit'}
        <div class="sel-list">
          <p class="sel-hint">Marca las versiones compartidas. Las desmarcadas dejan de responder en el enlace {`/v/${document.id}/v{numero}`}.</p>
          {#if versions.length === 0}
            <div class="empty-card anim-fade"><p>Todavía no hay versiones.</p></div>
          {:else}
            {#each versions as ver (ver.id)}
              <label class="sel-row">
                <input type="checkbox" checked={Number(ver.is_public) === 1} onchange={() => toggleVersionPublic(ver)} disabled={togglingShare} />
                <span class="sel-name"><b>v{ver.version_number}</b> · {short(ver.change_description, 46) || ver.file_name}</span>
                <span class="sel-state" class:on={Number(ver.is_public) === 1}>{Number(ver.is_public) === 1 ? 'Compartida' : 'Oculta'}</span>
              </label>
            {/each}
          {/if}
        </div>
      {/if}
    </section>

    {#if updateSuccess}
      <div class="success anim-slide">✓ Nueva versión v{updateSuccess.versionNumber} creada y firmada.</div>
    {/if}
    {#if downloadError}
      <div class="alert global-alert anim-shake">{downloadError}</div>
    {/if}

    {#if showUpdate}
      <section class="panel anim-slide">
        <span class="eyebrow">Actualizar documento</span>
        <h2>Crear nueva versión</h2>
        <p class="hint">La versión anterior se conserva en el historial y en la cadena de auditoría.</p>
        {#if updateError}<div class="alert anim-shake">{updateError}</div>{/if}
        <form onsubmit={submit}>
          <label class="file">
            <span>{updateFile ? '✓ ' + updateFile.name : 'Selecciona el nuevo archivo'}</span>
            <small>{updateFile ? updateFile.name : 'PDF, Word o texto — máximo 10 MB'}</small>
            <input type="file" onchange={choose} required disabled={updating} />
          </label>
          <label>
            Descripción del cambio
            <textarea bind:value={updateChangeDesc} placeholder="Ej. Ajuste de la cláusula 4.2" disabled={updating}></textarea>
          </label>
          <label>
            Contraseña para firmar
            <input type="password" bind:value={updatePassword} placeholder="Tu contraseña" required disabled={updating} />
          </label>
          <button class="btn primary" disabled={updating || !updateFile || !updatePassword}>
            {updating ? 'Firmando...' : 'Crear y firmar versión →'}
          </button>
        </form>
      </section>
    {/if}

    <div class="section-head">
      <div><span class="eyebrow">Colaboración</span><h2>Propuestas de cambio</h2></div>
      <span class="count">{proposals.length} propuestas</span>
    </div>

    {#if proposals.length === 0}
      <div class="empty-card anim-fade">
        <p class="empty-icon">&#9998;</p>
        <p>Aún no hay propuestas. Comparte el documento para que otros usuarios propongan mejoras.</p>
      </div>
    {:else}
      {#if acceptingProposalId && acceptError}
        <div class="alert global-alert anim-shake">{acceptError}</div>
      {/if}
      <section class="proposals stagger">
        {#each proposals as p}
          <article class="proposal-card">
            <div class="proposal-top">
              <div class="status-pill" style="--sc:{statusColor(p.status)}">
                <span class="status-dot"></span>
                {statusLabel(p.status)}
              </div>
              <span class="proposal-author">por <b>@{p.proposed_by_username}</b></span>
              <span class="date">{date(p.created_at)}</span>
            </div>
            <p class="proposal-base">Basada en <b>v{p.base_version_number}</b> · {p.file_name} · {(p.file_size / 1024).toFixed(1)} KB</p>
            <blockquote class="proposal-desc">"{p.change_description}"</blockquote>
            {#if p.reviewed_by_username}
              <p class="reviewed">Revisada por @{p.reviewed_by_username} el {date(p.reviewed_at)}</p>
            {/if}
            <div class="proposal-actions">
              <button
                class="btn ghost"
                onclick={() => handleDownload('proposal', p.id)}
                disabled={downloading === 'proposal:' + p.id}
              >
                {downloading === 'proposal:' + p.id ? 'Descargando…' : '⭳ Descargar propuesta'}
              </button>
              {#if p.status === 'pending'}
                <span class="actions-sep"></span>
                <button class="btn ghost danger" onclick={() => rejectProposal(p.id)} disabled={busyProposal === p.id}>
                  Rechazar
                </button>
                {#if acceptingProposalId === p.id}
                  <form class="accept-form" onsubmit={(ev) => { ev.preventDefault(); acceptProposal(p.id); }}>
                    <input type="password" bind:value={acceptPassword} placeholder="Contraseña para firmar" required disabled={accepting} />
                    <button class="btn primary small" disabled={accepting || !acceptPassword}>{accepting ? 'Firmando…' : 'Aceptar'}</button>
                    <button type="button" class="btn ghost" onclick={() => { acceptingProposalId = ''; acceptPassword = ''; acceptError = ''; }}>Cancelar</button>
                  </form>
                {:else}
                  <button class="btn primary small" onclick={() => { acceptingProposalId = p.id; acceptError = ''; }}>Aceptar</button>
                {/if}
              {/if}
            </div>
          </article>
        {/each}
      </section>
    {/if}

    <div class="section-head">
      <div><span class="eyebrow">Visualización</span><h2>Red de versiones y propuestas</h2></div>
    </div>
    <section class="graph-card anim-fade d1">
      <div class="graph-scroll">
        <svg width={graph.width} height={graph.height} viewBox="0 0 {graph.width} {graph.height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="vgrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#8b5cf6" />
              <stop offset="100%" stop-color="#6d5cff" />
            </linearGradient>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
          </defs>

          {#each graph.spine as s}
            <line x1="95" y1={s.y1} x2="95" y2={s.y2} stroke="#c7d2fe" stroke-width="3" />
            <line x1="95" y1={s.y1} x2="95" y2={s.y2} stroke="#6d5cff" stroke-width="1.5" stroke-dasharray="2,6" stroke-linecap="round" />
          {/each}
          {#each graph.pLinks as l}
            <line x1={l.x1} y1={l.y1} x2="430" y2={l.y2} stroke="#cbd5e1" stroke-width="1.6" stroke-dasharray="5,4" marker-end="url(#arrow)" />
          {/each}

          {#each versions as v}
            {@const vy = graph.versionY[v.id] ?? 0}
            {#if vy}
              <circle cx="95" cy={vy} r="20" fill="url(#vgrad)" stroke="#fff" stroke-width="3">
                <title>Versión v{v.version_number} — {v.file_name}</title>
              </circle>
              <text x="95" y={vy} text-anchor="middle" fill="#fff" font-size="11" font-weight="800" dominant-baseline="central">v{v.version_number}</text>
              <text x="125" y={vy - 5} fill="#334155" font-size="10.5" font-weight="700">{short(v.file_name, 24)}</text>
              <text x="125" y={vy + 9} fill="#94a3b8" font-size="9">{date(v.upload_date)} · {v.signer_username}{v.coauthor_username ? ' + ' + v.coauthor_username : ''}</text>
            {/if}
          {/each}

          {#each proposals as p}
            {@const py = graph.proposalY[p.id]}
            {#if py}
              <circle cx="430" cy={py} r="12" fill={statusColor(p.status)} stroke="#fff" stroke-width="3">
                <title>Propuesta de @{p.proposed_by_username} ({statusLabel(p.status)})</title>
              </circle>
              <text x="430" y={py} text-anchor="middle" fill="#fff" font-size="9" font-weight="800" dominant-baseline="central">P</text>
              <text x="452" y={py - 5} fill="#334155" font-size="10.5" font-weight="700">@{p.proposed_by_username} — {statusLabel(p.status)}</text>
              <text x="452" y={py + 9} fill="#94a3b8" font-size="9">{short(p.change_description, 44)}</text>
            {/if}
          {/each}
        </svg>
      </div>
      <div class="legend">
        <span class="lg-item"><i class="dot lg v"></i> Versión oficial</span>
        <span class="lg-item"><i class="dot lg pa"></i> Propuesta pendiente</span>
        <span class="lg-item"><i class="dot lg ac"></i> Propuesta aceptada</span>
        <span class="lg-item"><i class="dot lg rj"></i> Propuesta rechazada</span>
      </div>
    </section>

    <div class="section-head">
      <div><span class="eyebrow">Análisis</span><h2>Comparador de versiones</h2></div>
    </div>
    <section class="panel">
      <p class="hint">Compara dos elementos (versión oficial o propuesta) y observa exactamente qué cambió entre uno y otro.</p>
      <form class="compare-form" onsubmit={doCompare}>
        <label class="select-field">
          <span class="select-label">Base (antes)</span>
          <select bind:value={baseSel}>
            {#each baseOpts as o}<option value={o.key}>{o.label}</option>{/each}
          </select>
        </label>
        <label class="select-field">
          <span class="select-label">Objetivo (después)</span>
          <select bind:value={targetSel}>
            {#each targetOpts as o}<option value={o.key}>{o.label}</option>{/each}
          </select>
          <button type="button" class="swap" title="Intercambiar base y objetivo" onclick={() => { const t = baseSel; baseSel = targetSel; targetSel = t; }}>⇄</button>
        </label>
        <button class="btn primary compare-btn" disabled={comparing || !baseSel || !targetSel}>
          {comparing ? 'Comparando…' : 'Comparar'}
        </button>
      </form>

      {#if compareError}<div class="alert">{compareError}</div>{/if}

      {#if compareResult}
        {#if compareResult.supported === false}
          <div class="empty-card anim-fade">{compareResult.note || 'La comparación textual no está soportada para estos formatos.'}</div>
        {:else}
          <div class="comp-summary anim-pop">
            <span class="chip add">+{compareResult.summary.additions} líneas</span>
            <span class="chip del">−{compareResult.summary.deletions} líneas</span>
            {#if compareResult.summary.unchanged}<span class="chip eq">{compareResult.summary.unchanged} iguales</span>{/if}
            {#if compareResult.mode}<span class="chip mode">{compareResult.mode}</span>{/if}
            <span class="comp-pair">{compareResult.base.label} → {compareResult.target.label}</span>
          </div>

          {#if compareResult.metadata.length > 0}
            <div class="meta-grid">
              {#each compareResult.metadata as m}
                <div class="meta-row">
                  <span class="meta-key">{m.label}</span>
                  <span class="meta-before">{m.before || '—'}</span>
                  <span class="meta-arrow">→</span>
                  <span class="meta-after">{m.after || '—'}</span>
                </div>
              {/each}
            </div>
          {/if}

          <div class="diff anim-fade d1">
            <div class="diff-head"><span class="mark"></span><span>Línea</span></div>
            {#each compareResult.lineDiffs.slice(0, 300) as d}
              <div class="diff-line {d.type}">
                <span class="mark">{d.type === 'insert' ? '+' : d.type === 'delete' ? '−' : ' '}</span>
                <span>{d.text || ' '}</span>
              </div>
            {/each}
            {#if compareResult.lineDiffs.length > 300}
              <p class="more">… mostrando las primeras 300 de {compareResult.lineDiffs.length} líneas</p>
            {/if}
          </div>
        {/if}
      {/if}
    </section>

    <div class="section-head">
      <div><span class="eyebrow">Trazabilidad</span><h2>Historial de versiones</h2></div>
      <span class="count">{versions.length} versiones</span>
    </div>
    <section class="versions stagger">
      {#each versions as ver}
        <article class="version-card">
          <div class="version-top">
            <span class="version">v{ver.version_number}</span>
            <span class="date">{date(ver.upload_date)}</span>
            <a class="vlink" href="/v/{document.id}/v{ver.version_number}" title="Enlace público de la versión {ver.version_number}">Abrir ↗</a>
          </div>
          <h3>{ver.file_name}</h3>
          <div class="version-meta">
            <span class="signer"><i class="dot ok"></i>{ver.signer_username}{ver.coauthor_username ? ' + ' + ver.coauthor_username : ''}</span>
            <span>{(ver.file_size / 1024).toFixed(1)} KB</span>
          </div>
          {#if ver.coauthor_username}
            <p class="coauthor">En coautoría con {ver.coauthor_username}</p>
          {/if}
          {#if ver.change_description}<p class="change">{ver.change_description}</p>{/if}
          <div class="hash">
            <div class="hash-info">
              <small>HASH SHA-256</small>
              <code>{hash(ver.content_hash)}</code>
            </div>
            <span class="valid">✓ Firma válida</span>
            <button class="btn ghost tiny" onclick={() => handleDownload('doc', ver.id, ver.id)} disabled={downloading === 'doc:' + ver.id}>
              {downloading === 'doc:' + ver.id ? '…' : '⭳ Descargar'}
            </button>
          </div>
        </article>
      {/each}
    </section>
  {/if}
</div>

<style>
  .page { max-width: 960px; margin: auto; padding: 5px 0 35px; }
  .back { display: inline-flex; align-items: center; gap: 6px; color: var(--dt-pri); text-decoration: none; font-size: .8rem; font-weight: 750; margin-bottom: 16px; transition: gap .16s; }
  .back:hover { gap: 10px; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; padding: 26px; background: #fff; border: 1px solid var(--dt-line); border-radius: 22px; flex-wrap: wrap; box-shadow: var(--dt-shadow); position: relative; overflow: hidden; }
  .header::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 4px; background: var(--dt-grad-hot); }
  .eyebrow { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; background: #fff; color: var(--dt-pri); font-size: .66rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; border: 1px solid var(--dt-line2); box-shadow: 0 6px 18px -8px rgba(109, 92, 255, .35); }
  .eyebrow::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--dt-grad); box-shadow: 0 0 0 4px rgba(139, 92, 246, .16); animation: dtPulse 2.4s ease-out infinite; }
  .header h1 { font-size: clamp(1.6rem, 4vw, 2.5rem); letter-spacing: -.045em; color: var(--dt-ink); margin: 10px 0; }
  .header .sub { color: var(--dt-body); font-size: .84rem; }
  .chips { display: flex; gap: 8px; margin-top: 15px; flex-wrap: wrap; }
  .chips span { font-size: .73rem; color: var(--dt-body); background: #f4f7fb; border: 1px solid var(--dt-line); padding: 6px 12px; border-radius: 999px; }
  .chips b { color: #334155; }
  .chip-public { background: var(--dt-ok-bg) !important; border-color: var(--dt-ok-line) !important; color: #047857 !important; font-weight: 700; }
  .chip-private { background: #f1f5f9 !important; color: #475569 !important; font-weight: 700; }
  .header-actions { display: flex; gap: 9px; flex-wrap: wrap; align-items: center; }
  .btn { border: 0; border-radius: 12px; padding: 11px 15px; font-weight: 800; cursor: pointer; white-space: nowrap; text-decoration: none; font-size: .8rem; display: inline-block; font-family: inherit; transition: transform .16s, background .16s, border-color .16s, box-shadow .16s; }
  .btn:active:not(:disabled) { transform: scale(.97); }
  .btn.primary { background: var(--dt-grad); color: #fff; box-shadow: var(--dt-glow-sm); }
  .btn.primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--dt-glow); filter: brightness(1.04); }
  .btn.primary:disabled { background: #c6cbdd; cursor: not-allowed; box-shadow: none; }
  .btn.primary.small { padding: 8px 13px; font-size: .74rem; }
  .action-new { display: flex; align-items: center; gap: 7px; }
  .action-new b { font-size: 1.05rem; line-height: 1; }
  .btn.ghost { background: #fff; color: var(--dt-pri); border: 1px solid var(--dt-line2); }
  .btn.ghost:hover:not(:disabled) { border-color: var(--dt-pri); background: #f6f5ff; transform: translateY(-2px); }
  .btn.ghost:disabled { opacity: .55; cursor: not-allowed; }
  .btn.ghost.danger { color: #be123c; border-color: var(--dt-err-line); }
  .btn.ghost.danger:hover:not(:disabled) { background: var(--dt-err-bg); }
  .btn.ghost.tiny { padding: 6px 11px; font-size: .68rem; }
  .share-bar { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding: 12px 16px; background: linear-gradient(120deg, var(--dt-ok-bg), #f0fdf9); border: 1px solid var(--dt-ok-line); border-radius: 14px; font-size: .8rem; flex-wrap: wrap; box-shadow: var(--dt-shadow); }
  .share-state { display: flex; align-items: center; gap: 7px; color: #047857; font-weight: 800; }
  .share-link { color: #065f46; background: #fff; padding: 7px 11px; border-radius: 9px; font-size: .74rem; flex: 1; min-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 1px solid var(--dt-ok-line); }
  .qr-container { display: flex; flex-direction: column; align-items: center; gap: 4px; background: #fff; padding: 9px; border-radius: 12px; border: 1px solid var(--dt-ok-line); box-shadow: 0 8px 20px -10px rgba(5, 150, 105, .35); }
  .qr-image { width: 84px; height: 84px; border-radius: 7px; }
  .qr-label { font-size: .62rem; color: #047857; font-weight: 700; }
  .qr-loading { font-size: .72rem; color: #047857; font-weight: 600; padding: 9px 13px; background: #fff; border-radius: 9px; border: 1px solid var(--dt-ok-line); }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .dot.ok { background: #059669; }
  .success { margin-top: 15px; padding: 13px 16px; background: var(--dt-ok-bg); color: #047857; border: 1px solid var(--dt-ok-line); border-radius: 12px; font-size: .8rem; font-weight: 700; }
  .panel { position: relative; margin-top: 17px; padding: 23px; background: #fff; border: 1px solid var(--dt-line); border-radius: 20px; box-shadow: var(--dt-shadow); overflow: hidden; }
  .panel::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 4px; background: var(--dt-grad-hot); }
  .panel h2, .section-head h2 { color: var(--dt-ink); font-size: 1.15rem; margin: 10px 0 4px; }
  .hint { color: var(--dt-body); font-size: .78rem; margin-bottom: 17px; }
  .panel form { display: grid; gap: 13px; }
  .panel label { display: grid; gap: 7px; color: #334155; font-size: .75rem; font-weight: 750; }
  .panel input:not([type="file"]), .panel textarea, .panel select { width: 100%; padding: 12px 13px; border: 1px solid var(--dt-line2); border-radius: 12px; background: #fbfcff; color: var(--dt-ink); font-family: inherit; transition: border-color .18s, box-shadow .18s, background .18s; }
  .panel textarea { min-height: 75px; resize: vertical; }
  .panel input:focus, .panel textarea:focus, .panel select:focus { outline: 0; border-color: var(--dt-pri); background: #fff; box-shadow: 0 0 0 4px rgba(109, 92, 255, .14); }
  .file { display: grid; place-items: center; padding: 20px; border: 1.5px dashed var(--dt-line2); border-radius: 14px; background: linear-gradient(160deg, #fbfcff, #f4f1ff); cursor: pointer; text-align: center; transition: .15s; }
  .file:hover { background: #f3f0ff; border-color: var(--dt-pri); }
  .file span { font-size: .85rem; color: var(--dt-ink); }
  .file small { color: var(--dt-mute); font-size: .7rem; }
  .file input { display: none; }
  .alert { padding: 11px 13px; background: var(--dt-err-bg); border: 1px solid var(--dt-err-line); color: #be123c; border-radius: 11px; font-size: .76rem; }
  .global-alert { margin-bottom: 10px; }
  .section-head { display: flex; align-items: end; justify-content: space-between; margin: 27px 0 14px; gap: 10px; flex-wrap: wrap; }
  .section-head .eyebrow { margin-bottom: 6px; }
  .count { color: var(--dt-body); background: #fff; padding: 7px 13px; border: 1px solid var(--dt-line); border-radius: 999px; font-size: .7rem; font-weight: 750; }
  .empty-card { background: #fff; border: 1.5px dashed var(--dt-line2); border-radius: 18px; padding: 30px; text-align: center; color: var(--dt-body); font-size: .84rem; display: grid; gap: 6px; justify-items: center; }
  .empty-icon { font-size: 1.6rem; margin: 0; }
  .proposals { display: grid; gap: 11px; }
  .proposal-card { background: #fff; border: 1px solid var(--dt-line); border-radius: 16px; padding: 17px 18px; box-shadow: var(--dt-shadow); transition: transform .18s, box-shadow .18s, border-color .18s; }
  .proposal-card:hover { transform: translateY(-2px); box-shadow: var(--dt-shadow-lg); border-color: #cdd6f2; }
  .proposal-top { display: flex; align-items: center; gap: 10px; font-size: .78rem; flex-wrap: wrap; }
  .status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--sc); background: color-mix(in srgb, var(--sc) 12%, #fff); border: 1px solid color-mix(in srgb, var(--sc) 30%, #fff); }
  .status-pill .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sc); }
  .proposal-author { color: var(--dt-body); font-size: .76rem; }
  .proposal-author b { color: #334155; }
  .proposal-top .date { margin-left: auto; color: var(--dt-mute); font-size: .7rem; }
  .proposal-base { color: var(--dt-body); font-size: .74rem; margin: 10px 0 7px; }
  .proposal-base b { color: #334155; }
  .proposal-desc { margin: 0 0 4px; padding: 10px 13px; background: #fafbff; border-left: 3px solid var(--dt-pri); border-radius: 8px; color: #47526b; font-size: .8rem; font-style: italic; }
  .reviewed { color: var(--dt-mute); font-size: .7rem; margin: 8px 0 0; }
  .proposal-actions { display: flex; align-items: center; gap: 8px; margin-top: 13px; flex-wrap: wrap; }
  .actions-sep { width: 1px; height: 20px; background: var(--dt-line); }
  .accept-form { display: flex; align-items: center; gap: 8px; margin: 0 !important; flex-wrap: wrap; }
  .accept-form input { flex: 1; min-width: 200px; padding: 9px 11px; border: 1px solid var(--dt-line2); border-radius: 11px; background: #fbfcff; }
  .graph-card { background: #fff; border: 1px solid var(--dt-line); border-radius: 20px; padding: 16px; box-shadow: var(--dt-shadow); position: relative; overflow: hidden; }
  .graph-card::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 4px; background: var(--dt-grad-hot); }
  .graph-scroll { overflow-x: auto; margin-top: 8px; }
  .graph-card svg { display: block; min-width: 620px; }
  .legend { display: flex; gap: 10px; flex-wrap: wrap; padding: 12px 4px 2px; font-size: .72rem; color: var(--dt-body); }
  .lg-item { display: inline-flex; align-items: center; gap: 6px; background: #fafbff; border: 1px solid var(--dt-line); padding: 5px 11px; border-radius: 999px; }
  .lg.v { background: var(--dt-grad); width: 13px; height: 13px; }
  .lg.pa { background: #d97706; }
  .lg.ac { background: #059669; }
  .lg.rj { background: #dc2626; }
  .compare-form { display: grid; grid-template-columns: 1fr 1fr auto; align-items: end; gap: 12px; }
  .select-field { position: relative; }
  .select-label { font-size: .7rem; color: var(--dt-body); font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
  .select-field select { width: 100%; padding: 12px 11px; border: 1px solid var(--dt-line2); border-radius: 12px; background: #fbfcff; color: var(--dt-ink); margin-top: 7px; }
  .swap { position: absolute; right: 10px; bottom: 13px; cursor: pointer; color: var(--dt-pri); font-weight: 900; font-size: 1rem; background: #fff; padding: 2px 6px; border-radius: 7px; border: 1px solid var(--dt-line); }
  .swap:hover { color: var(--dt-pri2); background: #f6f5ff; }
  .compare-btn { align-self: end; }
  .comp-summary { display: flex; gap: 9px; flex-wrap: wrap; align-items: center; margin-top: 16px; }
  .chip { padding: 6px 12px; border-radius: 999px; font-size: .74rem; font-weight: 800; background: #f1f5f9; color: #334155; }
  .chip.add { background: var(--dt-ok-bg); color: #047857; border: 1px solid var(--dt-ok-line); }
  .chip.del { background: var(--dt-err-bg); color: #be123c; border: 1px solid var(--dt-err-line); }
  .chip.eq { background: #f1f5f9; color: #475569; }
  .chip.mode { background: #f3f0ff; color: var(--dt-pri); border: 1px solid #ddd7fa; text-transform: uppercase; font-size: .66rem; }
  .comp-pair { margin-left: auto; font-size: .72rem; color: var(--dt-mute); }
  .meta-grid { display: grid; gap: 6px; margin-top: 14px; }
  .meta-row { display: grid; grid-template-columns: 90px 1fr auto 1fr; gap: 10px; align-items: center; background: #fafbff; border: 1px solid var(--dt-line); border-radius: 10px; padding: 8px 12px; font-size: .73rem; }
  .meta-key { color: var(--dt-mute); font-weight: 700; }
  .meta-before { color: #be123c; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta-after { color: #047857; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta-arrow { color: var(--dt-mute); }
  .diff { margin-top: 14px; border: 1px solid var(--dt-line); border-radius: 12px; overflow: hidden; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .74rem; }
  .diff-head { display: flex; gap: 8px; padding: 7px 10px; background: linear-gradient(180deg, #fafbff, #f2f4fd); border-bottom: 1px solid var(--dt-line); color: var(--dt-mute); font-size: .66rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
  .diff-head .mark { width: 14px; flex-shrink: 0; }
  .diff-line { display: flex; gap: 8px; padding: 3px 10px; white-space: pre-wrap; word-break: break-word; }
  .diff-line .mark { width: 14px; flex-shrink: 0; font-weight: 800; }
  .diff-line.insert { background: var(--dt-ok-bg); color: #065f46; }
  .diff-line.delete { background: var(--dt-err-bg); color: #9f1239; }
  .diff-line.equal { background: #fff; color: var(--dt-body); }
  .more { padding: 10px; text-align: center; color: var(--dt-mute); font-size: .72rem; margin: 0; }
  .versions { display: grid; gap: 11px; }
  .version-card { position: relative; background: #fff; border: 1px solid var(--dt-line); border-radius: 16px; padding: 17px 18px; box-shadow: var(--dt-shadow); transition: transform .18s, box-shadow .18s, border-color .18s; }
  .version-card::before { content: ""; position: absolute; left: 0; top: 16px; bottom: 16px; width: 4px; border-radius: 4px; background: var(--dt-grad); }
  .version-card:hover { transform: translateY(-2px); box-shadow: var(--dt-shadow-lg); border-color: #cdd6f2; }
  .version-top { display: flex; justify-content: space-between; align-items: center; color: var(--dt-mute); font-size: .71rem; gap: 10px; }
  .version { color: #fff; background: var(--dt-grad); padding: 5px 12px; border-radius: 999px; font-weight: 850; font-size: .78rem; box-shadow: var(--dt-glow-sm); }
  .vlink { color: var(--dt-pri); font-weight: 750; font-size: .71rem; text-decoration: none; }
  .vlink:hover { text-decoration: underline; }
  .version-card h3 { font-size: .92rem; color: #334155; margin: 13px 0 6px; }
  .version-meta { display: flex; align-items: center; gap: 12px; color: var(--dt-body); font-size: .74rem; }
  .signer { display: inline-flex; align-items: center; gap: 6px; }
  .coauthor { color: #059669 !important; font-size: .73rem; margin: 7px 0 0; }
  .change { color: var(--dt-pri) !important; font-size: .74rem; margin-top: 7px; }
  .hash { display: flex; align-items: center; gap: 15px; margin-top: 13px; padding-top: 12px; border-top: 1px solid var(--dt-line); flex-wrap: wrap; }
  .hash-info { display: flex; flex-direction: column; gap: 4px; }
  .hash small { font-size: .59rem; color: var(--dt-mute); font-weight: 800; letter-spacing: .08em; }
  .hash code { font-size: .7rem; color: var(--dt-pri); background: #f3f0ff; border: 1px solid #e5e0fb; padding: 3px 9px; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .valid { margin-left: auto; color: #059669; font-size: .68rem; font-weight: 800; border-radius: 99px; animation: ringPulseGreen 2.4s ease-out infinite; }
  .state { display: grid; place-items: center; gap: 14px; padding: 80px 0; color: var(--dt-body); text-align: center; }
  .state h2 { color: var(--dt-ink); margin-bottom: 10px; }
  .state a { color: var(--dt-pri); }
  .spinner { width: 36px; height: 36px; border: 3px solid #ddd7fa; border-top-color: var(--dt-pri); border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .sharing-head { display: flex; align-items: flex-start; gap: 12px; }
  .sharing-head h2 { margin: 4px 0 4px; }
  .sharing-head .hint { max-width: 640px; }
  .share-modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; }
  .mode-pill { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 13px 15px; border-radius: 14px; background: #fbfcff; border: 1.5px solid var(--dt-line); cursor: pointer; text-align: left; font-family: inherit; transition: border-color .18s, background .18s, box-shadow .18s, transform .18s; }
  .mode-pill:hover:not(:disabled) { border-color: #cdd6f2; transform: translateY(-2px); }
  .mode-pill.active { border-color: var(--dt-pri); background: linear-gradient(150deg, #f6f5ff, #f3f0ff); box-shadow: 0 0 0 4px rgba(109, 92, 255, .1); }
  .mode-pill:disabled { opacity: .55; cursor: not-allowed; }
  .mode-pill b { font-size: .82rem; color: var(--dt-ink); }
  .mode-pill small { font-size: .66rem; color: var(--dt-mute); }
  .sel-list { margin-top: 15px; padding-top: 14px; border-top: 1px solid var(--dt-line); display: grid; gap: 7px; }
  .sel-hint { margin: 0 0 2px; color: var(--dt-body); font-size: .72rem; }
  .sel-row { display: flex; align-items: center; gap: 11px; padding: 11px 13px; background: #fafbff; border: 1px solid var(--dt-line); border-radius: 12px; cursor: pointer; transition: border-color .18s, background .18s; }
  .sel-row:hover { border-color: #cdd6f2; background: #fff; }
  .sel-row input { width: 17px; height: 17px; accent-color: var(--dt-pri); cursor: pointer; flex-shrink: 0; }
  .sel-name { flex: 1; font-size: .78rem; color: #475569; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sel-name b { color: var(--dt-ink); }
  .sel-state { font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: var(--dt-mute); padding: 4px 10px; border-radius: 999px; background: #f1f5f9; }
  .sel-state.on { color: #047857; background: var(--dt-ok-bg); border: 1px solid var(--dt-ok-line); }
  @media (max-width: 700px) {
    .header { align-items: flex-start; flex-direction: column; padding: 20px; }
    .header-actions { width: 100%; }
    .header-actions .btn { flex: 1; text-align: center; }
    .chips { flex-wrap: wrap; }
    .share-modes { grid-template-columns: 1fr; }
    .compare-form { grid-template-columns: 1fr; }
    .compare-btn { width: 100%; }
    .accept-form input { width: 100%; }
    .share-bar { flex-wrap: wrap; }
    .share-link { flex-basis: 100%; order: 3; }
    .comp-pair { margin-left: 0; }
    .meta-row { grid-template-columns: 1fr; gap: 3px; }
    .valid { margin-left: 0; }
  }
</style>