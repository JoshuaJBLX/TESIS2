<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  onMount(() => { auth.init(); if ($auth.isAuthenticated) goto('/dashboard'); });
</script>
<svelte:head><title>DocuTrust · Gestión documental segura</title><meta name="description" content="Protege, firma y verifica documentos con trazabilidad criptográfica." /></svelte:head>
<section class="hero">
  <div class="hero-orb" aria-hidden="true"></div>
  <div class="hero-copy">
    <span class="eyebrow anim-rise"><i></i> Seguridad documental verificable</span>
    <h1 class="anim-rise d1">Confianza digital para cada <span class="dt-grad-text">versión</span> de tus documentos.</h1>
    <p class="anim-rise d2">Centraliza archivos, firma cada cambio y comprueba su integridad en segundos con trazabilidad criptográfica completa.</p>
    <div class="actions anim-rise d3"><a class="primary" href="/register">Comenzar ahora <span>→</span></a><a class="secondary" href="/verify">Verificar un documento</a></div>
    <div class="trust anim-rise d4"><span>RSA-2048</span><span>SHA-256</span><span>Historial inmutable</span></div>
  </div>
  <div class="visual" aria-hidden="true">
    <div class="glow anim-glow"></div><div class="document anim-fade">
      <div class="doc-top"><span class="doc-icon">✓</span><span><b>Contrato_proyecto.pdf</b><small>Versión 3 · Firmado</small></span><i>PDF</i></div>
      <div class="lines"><span></span><span></span><span></span><span></span></div>
      <div class="signature"><div><small>HASH SHA-256</small><code>93a4f2...7c01</code></div><span>Firma válida</span></div>
    </div>
    <div class="floating shield anim-float">✓<span>Integridad<br><b>Verificada</b></span></div>
    <div class="floating history anim-float-alt">3<span>Versiones<br><b>trazables</b></span></div>
  </div>
</section>
<section class="value">
  <div class="section-title anim-rise"><span class="dt-grad-text">Protección de principio a fin</span><h2>Todo lo necesario para demostrar autenticidad</h2><p>Cada acción importante queda respaldada con evidencia técnica clara.</p></div>
  <div class="features stagger">
    <article><div class="icon violet">⌁</div><h3>Firma digital</h3><p>Cada versión se firma automáticamente con la clave RSA protegida del usuario.</p><small>Autenticidad del firmante</small></article>
    <article><div class="icon green">✓</div><h3>Verificación pública</h3><p>Comprueba un archivo sin iniciar sesión y detecta cualquier alteración.</p><small>Resultados inmediatos</small></article>
    <article><div class="icon blue">↻</div><h3>Trazabilidad completa</h3><p>Consulta versiones y eventos enlazados mediante una cadena de hashes.</p><small>Historial protegido</small></article>
  </div>
