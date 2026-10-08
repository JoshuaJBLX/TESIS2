<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import { api } from '$lib/api';

  let entries = $state<any[]>([]);
  let chain = $state<any>(null);
  let loading = $state(true);
  let error = $state('');
  let eventType = $state('');
  let entityType = $state('');
  let page = $state(0);
  const pageSize = 20;
  let total = $state(0);
  const labels: Record<string, string> = { DOCUMENT_UPLOAD: 'Documento creado', DOCUMENT_UPDATE: 'Nueva versión', DOCUMENT_VISIBILITY_CHANGED: 'Compartido/ocultado', DOCUMENT_SHARING_CHANGED: 'Compartición actualizada', LOGIN_SUCCESS: 'Inicio de sesión', LOGIN_FAILED: 'Inicio fallido', USER_REGISTERED: 'Usuario registrado' };
  const date = (v: string) => new Date(v).toLocaleString('es-PE');
  async function load() {
    loading = true; error = '';
    const [logs, integrity] = await Promise.all([api.getAudit(pageSize, page * pageSize, { eventType, entityType }), api.verifyAuditChain()]);
    if (logs.success) { entries = logs.data?.items || []; total = logs.data?.pagination?.total || 0; } else error = logs.error || 'No se pudo cargar la auditoría';
    chain = integrity.data || { valid: false, reason: integrity.error };
    loading = false;
  }
  function applyFilters() { page = 0; load(); }
  function changePage(delta: number) { page = Math.max(0, page + delta); load(); }
  onMount(() => { auth.init(); if (!$auth.isAuthenticated) return goto('/login'); if ($auth.user?.role !== 'admin') return goto('/dashboard'); load(); });
</script>

