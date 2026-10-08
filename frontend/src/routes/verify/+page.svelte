<script lang="ts">
  import { api } from '$lib/api'; import { page } from '$app/stores';
  let verifyFile=$state<File|null>(null); let verifyResult=$state<any>(null); let verifying=$state(false); let error=$state('');
  $effect(()=>{const id=$page.url.searchParams.get('doc');if(id)loadInfo(id)});
  async function loadInfo(id:string){const result=await api.getVerificationInfo(id);if(result.success&&result.data)verifyResult={type:'info',data:result.data}}
  function choose(e:Event){const f=(e.target as HTMLInputElement).files?.[0];if(f){verifyFile=f;verifyResult=null;error=''}}
  async function submit(e:Event){e.preventDefault();if(!verifyFile)return;verifying=true;error='';const r=await api.verifyDocument(verifyFile);if(r.success&&r.data)verifyResult={type:'verify',data:r.data};else error=r.error||'No se pudo verificar el archivo';verifying=false}
  function color(s:string){return s==='VALID'?'#059669':s==='NOT_FOUND'?'#d97706':'#dc2626'} function label(s:string){return s==='VALID'?'Documento íntegro':s==='MANIPULATED'?'Documento manipulado':s==='INVALID_SIGNATURE'?'Firma inválida':s==='FOUND'?'Coincidencia encontrada':'Documento no encontrado'}
