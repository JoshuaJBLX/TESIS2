<script lang="ts">
  import '../app.css';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  let { children } = $props();
  let menuOpen = $state(false);
  let currentPath = $derived($page.url.pathname);
  onMount(() => auth.init());
  $effect(() => {
    currentPath;
    window.scrollTo(0, 0);
  });
  function handleLogout() { auth.logout(); menuOpen = false; goto('/login'); }
  function closeMenu() { menuOpen = false; }
</script>

<svelte:head>
  <meta name="theme-color" content="#f6f7ff" />
</svelte:head>

<div class="app-shell">
  <header class="topbar">
    <div class="topbar-inner">
      <a href="/" class="brand" aria-label="Inicio" onclick={closeMenu}>
        <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5M10 12h5M10 16h5"/></svg></span>
        <span><strong>DocuTrust</strong><small>Gestión documental segura</small></span>
      </a>
      <button class="menu-toggle" aria-label="Abrir navegación" aria-expanded={menuOpen} onclick={() => menuOpen = !menuOpen}><span></span><span></span><span></span></button>
      <div class:open={menuOpen} class="nav-area">
        <nav aria-label="Navegación principal">
          {#if $auth.isAuthenticated}
            <a href="/dashboard" onclick={closeMenu} class:active={currentPath === '/dashboard'}>Resumen</a>
            <a href="/documents" onclick={closeMenu} class:active={currentPath.startsWith('/documents')}>Documentos</a>
            <a href="/verify" onclick={closeMenu} class:active={currentPath === '/verify'}>Verificar</a>
            {#if $auth.user?.role === 'admin'}<a href="/audit" onclick={closeMenu} class:active={currentPath === '/audit'}>Auditoría</a>{/if}
          {:else}
            <a href="/verify" onclick={closeMenu} class:active={currentPath === '/verify'}>Verificar documento</a>
            <a href="/login" onclick={closeMenu} class:active={currentPath === '/login'}>Iniciar sesión</a>
            <a href="/register" onclick={closeMenu} class="nav-cta" class:active={currentPath === '/register'}>Crear cuenta</a>
          {/if}
        </nav>
        {#if $auth.isAuthenticated}
          <div class="account">
            <span class="avatar">{$auth.user?.username?.slice(0,1).toUpperCase()}</span>
            <span class="account-copy"><strong>{$auth.user?.username}</strong><small>{$auth.user?.role === 'admin' ? 'Administrador' : 'Usuario'}</small></span>
            <button onclick={handleLogout} class="logout" title="Cerrar sesión" aria-label="Cerrar sesión"><svg viewBox="0 0 24 24"><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/></svg></button>
          </div>
        {/if}
      </div>
    </div>
  </header>
  <main>
    {#key currentPath}
      <div class="anim-page">{@render children()}</div>
    {/key}
  </main>
  <footer><div><span>DocuTrust</span><p>Integridad, autenticidad y trazabilidad documental.</p><small>Proyecto académico · Firma criptográfica interna</small></div></footer>
</div>

<style>
  :global(*){box-sizing:border-box;margin:0;padding:0}
  :global(:root){font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17213a;background:#f4f7fb;font-synthesis:none;--navy:#101b3d;--indigo:#4f46e5;--indigo-dark:#3730a3;--slate:#64748b;--line:#e1e7f0;--success:#059669;--danger:#dc2626}
  :global(body){min-width:320px;min-height:100vh;color:#17213a}
  :global(button),:global(input),:global(select),:global(textarea){font:inherit}
  :global(button),:global(a){-webkit-tap-highlight-color:transparent}
  :global(a){color:inherit}
  :global(:focus-visible){outline:3px solid rgba(109,92,255,.3);outline-offset:2px}
  .app-shell{min-height:100vh;display:flex;flex-direction:column}
  .topbar{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.82);color:#1e293b;border-bottom:1px solid rgba(226,232,248,.85);backdrop-filter:blur(16px) saturate(160%)}
  .topbar-inner{width:min(1180px,calc(100% - 40px));min-height:72px;margin:auto;display:flex;align-items:center;gap:30px}
  .brand{display:flex;align-items:center;gap:11px;text-decoration:none;min-width:max-content}
  .brand-mark{width:39px;height:39px;display:grid;place-items:center;border-radius:12px;background:var(--dt-grad,linear-gradient(135deg,#818cf8,#4f46e5));box-shadow:0 8px 18px rgba(109,92,255,.35)}
  .brand-mark svg{width:22px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .brand strong,.brand small,.account strong,.account small{display:block}
  .brand strong{font-size:1rem;letter-spacing:.01em;color:#0f1729}
  .brand small{font-size:.68rem;color:#7c8aa6;margin-top:1px}
  .nav-area{display:flex;align-items:center;justify-content:space-between;flex:1;gap:22px}
  nav{display:flex;align-items:center;gap:4px}
  nav a{padding:9px 14px;border-radius:999px;color:#5b6680;text-decoration:none;font-size:.87rem;font-weight:650;transition:background .18s,color .18s}
  nav a:hover{color:#0f1729;background:rgba(109,92,255,.08)}
  nav a.active{color:#fff;background:var(--dt-grad,linear-gradient(135deg,#6d5cff,#8b5cf6));font-weight:800;box-shadow:0 8px 18px -8px rgba(109,92,255,.6)}
  .nav-cta{border:1px solid var(--dt-line2,#d7def0);background:#fff;color:var(--dt-pri,#6d5cff)!important;font-weight:800}
  .nav-cta:hover:not(.active){background:#f6f5ff}
  .account{display:flex;align-items:center;gap:10px}
  .avatar{width:35px;height:35px;display:grid;place-items:center;border-radius:50%;background:var(--dt-grad,linear-gradient(135deg,#6d5cff,#8b5cf6));color:#fff;font-weight:800;font-size:.8rem;box-shadow:0 6px 14px -6px rgba(109,92,255,.5)}
  .account-copy strong{font-size:.82rem;color:#0f1729}
  .account-copy small{color:#8a96b0;font-size:.68rem;margin-top:2px}
  .logout{width:35px;height:35px;display:grid;place-items:center;background:transparent;color:#5b6680;border:1px solid var(--dt-line2,#d7def0);border-radius:10px;cursor:pointer;transition:.18s}
  .logout:hover{background:#fff1f2;border-color:#fecdd3;color:#e11d48}
  .logout svg{width:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .menu-toggle{display:none;margin-left:auto;background:transparent;border:0;padding:8px;cursor:pointer}
  .menu-toggle span{display:block;width:20px;height:2px;border-radius:2px;background:#334155;margin:4px 0;transition:.2s}
  .menu-toggle[aria-expanded="true"] span:nth-child(1){transform:translateY(6px) rotate(45deg)}
  .menu-toggle[aria-expanded="true"] span:nth-child(2){opacity:0}
  .menu-toggle[aria-expanded="true"] span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
  main{width:min(1180px,calc(100% - 40px));margin:auto;flex:1;padding:34px 0 60px}
  footer{background:rgba(255,255,255,.72);border-top:1px solid var(--dt-line,#e5e9f7);backdrop-filter:blur(10px)}
  footer>div{width:min(1180px,calc(100% - 40px));margin:auto;padding:26px 0;display:grid;gap:4px;text-align:center}
  footer span{font-weight:850;color:#334155;letter-spacing:.01em}
  footer p{font-size:.78rem;color:#5b6680}
  footer small{color:#a2acc4;font-size:.68rem}
  @media(max-width:850px){.topbar-inner{flex-wrap:wrap;padding:12px 0}.menu-toggle{display:block}.nav-area{display:none;width:100%;flex-direction:column;align-items:stretch;padding:8px 0 14px}.nav-area.open{display:flex}nav{flex-direction:column;align-items:stretch;gap:2px}nav a{text-align:center;border-radius:10px;padding:11px}.account{justify-content:center;border-top:1px solid var(--dt-line,#e5e9f7);padding-top:14px}.account-copy{flex:1}.brand small{display:none}}
  @media(max-width:600px){.topbar-inner,main,footer>div{width:min(100% - 28px,1180px)}main{padding:24px 0 42px}footer>div{padding:22px 0;display:grid;gap:5px}footer small{margin-left:0}}
.nav-area.open {
    animation: navDrop 0.25s ease both;
  }
  @keyframes navDrop {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .brand-mark {
    transition: transform 0.25s cubic-bezier(0.22, 0.9, 0.34, 1),
      box-shadow 0.25s;
  }
  .brand:hover .brand-mark {
    transform: scale(1.06) rotate(-3deg);
    box-shadow: 0 10px 22px rgba(109, 92, 255, 0.45);
  }
  nav a {
    transition: background 0.18s, color 0.18s;
  }
  nav a.active {
    animation: navIn 0.3s cubic-bezier(0.22, 0.9, 0.34, 1) both;
  }
  @keyframes navIn {
    from {
      transform: scale(0.9);
    }
    to {
      transform: scale(1);
    }
  }
</style>