<svelte:head><title>Auditoría | Tesis Documental</title></svelte:head>
<div class="page">
  <div class="heading anim-rise">
    <div>
      <p class="eyebrow">Control y trazabilidad</p>
      <h1>Bitácora de auditoría</h1>
      <p>Historial de eventos protegido por una cadena de hashes SHA-256.</p>
    </div>
    <button class="secondary" onclick={() => goto('/dashboard')}>Volver</button>
  </div>

  {#if chain}
    <div class:invalid={!chain.valid} class="integrity anim-pop">
      <span class="dot"></span>
      <div>
        <strong>{chain.valid ? 'Cadena íntegra' : 'Cadena con inconsistencias'}</strong>
        <small>{chain.valid ? `${chain.entries} registros verificados` : chain.reason}</small>
      </div>
      <button class="link" onclick={load}>Volver a verificar</button>
    </div>
  {/if}

  <form class="filters anim-rise d2" onsubmit={(e) => { e.preventDefault(); applyFilters(); }}>
    <label>Evento
      <select bind:value={eventType}>
        <option value="">Todos</option>
        <option value="DOCUMENT_UPLOAD">Documento creado</option>
        <option value="DOCUMENT_UPDATE">Nueva versión</option>
        <option value="LOGIN_SUCCESS">Inicio de sesión</option>
        <option value="LOGIN_FAILED">Inicio fallido</option>
        <option value="USER_REGISTERED">Usuario registrado</option>
      </select>
    </label>
    <label>Entidad
      <select bind:value={entityType}>
        <option value="">Todas</option>
        <option value="document">Documento</option>
        <option value="user">Usuario</option>
        <option value="auth">Autenticación</option>
      </select>
    </label>
    <button class="primary" type="submit">Filtrar</button>
  </form>

  {#if error}
    <div class="error anim-shake">{error}</div>
  {/if}

  {#if loading}
    <p class="muted">Cargando bitácora…</p>
  {:else if entries.length === 0}
    <div class="empty anim-fade">No hay eventos para los filtros seleccionados.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Evento</th><th>Entidad</th><th>Usuario</th><th>Fecha</th><th>Hash</th></tr>
        </thead>
        <tbody>
          {#each entries as entry, i}
            <tr class="anim-fade" style:animation-delay={Math.min(i * 40, 400) + 'ms'}>
              <td><strong>{labels[entry.event_type] || entry.event_type}</strong><small>{entry.event_type}</small></td>
              <td>{entry.entity_type}<small>{entry.entity_id}</small></td>
              <td>{entry.user_id || 'Sistema'}</td>
              <td>{date(entry.created_at)}</td>
              <td><code title={entry.current_hash}>{entry.current_hash.slice(0, 12)}…</code></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="pager">
      <span>{total} eventos</span>
      <button class="secondary" disabled={page === 0} onclick={() => changePage(-1)}>Anterior</button>
      <span>Página {page + 1}</span>
      <button class="secondary" disabled={(page + 1) * pageSize >= total} onclick={() => changePage(1)}>Siguiente</button>
    </div>
  {/if}
</div>

<style>
  .page { padding: 1rem 0 3rem; }
  .heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
  h1 { color: var(--dt-ink); margin: .6rem 0 .5rem; font-size: clamp(1.7rem, 4vw, 2.25rem); letter-spacing: -.04em; }
  .heading p:not(.eyebrow) { color: var(--dt-body); font-size: .85rem; margin: 0; }
  .eyebrow { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; background: #fff; color: var(--dt-pri); font-weight: 800; text-transform: uppercase; letter-spacing: .1em; font-size: .66rem; border: 1px solid var(--dt-line2); box-shadow: 0 6px 18px -8px rgba(109, 92, 255, .35); }
  .eyebrow::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--dt-grad); box-shadow: 0 0 0 4px rgba(139, 92, 246, .16); animation: dtPulse 2.4s ease-out infinite; }
  .primary, .secondary, .link { border-radius: 12px; padding: .65rem 1rem; cursor: pointer; font-weight: 750; font-family: inherit; }
  .primary { border: 0; background: var(--dt-grad); color: #fff; box-shadow: var(--dt-glow-sm); transition: transform .16s, box-shadow .16s, filter .16s; }
  .primary:hover { box-shadow: var(--dt-glow); transform: translateY(-2px); filter: brightness(1.05); }
  .primary:disabled { background: #c6cbdd; cursor: not-allowed; box-shadow: none; }
  .secondary { background: #fff; border: 1px solid var(--dt-line2); color: #334155; transition: border-color .18s, background .18s; }
  .secondary:hover:not(:disabled) { border-color: var(--dt-pri); background: #f6f5ff; }
  .secondary:disabled { opacity: .5; cursor: not-allowed; }
  .link { margin-left: auto; border: 0; background: transparent; color: var(--dt-pri2); text-decoration: underline; }
  .integrity { display: flex; align-items: center; gap: .75rem; background: var(--dt-ok-bg); border: 1px solid var(--dt-ok-line); color: #166534; padding: 1rem 1.1rem; border-radius: 15px; margin-bottom: 1.25rem; box-shadow: var(--dt-shadow); }
  .integrity.invalid { background: var(--dt-err-bg); border-color: var(--dt-err-line); color: #be123c; }
  .dot { width: 11px; height: 11px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
  .invalid .dot { background: #f43f5e; }
  .integrity .dot { animation: ringPulseGreen 2.2s ease-out infinite; }
  .integrity.invalid .dot { animation: ringPulseRed 2.2s ease-out infinite; }
  .integrity strong { font-size: .85rem; font-weight: 800; }
  .integrity small, td small { display: block; color: var(--dt-body); font-size: .75rem; margin-top: .25rem; }
  .filters { display: flex; align-items: end; gap: 1rem; padding: 1rem 1.1rem; background: #fff; border: 1px solid var(--dt-line); border-radius: 17px; margin-bottom: 1.25rem; box-shadow: var(--dt-shadow); }
  .filters label { display: grid; gap: .4rem; color: #475569; font-size: .78rem; font-weight: 750; }
  .filters select { min-width: 190px; padding: .65rem .8rem; border: 1px solid var(--dt-line2); border-radius: 11px; background: #fbfcff; color: var(--dt-ink); font-family: inherit; transition: border-color 0.18s, box-shadow 0.18s, background 0.18s; }
  .filters select:focus { outline: 0; border-color: var(--dt-pri); background: #fff; box-shadow: 0 0 0 4px rgba(109, 92, 255, .14); }
  .table-wrap { background: #fff; border: 1px solid var(--dt-line); border-radius: 17px; overflow: auto; box-shadow: var(--dt-shadow); }
  table { width: 100%; border-collapse: collapse; min-width: 760px; }
  th, td { text-align: left; padding: .9rem 1rem; border-bottom: 1px solid var(--dt-line); font-size: .86rem; }
  th { color: var(--dt-mute); font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; font-weight: 850; background: linear-gradient(180deg, #fafbff, #f0f2fc); }
  tbody tr { transition: background 0.15s; }
  tbody tr:hover { background: #f8fafc; }
  tr:last-child td { border-bottom: 0; }
  td code { font-size: .74rem; color: var(--dt-pri2); background: #f3f0ff; border: 1px solid #e5e0fb; padding: 3px 8px; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .empty, .muted, .error { padding: 2rem; background: #fff; border: 1px solid var(--dt-line); border-radius: 15px; color: var(--dt-body); }
  .error { color: #be123c; background: var(--dt-err-bg); border-color: var(--dt-err-line); font-weight: 600; }
  .pager { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; margin-top: 1rem; color: var(--dt-body); font-size: .82rem; }
  @media (max-width: 640px) {
    .heading, .filters { flex-direction: column; }
    .link { margin-left: 0; }
    .filters select, .filters .primary { width: 100%; }
    .pager { justify-content: space-between; flex-wrap: wrap; }
  }
</style>