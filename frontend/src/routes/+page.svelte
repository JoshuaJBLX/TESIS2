<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  onMount(() => { auth.init(); if ($auth.isAuthenticated) goto('/dashboard'); });
</script>
<svelte:head><title>DocuTrust · Gestión documental segura</title><meta name="description" content="Protege, firma y verifica documentos con trazabilidad criptográfica." /></svelte:head>
<section class="hero">
  <div class="hero-copy">
    <span class="eyebrow anim-rise"><i></i> Seguridad documental verificable</span>
    <h1 class="anim-rise d1">Confianza digital para cada versión de tus documentos.</h1>
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
  <div class="section-title anim-rise"><span>Protección de principio a fin</span><h2>Todo lo necesario para demostrar autenticidad</h2><p>Cada acción importante queda respaldada con evidencia técnica clara.</p></div>
  <div class="features stagger">
    <article><div class="icon violet">⌁</div><h3>Firma digital</h3><p>Cada versión se firma automáticamente con la clave RSA protegida del usuario.</p><small>Autenticidad del firmante</small></article>
    <article><div class="icon green">✓</div><h3>Verificación pública</h3><p>Comprueba un archivo sin iniciar sesión y detecta cualquier alteración.</p><small>Resultados inmediatos</small></article>
    <article><div class="icon blue">↻</div><h3>Trazabilidad completa</h3><p>Consulta versiones y eventos enlazados mediante una cadena de hashes.</p><small>Historial protegido</small></article>
  </div>