</section>
<aside class="legal anim-fade"><span>i</span><p><strong>Alcance académico.</strong> La firma criptográfica funciona dentro de este sistema y no constituye firma electrónica certificada bajo la Ley 27269.</p></aside>
<style>
  .hero{position:relative;min-height:560px;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:64px;padding:45px 0 75px}
  .hero-orb{position:absolute;z-index:-1;top:10px;left:-140px;width:430px;height:430px;border-radius:50%;background:radial-gradient(circle at 30% 30%,rgba(167,139,250,.16),transparent 70%);filter:blur(6px)}
  .hero-orb::after{content:"";position:absolute;right:-260px;top:60px;width:360px;height:360px;border-radius:50%;background:radial-gradient(circle at 60% 40%,rgba(99,102,241,.14),transparent 70%)}
  .eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 13px;border-radius:999px;background:#fff;color:var(--dt-pri);font-size:.7rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;border:1px solid var(--dt-line2);box-shadow:0 6px 18px -8px rgba(109,92,255,.35)}
  .eyebrow i{width:7px;height:7px;border-radius:50%;background:var(--dt-grad);box-shadow:0 0 0 4px rgba(139,92,246,.16);animation:dtPulse 2.4s ease-out infinite}
  .hero h1{max-width:700px;font-size:clamp(2.55rem,5.4vw,4.6rem);line-height:1.02;letter-spacing:-.05em;color:var(--dt-ink);margin:22px 0}
  .hero-copy>p{max-width:600px;color:var(--dt-body);font-size:1.1rem;line-height:1.72}
  .actions{display:flex;gap:12px;margin:31px 0 26px}
  .actions a{display:inline-flex;align-items:center;justify-content:center;gap:16px;padding:14px 22px;border-radius:13px;text-decoration:none;font-size:.9rem;font-weight:750;transition:transform .18s,box-shadow .18s,background .18s,border-color .18s}
  .primary{background:var(--dt-grad);color:#fff;box-shadow:var(--dt-glow)}
  .primary:hover{transform:translateY(-2px);filter:brightness(1.05)}
  .secondary{background:#fff;color:#3a4863;border:1px solid var(--dt-line2)}
  .secondary:hover{border-color:var(--dt-pri);color:var(--dt-pri);transform:translateY(-2px)}
  .actions a:active{transform:scale(.97)}
  .trust{display:flex;flex-wrap:wrap;gap:9px}
  .trust span{font-size:.72rem;color:var(--dt-body);background:rgba(255,255,255,.85);border:1px solid var(--dt-line);padding:6px 11px;border-radius:999px;box-shadow:0 4px 12px -6px rgba(15,23,42,.12)}
  .visual{position:relative;min-height:410px;display:grid;place-items:center}
  .glow{position:absolute;width:400px;height:400px;border-radius:50%;background:linear-gradient(145deg,rgba(224,231,255,.9),rgba(240,253,244,.7));filter:blur(2px)}
  .document{position:relative;width:min(390px,85%);padding:25px;background:rgba(255,255,255,.97);border:1px solid var(--dt-line);border-radius:20px;box-shadow:var(--dt-shadow-lg);transform:rotate(-2deg);transition:box-shadow .3s}
  .document:hover{box-shadow:0 40px 80px -24px rgba(15,23,42,.34)}
  .doc-top{display:flex;align-items:center;gap:12px}
  .doc-top>span:nth-child(2){flex:1}
  .doc-top b,.doc-top small{display:block}
  .doc-top b{font-size:.84rem;color:var(--dt-ink)}
  .doc-top small{color:var(--dt-mute);font-size:.69rem;margin-top:4px}
  .doc-top i{font-size:.63rem;font-style:normal;font-weight:800;color:#be123c;background:var(--dt-err-bg);padding:5px;border-radius:6px}
  .doc-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:var(--dt-ok-bg);color:#059669;font-weight:900;border:1px solid var(--dt-ok-line)}
  .lines{display:grid;gap:10px;margin:32px 0}
  .lines span{display:block;height:7px;border-radius:9px;background:#e9edf4}
  .lines span:nth-child(1){width:94%}
  .lines span:nth-child(2){width:78%}
  .lines span:nth-child(3){width:87%}
  .lines span:nth-child(4){width:60%}
  .signature{display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border:1px solid var(--dt-line);border-radius:11px;padding:12px}
  .signature small,.signature code{display:block}
  .signature small{font-size:.58rem;color:var(--dt-mute)}
  .signature code{font-size:.67rem;color:#46536b;margin-top:4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  .signature>span{background:var(--dt-ok-bg);color:#047857;padding:6px 9px;border-radius:7px;font-size:.65rem;font-weight:800}
  .floating{position:absolute;display:flex;align-items:center;gap:9px;padding:11px 14px;background:#fff;border:1px solid var(--dt-line);border-radius:14px;box-shadow:var(--dt-shadow-lg);font-size:1.1rem;color:var(--dt-pri)}
  .floating span{font-size:.65rem;color:var(--dt-mute);line-height:1.35}
  .floating b{color:#35415c}
  .shield{right:-3px;top:80px}
  .history{left:0;bottom:55px}
  .value{padding:70px 0}
  .section-title{text-align:center;max-width:650px;margin:0 auto 38px}
  .section-title span{font-size:.73rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em}
  .section-title h2{font-size:clamp(1.8rem,3.5vw,2.6rem);letter-spacing:-.035em;color:var(--dt-ink);margin:10px 0}
  .section-title p{color:var(--dt-body)}
  .features{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  .features article{background:#fff;border:1px solid var(--dt-line);border-radius:20px;padding:26px;box-shadow:var(--dt-shadow);transition:transform .2s,box-shadow .2s,border-color .2s}
  .features article:hover{transform:translateY(-4px);box-shadow:var(--dt-shadow-lg);border-color:#cdd6f2}
  .features h3{font-size:1rem;margin:17px 0 8px;color:var(--dt-ink)}
  .features p{color:var(--dt-body);font-size:.86rem;line-height:1.65;min-height:68px}
  .features small{display:block;border-top:1px solid var(--dt-line);margin-top:18px;padding-top:14px;color:var(--dt-mute);font-size:.7rem;font-weight:700}
  .icon{width:44px;height:44px;display:grid;place-items:center;border-radius:13px;font-weight:900;font-size:1.2rem}
  .violet{background:linear-gradient(135deg,#eef2ff,#ede9fe);color:#6d5cff}
  .green{background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:#059669}
  .blue{background:linear-gradient(135deg,#eff6ff,#e0f2fe);color:#2563eb}
  .legal{display:flex;align-items:flex-start;gap:12px;padding:17px 20px;background:linear-gradient(120deg,var(--dt-warn-bg),#fff7e6);border:1px solid var(--dt-warn-line);border-radius:14px;color:#854d0e;font-size:.78rem;line-height:1.55}
  .legal>span{width:20px;height:20px;display:grid;place-items:center;border-radius:50%;background:#fef3c7;font-weight:900;flex:none}
  @media(max-width:850px){.hero{grid-template-columns:1fr;text-align:center;gap:25px}.hero-copy>p{margin:auto}.actions,.trust{justify-content:center}.visual{min-height:360px}.features{grid-template-columns:1fr}.features p{min-height:auto}}
  @media(max-width:520px){.hero{padding-top:25px}.actions{flex-direction:column}.visual{min-height:300px}.document{width:90%;padding:19px}.floating{display:none}.value{padding:45px 0}}
</style>