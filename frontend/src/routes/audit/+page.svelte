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
  const labels: Record<string, string> = { DOCUMENT_UPLOAD: 'Documento creado', DOCUMENT_UPDATE: 'Nueva versión', LOGIN_SUCCESS: 'Inicio de sesión', LOGIN_FAILED: 'Inicio fallido', USER_REGISTERED: 'Usuario registrado' };
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
  <div class="heading anim-rise"><div><p class="eyebrow">Control y trazabilidad</p><h1>Bitácora de auditoría</h1><p>Historial de eventos protegido por una cadena de hashes SHA-256.</p></div><button class="secondary" onclick={() => goto('/dashboard')}>Volver</button></div>
  {#if chain}<div class:invalid={!chain.valid} class="integrity anim-pop"><span class="dot"></span><div><strong>{chain.valid ? 'Cadena íntegra' : 'Cadena con inconsistencias'}</strong><small>{chain.valid ? `${chain.entries} registros verificados` : chain.reason}</small></div><button class="link" onclick={load}>Volver a verificar</button></div>{/if}
  <form class="filters anim-rise d2" onsubmit={(e) => { e.preventDefault(); applyFilters(); }}><label>Evento<select bind:value={eventType}><option value="">Todos</option><option value="DOCUMENT_UPLOAD">Documento creado</option><option value="DOCUMENT_UPDATE">Nueva versión</option><option value="LOGIN_SUCCESS">Inicio de sesión</option><option value="LOGIN_FAILED">Inicio fallido</option><option value="USER_REGISTERED">Usuario registrado</option></select></label><label>Entidad<select bind:value={entityType}><option value="">Todas</option><option value="document">Documento</option><option value="user">Usuario</option><option value="auth">Autenticación</option></select></label><button class="primary" type="submit">Filtrar</button></form>
  {#if error}<div class="error anim-shake">{error}</div>{/if}
  {#if loading}<p class="muted">Cargando bitácora…</p>{:else if entries.length === 0}<div class="empty anim-fade">No hay eventos para los filtros seleccionados.</div>{:else}<div class="table-wrap"><table><thead><tr><th>Evento</th><th>Entidad</th><th>Usuario</th><th>Fecha</th><th>Hash</th></tr></thead><tbody>{#each entries as entry, i}<tr class="anim-fade" style:animation-delay={Math.min(i * 40, 400) + 'ms'}><td><strong>{labels[entry.event_type] || entry.event_type}</strong><small>{entry.event_type}</small></td><td>{entry.entity_type}<small>{entry.entity_id}</small></td><td>{entry.user_id || 'Sistema'}</td><td>{date(entry.created_at)}</td><td><code title={entry.current_hash}>{entry.current_hash.slice(0, 12)}…</code></td></tr>{/each}</tbody></table></div><div class="pager"><span>{total} eventos</span><button class="secondary" disabled={page === 0} onclick={() => changePage(-1)}>Anterior</button><span>Página {page + 1}</span><button class="secondary" disabled={(page + 1) * pageSize >= total} onclick={() => changePage(1)}>Siguiente</button></div>{/if}
</div>

<style>
  .page{padding:1rem 0 3rem}.heading{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1.5rem}h1{color:#16213e;margin:.2rem 0 .5rem;font-size:clamp(1.7rem,4vw,2.25rem)}.heading p:not(.eyebrow){color:#64748b}.eyebrow{color:#4f46e5;font-weight:700;text-transform:uppercase;letter-spacing:.1em;font-size:.72rem}.primary,.secondary,.link{border-radius:9px;padding:.65rem 1rem;cursor:pointer;font-weight:600}.primary{border:0;background:#4f46e5;color:#fff}.secondary{background:#fff;border:1px solid #dbe3ef;color:#334155}.link{margin-left:auto;border:0;background:transparent;color:#4338ca}.integrity{display:flex;align-items:center;gap:.75rem;background:#ecfdf3;border:1px solid #bbf7d0;color:#166534;padding:1rem 1.1rem;border-radius:12px;margin-bottom:1.25rem}.integrity.invalid{background:#fff1f2;border-color:#fecdd3;color:#be123c}.dot{width:10px;height:10px;border-radius:50%;background:#22c55e}.invalid .dot{background:#f43f5e}.integrity small,td small{display:block;color:#64748b;font-size:.75rem;margin-top:.25rem}.filters{display:flex;align-items:end;gap:1rem;padding:1rem;background:#fff;border:1px solid #e5eaf2;border-radius:12px;margin-bottom:1.25rem}.filters label{display:grid;gap:.4rem;color:#475569;font-size:.8rem;font-weight:600}.filters select{min-width:180px;padding:.65rem;border:1px solid #dbe3ef;border-radius:8px;background:#fff}.table-wrap{background:#fff;border:1px solid #e5eaf2;border-radius:12px;overflow:auto}table{width:100%;border-collapse:collapse;min-width:720px}th,td{text-align:left;padding:1rem;border-bottom:1px solid #eef2f7;font-size:.88rem}th{color:#64748b;font-size:.73rem;text-transform:uppercase;letter-spacing:.06em;background:#f8fafc}tr:last-child td{border-bottom:0}code{font-size:.76rem;color:#475569}.empty,.muted,.error{padding:2rem;background:#fff;border-radius:12px;color:#64748b}.error{color:#be123c;background:#fff1f2}.pager{display:flex;align-items:center;justify-content:flex-end;gap:.75rem;margin-top:1rem;color:#64748b;font-size:.85rem}@media(max-width:640px){.heading,.filters{flex-direction:column}.link{margin-left:0}.filters select,.filters .primary{width:100%}.pager{justify-content:space-between;flex-wrap:wrap}}
.integrity .dot {
    animation: ringPulseGreen 2.2s ease-out infinite;
  }
  .integrity.invalid .dot {
    animation: ringPulseRed 2.2s ease-out infinite;
  }
  tbody tr {
    transition: background 0.15s;
  }
  tbody tr:hover {
    background: #f8fafc;
  }
  .filters select {
    transition: border-color 0.18s, box-shadow 0.18s;
  }
</style>
