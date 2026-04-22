window.PAGE_PROPS=window.PAGE_PROPS??{};try{const e=document.querySelector("main")?.dataset.props||"{}";window.PAGE_PROPS=JSON.parse(e)}catch{window.PAGE_PROPS=window.PAGE_PROPS||{}}try{const e=document.getElementById("assistant-greeting");if(e){const n=window.PAGE_PROPS?.nombre||"Fabian";e.textContent=`¡Hola! Soy el asistente virtual de ${n}. ¿En qué puedo ayudarte hoy?`}}catch{}const h=document.getElementById("chat-toggle-btn"),f=document.getElementById("chat-close-btn"),i=document.getElementById("chat-window"),v=document.getElementById("chat-form"),a=document.getElementById("chat-input"),s=document.getElementById("chat-messages"),d=document.getElementById("send-btn");let u=!1,c=localStorage.getItem("chat_session_id");c||(c="User-"+crypto.randomUUID(),localStorage.setItem("chat_session_id",c));function b(){u=!u;const e=document.getElementById("chat-tooltip");u?(i?.classList.remove("scale-90","opacity-0","pointer-events-none","invisible"),i?.classList.add("scale-100","opacity-100"),h?.classList.add("chat-open"),e?.classList.add("hidden"),setTimeout(()=>a?.focus(),300)):(i?.classList.remove("scale-100","opacity-100"),i?.classList.add("scale-90","opacity-0","pointer-events-none","invisible"),h?.classList.remove("chat-open"),e?.classList.remove("hidden"))}h?.addEventListener("click",b);f?.addEventListener("click",b);try{const e=document.getElementById("initial-message-container");if(e){const t=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!0}).toLowerCase();e.innerHTML=`
                    <div class="mb-4">

                    </div>
                `}}catch{}function p(e,n){const t=n==="user",l=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!0}).toLowerCase();marked.setOptions({breaks:!0});const o=t?e:marked.parse(e),m=document.createElement("div");m.className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",m.innerHTML=`
                <div class="text-[10px] text-white-500 font-bold mb-1 ${t?"text-right pr-2":"pl-11"} uppercase tracking-wider">
                    ${t?"Tú":"Asistente AI"} <span class="font-normal opacity-95">${l}</span>
                </div>
                <div class="flex items-start gap-3 ${t?"justify-end":""}">
                    ${t?"":'<img src="/avatar.png" class="w-8 h-8 rounded-full border border-slate-700 shrink-0 object-cover" />'}
                    <div class="${t?"bg-[#50C878] text-[#021336] font-medium":"bg-slate-800 text-gray-200 border border-slate-700 markdown-chat"} p-3.5 rounded-2xl ${t?"rounded-tr-none":"rounded-tl-none"} text-sm shadow-lg max-w-[85%] break-words">
                        ${o}
                    </div>
                </div>
            `,s&&(s.appendChild(m),s.scrollTop=s.scrollHeight)}let g=!1;v?.addEventListener("submit",async e=>{if(e.preventDefault(),g)return;const n=(a?.value||"").trim();if(!n)return;g=!0,d&&(d.disabled=!0),p(n,"user"),a&&(a.value="");const t=document.createElement("div");t.id="loading-indicator",t.className="mb-6",t.innerHTML=`
                <div class="text-[10px] text-gray-500 font-bold mb-1 pl-11">ASISTENTE AI</div>
                <div class="flex items-start gap-3">
                    <img src="/avatar.png" class="w-8 h-8 rounded-full border border-slate-700 shrink-0 object-cover" />
                    <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1">
                        <span class="w-1.5 h-1.5 bg-[#50C878] rounded-full animate-bounce"></span>
                        <span class="w-1.5 h-1.5 bg-[#50C878] rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                        <span class="w-1.5 h-1.5 bg-[#50C878] rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                    </div>
                </div>
            `,s&&(s.appendChild(t),s.scrollTop=s.scrollHeight);try{const l=await(await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:n,session_id:c})})).json();document.getElementById("loading-indicator")?.remove(),p(l.reply,"bot");const o=document.getElementById("chat-status-text");o&&(o.className="text-xs text-[#50C878] font-mono flex items-center gap-1",o.innerHTML='<span class="w-2 h-2 bg-[#50C878] rounded-full"></span>Online')}catch(r){document.getElementById("loading-indicator")?.remove(),p("Lo siento, tuve un problema técnico de conexión. ¿Podrías intentar de nuevo?","bot"),console.error("Error en el chat:",r)}finally{g=!1,d&&(d.disabled=!1),a?.focus()}});
