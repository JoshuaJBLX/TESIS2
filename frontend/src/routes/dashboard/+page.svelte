<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  onMount(() => { auth.init(); if (!$auth.isAuthenticated) goto('/login'); });
</script>
<svelte:head><title>Resumen | DocuTrust</title></svelte:head>
<div class="dashboard">
  <section class="welcome anim-rise"><div><span class="eyebrow">Panel de control</span><h1>Hola, <span class="dt-grad-text">{$auth.user?.username}</span></h1><p>Gestiona tus documentos y verifica su integridad desde un solo lugar.</p></div><div class="security"><span class="anim-ring-green">✓</span><div><strong>Cuenta protegida</strong><small>Claves RSA-2048 activas</small></div></div></section>
  <section class="quick-grid stagger">
    <a class="action-card destiny" href="/documents"><span class="action-icon">▣</span><span><small>GESTIÓN DOCUMENTAL</small><strong>Mis documentos</strong><em>Versiona y firma archivos</em></span><b>→</b></a>
    <a class="action-card sky" href="/verify"><span class="action-icon">⌕</span><span><small>VERIFICACIÓN PÚBLICA</small><strong>Verificar archivo</strong><em>Comprueba hash y firma</em></span><b>→</b></a>
    {#if $auth.user?.role === 'admin'}<a class="action-card amber" href="/audit"><span class="action-icon">≋</span><span><small>ADMINISTRACIÓN</small><strong>Auditoría</strong><em>Revisa la cadena de eventos</em></span><b>→</b></a>{/if}
  </section>
  <section class="collab-strip anim-rise d2">
    <div class="collab-label"><span>✦</span><div><small>NUEVO</small><strong>Colaboración documental</strong></div></div>
    <a href="/documents"><em>Compartir</em><strong>Publica un documento</strong><b>→</b></a>
    <a href="/u/{$auth.user?.username}"><em>Perfil público</em><strong>@{$auth.user?.username}</strong><b>→</b></a>
    <a href="/verify"><em>Sin cuenta</em><strong>Comparar y verificar</strong><b>→</b></a>
  </section>
  <section class="progress-card anim-rise d3"><div class="section-heading"><div><span class="eyebrow">Estado del sistema</span><h2>Protección documental activa</h2></div><span class="complete">4 de 4 fases</span></div><div class="progress"><span class="anim-grow"></span></div><div class="milestones stagger"><div><i>✓</i><span><strong>Fundamentos</strong><small>Auth y roles</small></span></div><div><i>✓</i><span><strong>Criptografía</strong><small>RSA y AES-GCM</small></span></div><div><i>✓</i><span><strong>Documentos</strong><small>Versionado y QR</small></span></div><div><i>✓</i><span><strong>Trazabilidad</strong><small>Auditoría inmutable</small></span></div></div></section>
  <section class="help anim-rise d5"><span>?</span><div><strong>¿Necesitas verificar un documento?</strong><p>La verificación pública no requiere cuenta y muestra el resultado del hash y la firma.</p></div><a href="/verify">Ir a verificar →</a></section>
</div>
<style>
  .dashboard{padding:8px 0 30px}
  .eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:#fff;color:var(--dt-pri);font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--dt-line2);box-shadow:0 6px 18px -8px rgba(109,92,255,.35)}
  .eyebrow::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--dt-grad);box-shadow:0 0 0 4px rgba(139,92,246,.16);animation:dtPulse 2.4s ease-out infinite}
  .welcome{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:31px;padding:26px 28px;background:linear-gradient(120deg,#f6f5ff,#eef2ff);border:1px solid var(--dt-line);border-radius:22px;box-shadow:var(--dt-shadow)}
  .welcome h1{font-size:clamp(2rem,4vw,3rem);letter-spacing:-.045em;color:var(--dt-ink);margin:10px 0}
  .welcome p{color:var(--dt-body)}
  .security{display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(255,255,255,.9);border:1px solid var(--dt-ok-line);border-radius:13px;color:#047857;box-shadow:var(--dt-shadow)}
  .security>span{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:var(--dt-grad);color:#fff;font-weight:900}
  .security strong,.security small{display:block}
  .security strong{font-size:.78rem}
  .security small{font-size:.67rem;color:#059669;margin-top:3px}
  .quick-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:25px}
  .action-card{display:flex;align-items:center;gap:14px;padding:21px 18px;border-radius:18px;text-decoration:none;border:1px solid var(--dt-line);transition:transform .2s,box-shadow .2s,border-color .2s}
  .action-card:hover{transform:translateY(-3px);box-shadow:var(--dt-shadow-lg);border-color:#cdd6f2}
  .action-card>span:nth-child(2){flex:1}
  .action-card small,.action-card strong,.action-card em{display:block}
  .action-card small{font-size:.6rem;font-weight:800;letter-spacing:.08em;opacity:.85}
  .action-card strong{font-size:1rem;margin:6px 0 4px;color:var(--dt-ink)}
  .action-card em{font-size:.72rem;font-style:normal;opacity:.8}
  .action-card b{font-size:1.25rem}
  .action-icon{width:42px;height:42px;display:grid!important;place-items:center;border-radius:13px;font-size:1.25rem;font-weight:900}
  .destiny{background:linear-gradient(150deg,#f4f1ff,#eef2ff);color:#6d5cff;border-color:#dcd5fb}
  .destiny .action-icon{background:#fff;box-shadow:0 6px 14px -6px rgba(109,92,255,.4)}
  .sky{background:linear-gradient(150deg,#eff6ff,#e6f4fe);color:#2563eb;border-color:#bfdbfe}
  .sky .action-icon{background:#fff;box-shadow:0 6px 14px -6px rgba(59,130,246,.4)}
  .amber{background:linear-gradient(150deg,#fffbeb,#fef3c7);color:#b45309;border-color:#fde68a}
  .amber .action-icon{background:#fff;box-shadow:0 6px 14px -6px rgba(245,158,11,.4)}
  .collab-strip{display:grid;grid-template-columns:1.2fr repeat(3,1fr);gap:14px;margin-bottom:25px}
  .collab-label{display:flex;align-items:center;gap:12px;background:linear-gradient(150deg,#101b3d,#4f46e5 60%,#8b5cf6);border-radius:18px;padding:16px 18px;color:#fff;box-shadow:0 16px 34px -16px rgba(109,92,255,.55)}
  .collab-label>span{width:38px;height:38px;flex-shrink:0;display:grid;place-items:center;border-radius:11px;background:rgba(255,255,255,.14);font-size:1.1rem}
  .collab-label small,.collab-label strong{display:block}
  .collab-label small{font-size:.58rem;letter-spacing:.14em;color:#c7d2fe;font-weight:800}
  .collab-label strong{font-size:.88rem;margin-top:4px}
  .collab-strip>a{background:#fff;border:1px solid var(--dt-line);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:5px;text-decoration:none;transition:transform .2s,box-shadow .2s,border-color .2s}
  .collab-strip>a:hover{transform:translateY(-3px);box-shadow:var(--dt-shadow-lg);border-color:#cdd6f2}
  .collab-strip>a em{font-style:normal;font-size:.6rem;font-weight:800;letter-spacing:.1em;color:var(--dt-pri)}
  .collab-strip>a strong{font-size:.85rem;color:var(--dt-ink)}
  .collab-strip>a b{margin-top:5px;color:var(--dt-pri);text-align:right}
  .progress-card{background:#fff;border:1px solid var(--dt-line);border-radius:20px;padding:25px 26px;box-shadow:var(--dt-shadow)}
  .section-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:15px}
  .section-heading h2{font-size:1.25rem;color:var(--dt-ink);margin-top:10px}
  .complete{font-size:.72rem;color:#047857;background:var(--dt-ok-bg);border:1px solid var(--dt-ok-line);padding:7px 11px;border-radius:999px;font-weight:800}
  .progress{height:8px;background:#e8edf4;border-radius:8px;margin:23px 0;overflow:hidden}
  .progress span{display:block;width:100%;height:100%;border-radius:8px;background:var(--dt-grad-hot);box-shadow:0 0 12px rgba(168,85,247,.5)}
  .milestones{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .milestones>div{display:flex;gap:9px;align-items:flex-start;padding:12px;background:#fafbff;border:1px solid var(--dt-line);border-radius:12px}
  .milestones i{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:var(--dt-grad);color:#fff;font-size:.72rem;font-style:normal;font-weight:900;flex:none}
  .milestones strong,.milestones small{display:block}
  .milestones strong{font-size:.76rem;color:#35415c}
  .milestones small{font-size:.67rem;color:var(--dt-mute);margin-top:3px}
  .help{display:flex;align-items:center;gap:12px;margin-top:18px;padding:17px 19px;background:linear-gradient(120deg,#f6f5ff,#fff);border:1px solid var(--dt-line);border-radius:16px;box-shadow:var(--dt-shadow)}
  .help>span{width:27px;height:27px;display:grid;place-items:center;border-radius:50%;background:var(--dt-grad-soft);color:var(--dt-pri);font-weight:800}
  .help div{flex:1}
  .help strong{font-size:.8rem;color:var(--dt-ink)}
  .help p{font-size:.73rem;color:var(--dt-body);margin-top:3px}
  .help a{font-size:.75rem;color:var(--dt-pri);font-weight:800;text-decoration:none}
  @media(max-width:760px){.welcome{align-items:flex-start;flex-direction:column}.quick-grid{grid-template-columns:1fr}.milestones{grid-template-columns:repeat(2,1fr)}.collab-strip{grid-template-columns:1fr}}
  @media(max-width:520px){.progress-card{padding:20px 17px}.help{align-items:flex-start;flex-wrap:wrap}.help a{margin-left:37px}.milestones{grid-template-columns:1fr 1fr}.milestones strong{font-size:.7rem}}
</style>