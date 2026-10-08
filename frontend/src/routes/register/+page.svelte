<script lang="ts">
  import { auth } from '$lib/stores/auth'; import { goto } from '$app/navigation'; import { onMount } from 'svelte';
  let username=$state(''); let email=$state(''); let fullName=$state(''); let password=$state(''); let confirmPassword=$state(''); let error=$state(''); let success=$state(''); let loading=$state(false);
  onMount(()=>{auth.init();if($auth.isAuthenticated)goto('/dashboard')});
  async function handleSubmit(e:Event){e.preventDefault();error='';success='';if(password!==confirmPassword){error='Las contraseñas no coinciden';return}if(password.length<12){error='La contraseña debe tener al menos 12 caracteres';return}loading=true;const result=await auth.register(username,email,password,fullName);if(result.success){success='Cuenta creada. Redirigiendo al inicio de sesión…';setTimeout(()=>goto('/login'),1600)}else error=result.error||'No se pudo crear la cuenta';loading=false}
</script>
<svelte:head><title>Crear cuenta · DocuTrust</title></svelte:head>
<div class="auth-layout">
  <div class="auth-aside">
    <div class="aside-orb" aria-hidden="true"></div>
    <span class="aside-mark anim-pop">+</span>
    <p class="eyebrow anim-rise">Empieza a proteger</p>
    <h1 class="anim-rise d1">Una base segura<br>para cada <em class="dt-grad-text">acuerdo.</em></h1>
    <p class="anim-rise d2">Crea tu espacio documental y conserva una prueba verificable de cada cambio.</p>
    <div class="aside-points anim-rise d3"><span>✓ Firma automática por versión</span><span>✓ Verificación pública con QR</span></div>
  </div>
  <section class="auth-card anim-pop">
    <div class="mobile-brand">DocuTrust</div>
    <span class="eyebrow">Nuevo espacio</span>
    <h2>Crear cuenta</h2>
    <p class="intro">Completa tus datos para configurar tus claves de firma.</p>
    {#if error}<div class="alert error anim-shake" role="alert">⚠ {error}</div>{/if}
    {#if success}<div class="alert success anim-slide" role="status">✓ {success}</div>{/if}
    <form onsubmit={handleSubmit}>
      <label for="fullName">Nombre completo<input id="fullName" type="text" bind:value={fullName} placeholder="Ej. Ana García" required disabled={loading} autocomplete="name"></label>
      <label for="username">Nombre de usuario<input id="username" type="text" bind:value={username} placeholder="ana.garcia" required disabled={loading} autocomplete="username"></label>
      <label for="email">Correo electrónico<input id="email" type="email" bind:value={email} placeholder="tu@correo.com" required disabled={loading} autocomplete="email"></label>
      <div class="row"><label for="password">Contraseña<input id="password" type="password" bind:value={password} placeholder="Mínimo 12 caracteres" required disabled={loading} autocomplete="new-password"></label><label for="confirmPassword">Confirmar<input id="confirmPassword" type="password" bind:value={confirmPassword} placeholder="Repite la contraseña" required disabled={loading} autocomplete="new-password"></label></div>
      <p class="hint">Usa mayúsculas, minúsculas, números y un carácter especial.</p>
      <button class="submit btn-anim" class:is-loading={loading} type="submit" disabled={loading}>{loading?'Creando cuenta…':'Crear cuenta'} <span>→</span></button>
    </form>
    <p class="switch">¿Ya tienes una cuenta? <a href="/login">Iniciar sesión</a></p>
  </section>
</div>
<style>
  .auth-layout{min-height:calc(100vh - 140px);display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:65px;max-width:960px;margin:auto;padding:30px 0}
  .auth-aside{position:relative;padding:30px 0}
  .aside-orb{position:absolute;z-index:-1;top:-26px;right:-90px;width:360px;height:360px;border-radius:50%;background:radial-gradient(circle at 30% 30%,rgba(139,92,246,.26),transparent 70%);filter:blur(4px)}
  .aside-orb::after{content:"";position:absolute;left:-150px;bottom:-100px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle at 60% 40%,rgba(99,102,241,.22),transparent 70%)}
  .aside-mark{width:52px;height:52px;display:grid;place-items:center;background:var(--dt-grad);color:#fff;border-radius:15px;font-size:1.6rem;font-weight:900;margin-bottom:30px;box-shadow:0 14px 30px -10px rgba(109,92,255,.6)}
  .eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:#fff;color:var(--dt-pri);font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--dt-line2);box-shadow:0 6px 18px -8px rgba(109,92,255,.35)}
  .eyebrow::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--dt-grad);box-shadow:0 0 0 4px rgba(139,92,246,.16);animation:dtPulse 2.4s ease-out infinite}
  .auth-aside h1{font-size:clamp(2.5rem,5vw,4.2rem);line-height:1.02;letter-spacing:-.055em;color:var(--dt-ink);margin:18px 0}
  .auth-aside h1 em{font-style:normal}
  .auth-aside>p:not(.eyebrow){max-width:380px;color:var(--dt-body);line-height:1.7}
  .aside-points{display:grid;gap:11px;margin-top:30px}
  .aside-points span{display:inline-flex;align-items:center;justify-content:flex-start;width:max-content;gap:7px;padding:9px 15px;background:rgba(255,255,255,.85);border:1px solid var(--dt-line);border-radius:999px;color:#4b5870;font-size:.78rem;font-weight:650;box-shadow:var(--dt-shadow)}
  .auth-card{position:relative;overflow:hidden;background:#fff;border:1px solid var(--dt-line);border-radius:22px;padding:31px;box-shadow:var(--dt-shadow-lg)}
  .auth-card::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:var(--dt-grad-hot)}
  .mobile-brand{display:none}
  .auth-card h2{font-size:1.8rem;letter-spacing:-.04em;color:var(--dt-ink);margin:10px 0 5px}
  .intro{color:var(--dt-body);font-size:.84rem;margin-bottom:21px}
  .auth-card label{display:grid;gap:7px;margin-bottom:13px;color:#35415c;font-size:.74rem;font-weight:750;flex:1}
  .auth-card input{width:100%;padding:12px 13px;border:1px solid var(--dt-line2);border-radius:12px;background:#fbfcff;color:var(--dt-ink);transition:border-color .18s,box-shadow .18s,background .18s}
  .auth-card input:focus{outline:0;border-color:var(--dt-pri);background:#fff;box-shadow:0 0 0 4px rgba(109,92,255,.14)}
  .row{display:flex;gap:10px}
  .hint{color:var(--dt-mute);font-size:.69rem;margin:-2px 0 15px}
  .submit{width:100%;border:0;border-radius:12px;background:var(--dt-grad);color:#fff;padding:14px;font-weight:800;cursor:pointer;display:flex;justify-content:center;gap:16px;box-shadow:var(--dt-glow-sm);transition:transform .16s,box-shadow .16s,filter .16s}
  .submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:var(--dt-glow);filter:brightness(1.04)}
  .submit:disabled{opacity:.55}
  .switch{text-align:center;margin-top:20px;color:var(--dt-body);font-size:.77rem}
  .switch a{color:var(--dt-pri);font-weight:800;text-decoration:none}
  .alert{padding:12px 14px;border-radius:12px;font-size:.76rem;margin-bottom:16px;display:flex;gap:8px;align-items:center}
  .alert.error{background:var(--dt-err-bg);border:1px solid var(--dt-err-line);color:#be123c}
  .alert.success{background:var(--dt-ok-bg);border:1px solid var(--dt-ok-line);color:#047857}
  @media(max-width:760px){.auth-layout{grid-template-columns:1fr;max-width:470px}.auth-aside{display:none}.mobile-brand{display:block;color:var(--dt-pri);font-weight:900;margin-bottom:25px}}
  @media(max-width:500px){.auth-layout{padding:12px 0}.auth-card{padding:24px 19px}.row{display:grid;gap:0}}
</style>