</section>
<aside class="legal anim-fade"><span>i</span><p><strong>Alcance académico.</strong> La firma criptográfica funciona dentro de este sistema y no constituye firma electrónica certificada bajo la Ley 27269.</p></aside>
<style>
  .hero{min-height:560px;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:64px;padding:45px 0 75px}.eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border-radius:99px;background:#eef2ff;color:#4338ca;font-size:.75rem;font-weight:800;letter-spacing:.035em;text-transform:uppercase}.eyebrow i{width:7px;height:7px;border-radius:50%;background:#6366f1;box-shadow:0 0 0 4px #c7d2fe}.hero h1{max-width:700px;font-size:clamp(2.55rem,5.4vw,4.6rem);line-height:1.02;letter-spacing:-.052em;color:#101b3d;margin:22px 0}.hero-copy>p{max-width:600px;color:#5c6b85;font-size:1.1rem;line-height:1.72}.actions{display:flex;gap:12px;margin:31px 0 26px}.actions a{display:inline-flex;align-items:center;justify-content:center;gap:16px;padding:13px 20px;border-radius:10px;text-decoration:none;font-size:.9rem;font-weight:750}.primary{background:#4f46e5;color:#fff;box-shadow:0 12px 25px rgba(79,70,229,.22)}.primary:hover{background:#4338ca}.secondary{background:#fff;color:#283653;border:1px solid #d9e0eb}.trust{display:flex;flex-wrap:wrap;gap:9px}.trust span{font-size:.72rem;color:#64748b;background:#fff;border:1px solid #e1e7f0;padding:6px 9px;border-radius:6px}.visual{position:relative;min-height:410px;display:grid;place-items:center}.glow{position:absolute;width:380px;height:380px;border-radius:50%;background:linear-gradient(145deg,#e0e7ff,#f0fdf4);filter:blur(2px)}.document{position:relative;width:min(390px,85%);padding:25px;background:rgba(255,255,255,.96);border:1px solid #dde4ef;border-radius:18px;box-shadow:0 35px 70px rgba(30,41,59,.16);transform:rotate(-2deg)}.doc-top{display:flex;align-items:center;gap:12px}.doc-top>span:nth-child(2){flex:1}.doc-top b,.doc-top small{display:block}.doc-top b{font-size:.84rem}.doc-top small{color:#8792a6;font-size:.69rem;margin-top:4px}.doc-top i{font-size:.63rem;font-style:normal;font-weight:800;color:#dc2626;background:#fee2e2;padding:5px;border-radius:5px}.doc-icon{width:37px;height:37px;display:grid!important;place-items:center;border-radius:10px;background:#ecfdf5;color:#059669;font-weight:900}.lines{display:grid;gap:10px;margin:32px 0}.lines span{display:block;height:7px;border-radius:9px;background:#e9edf4}.lines span:nth-child(1){width:94%}.lines span:nth-child(2){width:78%}.lines span:nth-child(3){width:87%}.lines span:nth-child(4){width:60%}.signature{display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border:1px solid #e5eaf2;border-radius:10px;padding:12px}.signature small,.signature code{display:block}.signature small{font-size:.58rem;color:#94a3b8}.signature code{font-size:.67rem;color:#475569;margin-top:4px}.signature>span{background:#d1fae5;color:#047857;padding:6px 8px;border-radius:6px;font-size:.65rem;font-weight:800}.floating{position:absolute;display:flex;align-items:center;gap:9px;padding:11px 14px;background:#fff;border:1px solid #e5eaf2;border-radius:12px;box-shadow:0 14px 32px rgba(30,41,59,.13);font-size:1.1rem;color:#4f46e5}.floating span{font-size:.65rem;color:#94a3b8;line-height:1.35}.floating b{color:#334155}.shield{right:-3px;top:80px}.history{left:0;bottom:55px}.value{padding:70px 0}.section-title{text-align:center;max-width:650px;margin:0 auto 38px}.section-title span{font-size:.73rem;font-weight:800;color:#4f46e5;text-transform:uppercase;letter-spacing:.1em}.section-title h2{font-size:clamp(1.8rem,3.5vw,2.6rem);letter-spacing:-.035em;color:#101b3d;margin:10px 0}.section-title p{color:#64748b}.features{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.features article{background:#fff;border:1px solid #e1e7f0;border-radius:16px;padding:25px;box-shadow:0 8px 25px rgba(30,41,59,.045)}.features h3{font-size:1rem;margin:17px 0 8px;color:#17213a}.features p{color:#64748b;font-size:.86rem;line-height:1.65;min-height:68px}.features small{display:block;border-top:1px solid #edf1f6;margin-top:18px;padding-top:14px;color:#8b98aa;font-size:.7rem;font-weight:700}.icon{width:42px;height:42px;display:grid;place-items:center;border-radius:11px;font-weight:900}.violet{background:#eef2ff;color:#4f46e5}.green{background:#ecfdf5;color:#059669}.blue{background:#eff6ff;color:#2563eb}.legal{display:flex;align-items:flex-start;gap:12px;padding:17px 20px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;color:#854d0e;font-size:.78rem;line-height:1.55}.legal>span{width:20px;height:20px;display:grid;place-items:center;border-radius:50%;background:#fef3c7;font-weight:900;flex:none}
  @media(max-width:850px){.hero{grid-template-columns:1fr;text-align:center;gap:25px}.hero-copy>p{margin:auto}.actions,.trust{justify-content:center}.visual{min-height:360px}.features{grid-template-columns:1fr}.features p{min-height:auto}}@media(max-width:520px){.hero{padding-top:25px}.actions{flex-direction:column}.visual{min-height:300px}.document{width:90%;padding:19px}.floating{display:none}.value{padding:45px 0}}
.features article {
    transition: transform 0.2s cubic-bezier(0.22, 0.9, 0.34, 1),
      box-shadow 0.2s, border-color 0.2s;
  }
  .features article:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 35px rgba(30, 41, 59, 0.1);
    border-color: #c7d2fe;
  }
  .document {
    transition: box-shadow 0.3s;
  }
  .actions a {
    transition: transform 0.18s, background 0.18s, box-shadow 0.18s,
      border-color 0.18s;
  }
  .actions a:active {
    transform: scale(0.97);
  }
</style>