</script>
<svelte:head><title>Verificar documento · DocuTrust</title></svelte:head>
<div class="verify-page"><div class="intro anim-rise"><span class="eyebrow">Verificación pública</span><h1>Comprueba la autenticidad<br>de un <span class="dt-grad-text">documento.</span></h1><p>Sube el archivo original para comparar su hash y validar la firma digital registrada.</p></div><section class="verify-card anim-pop d1"><form onsubmit={submit}><label class="drop" class:has-file={verifyFile} for="file"><span class="drop-icon">↥</span><strong>{verifyFile?'Archivo listo para verificar':'Arrastra o selecciona tu archivo'}</strong><small>{verifyFile ? verifyFile.name + ' · ' + (verifyFile.size/1024).toFixed(1) + ' KB' : 'PDF, Word o texto · máximo 10 MB'}</small><input id="file" type="file" onchange={choose} required disabled={verifying}></label><button class="submit" type="submit" disabled={verifying||!verifyFile}>{verifying?'Analizando integridad…':'Verificar documento'} <span>→</span></button></form>{#if error}<div class="alert error anim-shake">⚠ {error}</div>{/if}{#if verifyResult}{#if verifyResult.type==='info'}<div class="result info anim-pop"><span class="result-icon">i</span><div><strong>{verifyResult.data.document.title}</strong><p>Versión actual: v{verifyResult.data.document.currentVersion} · Firmado por {verifyResult.data.signature.signedBy}</p><small>Sube el archivo para confirmar su integridad.</small></div></div>{:else}<div class="result anim-pop" style={'--accent:'+color(verifyResult.data.status)}><div class="result-head"><span class="status-icon">{verifyResult.data.status==='VALID'?'✓':'!'}</span><div><strong>{label(verifyResult.data.status)}</strong><p>{verifyResult.data.message}</p></div></div>{#if verifyResult.data.verification}<div class="checks stagger"><div><span>Hash SHA-256</span><b class:bad={!verifyResult.data.verification.hashMatch}>{verifyResult.data.verification.hashMatch?'Coincide':'No coincide'}</b></div><div><span>Firma digital</span><b class:bad={!verifyResult.data.verification.signatureValid}>{verifyResult.data.verification.signatureValid?'Válida':'Inválida'}</b></div></div><small class="signed">Firmado por <b>{verifyResult.data.verification.signedBy}</b> · {verifyResult.data.verification.signedAt}</small>{/if}</div>{/if}{/if}</section><p class="legal">La firma criptográfica es válida dentro de DocuTrust y no constituye firma electrónica certificada.</p></div>
<style>
  .verify-page{max-width:760px;margin:auto;padding:24px 0}
  .intro{margin-bottom:27px}
  .eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 13px;border-radius:999px;background:#fff;color:var(--dt-pri);font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--dt-line2);box-shadow:0 6px 18px -8px rgba(109,92,255,.35)}
  .eyebrow::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--dt-grad);box-shadow:0 0 0 4px rgba(139,92,246,.16);animation:dtPulse 2.4s ease-out infinite}
  .intro h1{font-size:clamp(2rem,5vw,3.4rem);line-height:1.06;letter-spacing:-.055em;color:var(--dt-ink);margin:14px 0}
  .intro p{max-width:590px;color:var(--dt-body);font-size:.95rem;line-height:1.65}
  .verify-card{position:relative;overflow:hidden;background:#fff;border:1px solid var(--dt-line);border-radius:22px;padding:26px;box-shadow:var(--dt-shadow-lg)}
  .verify-card::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:var(--dt-grad-hot)}
  .drop{display:grid;place-items:center;gap:7px;min-height:200px;border:1.5px dashed var(--dt-line2);border-radius:16px;background:linear-gradient(160deg,#fbfcff,#f4f1ff);color:#47526b;cursor:pointer;text-align:center;padding:20px;transition:border-color .18s,background .18s,transform .18s}
  .drop:hover,.drop.has-file{border-color:var(--dt-pri);background:#f3f0ff;transform:translateY(-1px)}
  .drop-icon{width:46px;height:46px;display:grid;place-items:center;background:var(--dt-grad);color:#fff;border-radius:14px;font-size:1.6rem;font-weight:900;box-shadow:var(--dt-glow-sm)}
  .drop strong{font-size:.92rem;color:var(--dt-ink)}
  .drop small{color:var(--dt-mute);font-size:.72rem}
  .drop input{display:none}
  .drop.has-file .drop-icon{animation:ringPulse 2s ease-out infinite}
  .submit{width:100%;margin-top:14px;padding:14px;border:0;border-radius:12px;background:var(--dt-grad);color:#fff;font-weight:800;cursor:pointer;display:flex;justify-content:center;gap:16px;box-shadow:var(--dt-glow-sm);transition:transform .16s,box-shadow .16s,filter .16s}
  .submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:var(--dt-glow);filter:brightness(1.04)}
  .submit:disabled{opacity:.55}
  .alert{padding:12px;border-radius:12px;margin-top:15px;font-size:.77rem}
  .error{background:var(--dt-err-bg);border:1px solid var(--dt-err-line);color:#be123c}
  .result{--accent:var(--dt-pri);margin-top:19px;border:1px solid var(--dt-line);border-left:4px solid var(--accent);border-radius:14px;padding:19px;background:#fff;box-shadow:var(--dt-shadow)}
  .result-head,.result.info{display:flex;gap:12px;align-items:flex-start}
  .status-icon,.result-icon{width:33px;height:33px;display:grid;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--accent) 12%,#fff);color:var(--accent);font-weight:900;flex:none;border:1px solid color-mix(in srgb,var(--accent) 28%,#fff)}
  .result-head strong,.result.info strong{font-size:1rem;color:var(--dt-ink)}
  .result-head p,.result.info p{font-size:.78rem;color:var(--dt-body);margin-top:4px}
  .result.info small{display:block;color:var(--dt-mute);font-size:.7rem;margin-top:6px}
  .checks{display:grid;grid-template-columns:1fr 1fr;gap:10px;border-top:1px solid var(--dt-line);border-bottom:1px solid var(--dt-line);margin:16px 0;padding:14px 0}
  .checks div{padding:10px 12px;background:#fafbff;border:1px solid var(--dt-line);border-radius:11px}
  .checks span,.checks b{display:block}
  .checks span{font-size:.69rem;color:var(--dt-mute)}
  .checks b{font-size:.8rem;color:#059669;margin-top:4px}
  .checks b.bad{color:#dc2626}
  .signed{color:var(--dt-body);font-size:.72rem}
  .signed b{color:#35415c}
  .legal{color:#92400e;background:var(--dt-warn-bg);border:1px solid var(--dt-warn-line);border-radius:12px;padding:13px;margin-top:15px;font-size:.7rem}
  @media(max-width:520px){.verify-page{padding-top:8px}.verify-card{padding:17px}.checks{grid-template-columns:1fr}}
</style>