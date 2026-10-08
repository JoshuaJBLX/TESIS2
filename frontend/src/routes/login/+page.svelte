<script lang="ts">
  import { auth } from '$lib/stores/auth'; import { goto } from '$app/navigation'; import { onMount } from 'svelte';
  let username=$state(''); let password=$state(''); let error=$state(''); let loading=$state(false);
  onMount(()=>{auth.init();if($auth.isAuthenticated)goto('/dashboard')});
  async function handleSubmit(e:Event){e.preventDefault();error='';loading=true;const result=await auth.login(username,password);if(result.success)goto('/dashboard');else error=result.error||'No se pudo iniciar sesión';loading=false}
</script>
<svelte:head><title>Iniciar sesión · DocuTrust</title></svelte:head>
<div class="auth-layout">
  <div class="auth-aside">
    <div class="aside-orb" aria-hidden="true"></div>
    <span class="aside-mark anim-pop">✓</span>
    <p class="eyebrow anim-rise">Acceso seguro</p>
    <h1 class="anim-rise d1">Tus documentos,<br><em class="dt-grad-text">bajo control.</em></h1>
    <p class="anim-rise d2">Firma y verifica archivos con evidencia criptográfica en cada paso.</p>
    <div class="aside-points anim-rise d3"><span>✓ Claves privadas protegidas</span><span>✓ Historial de versiones</span></div>
  </div>
  <section class="auth-card anim-pop">
    <div class="mobile-brand">DocuTrust</div>
    <span class="eyebrow">Bienvenido de vuelta</span>
    <h2>Iniciar sesión</h2>
    <p class="intro">Ingresa tus credenciales para continuar.</p>
    {#if error}<div class="alert error anim-shake" role="alert">⚠ {error}</div>{/if}
    <form onsubmit={handleSubmit}>
      <label for="username">Usuario<input id="username" type="text" bind:value={username} placeholder="Tu nombre de usuario" required disabled={loading} autocomplete="username"></label>
      <label for="password">Contraseña<input id="password" type="password" bind:value={password} placeholder="Tu contraseña" required disabled={loading} autocomplete="current-password"></label>
      <button class="submit btn-anim" class:is-loading={loading} type="submit" disabled={loading}>{loading?'Validando…':'Iniciar sesión'} <span>→</span></button>
    </form>
    <p class="switch">¿Aún no tienes una cuenta? <a href="/register">Crear cuenta</a></p>
    <details class="anim-fade d5"><summary>Usuarios de demostración</summary><div class="demo"><code>admin</code><span>Admin123!@#</span><code>carlos</code><span>Carlos123!@#</span></div></details>
  </section>
</div>
<style>
  .auth-layout{min-height:calc(100vh - 140px);display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:70px;max-width:960px;margin:auto;padding:30px 0}
  .auth-aside{position:relative;padding:30px 0}
  .aside-orb{position:absolute;z-index:-1;top:-26px;right:-90px;width:360px;height:360px;border-radius:50%;background:radial-gradient(circle at 30% 30%,rgba(139,92,246,.26),transparent 70%);filter:blur(4px)}
  .aside-orb::after{content:"";position:absolute;left:-150px;bottom:-100px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle at 60% 40%,rgba(99,102,241,.22),transparent 70%)}
  .aside-mark{width:52px;height:52px;display:grid;place-items:center;background:linear-gradient(135deg,#34d399,#059669);color:#fff;border-radius:15px;font-size:1.6rem;font-weight:900;margin-bottom:30px;box-shadow:0 14px 30px -10px rgba(16,185,129,.55)}
  .eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:#fff;color:var(--dt-pri);font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--dt-line2);box-shadow:0 6px 18px -8px rgba(109,92,255,.35)}
  .eyebrow::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--dt-grad);box-shadow:0 0 0 4px rgba(139,92,246,.16);animation:dtPulse 2.4s ease-out infinite}
  .auth-aside h1{font-size:clamp(2.6rem,5vw,4.3rem);line-height:1.02;letter-spacing:-.055em;color:var(--dt-ink);margin:18px 0}
  .auth-aside h1 em{font-style:normal}
  .auth-aside>p:not(.eyebrow){max-width:380px;color:var(--dt-body);line-height:1.7}
  .aside-points{display:grid;gap:11px;margin-top:30px}
  .aside-points span{display:inline-flex;align-items:center;justify-content:flex-start;width:max-content;gap:7px;padding:9px 15px;background:rgba(255,255,255,.85);border:1px solid var(--dt-line);border-radius:999px;color:#4b5870;font-size:.78rem;font-weight:650;box-shadow:var(--dt-shadow)}
  .auth-card{position:relative;overflow:hidden;background:#fff;border:1px solid var(--dt-line);border-radius:22px;padding:34px;box-shadow:var(--dt-shadow-lg)}
  .auth-card::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:var(--dt-grad-hot)}
  .mobile-brand{display:none}
  .auth-card h2{font-size:1.8rem;letter-spacing:-.04em;color:var(--dt-ink);margin:10px 0 5px}
  .intro{color:var(--dt-body);font-size:.86rem;margin-bottom:26px}
  .auth-card label{display:grid;gap:7px;margin-bottom:16px;color:#35415c;font-size:.77rem;font-weight:750}
  .auth-card input{width:100%;padding:13px 14px;border:1px solid var(--dt-line2);border-radius:12px;background:#fbfcff;color:var(--dt-ink);transition:border-color .18s,box-shadow .18s,background .18s}
  .auth-card input:focus{outline:0;border-color:var(--dt-pri);background:#fff;box-shadow:0 0 0 4px rgba(109,92,255,.14)}
  .submit{width:100%;border:0;border-radius:12px;background:var(--dt-grad);color:#fff;padding:14px;font-weight:800;cursor:pointer;display:flex;justify-content:center;gap:16px;margin-top:6px;box-shadow:var(--dt-glow-sm);transition:transform .16s,box-shadow .16s,filter .16s}
  .submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:var(--dt-glow);filter:brightness(1.04)}
  .submit:disabled{opacity:.55;cursor:not-allowed}
  .switch{text-align:center;margin:22px 0;color:var(--dt-body);font-size:.78rem}
  .switch a{color:var(--dt-pri);font-weight:800;text-decoration:none}
  .auth-card details{border-top:1px solid var(--dt-line);padding-top:15px;color:var(--dt-body);font-size:.74rem}
  .auth-card summary{cursor:pointer;text-align:center;font-weight:650}
  .demo{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;background:var(--dt-grad-soft);padding:11px;border-radius:10px;animation:slideDown .3s ease both}
  .demo code{color:var(--dt-pri);font-size:.7rem;font-weight:800}
  .demo span{font-size:.7rem;color:#46536b}
  .alert{padding:12px 14px;border-radius:12px;font-size:.77rem;margin-bottom:16px;display:flex;gap:8px;align-items:center}
  .alert.error{background:var(--dt-err-bg);border:1px solid var(--dt-err-line);color:#be123c}
  @media(max-width:760px){.auth-layout{grid-template-columns:1fr;max-width:470px}.auth-aside{display:none}.mobile-brand{display:block;color:var(--dt-pri);font-weight:900;margin-bottom:25px}}
  @media(max-width:500px){.auth-layout{padding:12px 0}.auth-card{padding:25px 20px}}
</style>