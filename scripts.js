(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    // Highlight current link in TOC and sidebar (if present)
    const current = window.location.pathname.split('/').pop();

    const markLinks = (selector) => {
      const links = Array.from(document.querySelectorAll(selector));
      links.forEach(a => {
        const href = a.getAttribute('href') || '';
        // normalize and check if link ends with the current file
        if (href === current || href.endsWith('/' + current) || href === './' + current) {
          a.style.color = 'var(--accent)';
          a.style.fontWeight = '700';
          a.setAttribute('aria-current', 'page');
        }
      });
    };

    markLinks('.toc a');
    markLinks('.sidebar a');

    const sidebarDesktop = document.querySelector('.sidebar');
    const toggleDesktop = document.querySelector('.sidebar-toggle');
    const mainContent = document.querySelector('.main-content');
    
    if (toggleDesktop && sidebarDesktop && window.matchMedia('(min-width: 900px)').matches) {
      toggleDesktop.addEventListener('click', () => {
        sidebarDesktop.classList.toggle('sidebar--collapsed');
        if (mainContent) mainContent.classList.toggle('sidebar--collapsed');

        localStorage.setItem('sidebar-collapsed', sidebarDesktop.classList.contains('sidebar--collapsed'));
      });
      

      if (localStorage.getItem('sidebar-collapsed') === 'true') {
        sidebarDesktop.classList.add('sidebar--collapsed');
        if (mainContent) mainContent.classList.add('sidebar--collapsed');
      }
    }


    const sidebar = document.querySelector('.sidebar');
    let overlayEl = null;

    const closeSidebar = () => {
      if (!sidebar) return;
      sidebar.classList.remove('sidebar--open');
      if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    };

    const openSidebar = () => {
      if (!sidebar) return;
      sidebar.classList.add('sidebar--open');
      overlayEl = document.createElement('div');
      overlayEl.className = 'sidebar-overlay';
      overlayEl.addEventListener('click', closeSidebar);
      document.body.appendChild(overlayEl);
    };

    if (toggleDesktop && sidebar && window.matchMedia('(max-width: 899px)').matches) {
      toggleDesktop.addEventListener('click', () => {
        if (sidebar.classList.contains('sidebar--open')) closeSidebar(); else openSidebar();
      });
    }


    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') closeSidebar();
    });


    (function setupRatingWidget(){
      const ratingKey = 'tutorial_rating_votes';
      const ratedFlag = 'tutorial_rated';
      const ratedValueKey = 'tutorial_rated_value';
      const stars = Array.from(document.querySelectorAll('.rating-stars .star'));
      const submitBtn = document.getElementById('submit-rating');
  
      const ratingActionsContainer = document.querySelector('.rating-actions');
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.id = 'remove-rating';
      removeBtn.className = 'btn-delete';
      removeBtn.textContent = 'Quitar valoración';
      removeBtn.style.display = 'none';
      if (ratingActionsContainer) {

        const summaryNode = ratingActionsContainer.querySelector('.rating-summary');
        if (summaryNode) ratingActionsContainer.insertBefore(removeBtn, summaryNode);
        else ratingActionsContainer.appendChild(removeBtn);
      }
      const avgEl = document.getElementById('rating-average');
      const countEl = document.getElementById('rating-count');

      function loadVotes(){
        try{ return JSON.parse(localStorage.getItem(ratingKey)) || []; }catch(e){return []}
      }
      function saveVotes(votes){
        try{ localStorage.setItem(ratingKey, JSON.stringify(votes)); }catch(e){}
      }
      function computeAverage(votes){
        if(!votes || votes.length===0) return 0;
        return votes.reduce((s,v)=>s+v,0)/votes.length;
      }
      function updateSummary(){
        const votes = loadVotes();
        const avg = computeAverage(votes);
        if(avgEl) avgEl.textContent = (votes.length? avg.toFixed(1) + '★' : '—');
        if(countEl) countEl.textContent = `(${votes.length} valoraci${votes.length===1?'ón':'ones'})`;
  
        const rounded = Math.round(avg);
        if(stars && stars.length){
          stars.forEach(s => {
            const v = parseInt(s.dataset.value,10);
            s.classList.toggle('selected', v <= rounded);
          });
        }
      }
      function setStarsForValue(val, interactive){
        if(!stars) return;
        stars.forEach(s=>{
          const v = parseInt(s.dataset.value,10);
          s.classList.toggle('selected', v <= val);
          if(interactive){ s.classList.remove('locked'); } 
        });
      }

      let selectedValue = 0;

      if(stars && stars.length){
        stars.forEach(s => {
          const val = parseInt(s.dataset.value,10);
          s.addEventListener('mouseover', ()=> setStarsForValue(val, true));
          s.addEventListener('focus', ()=> setStarsForValue(val, true));
          s.addEventListener('mouseout', ()=> setStarsForValue(selectedValue, true));
          s.addEventListener('blur', ()=> setStarsForValue(selectedValue, true));
          s.addEventListener('click', ()=>{
            selectedValue = val;
            stars.forEach(ss=> ss.setAttribute('aria-checked','false'));
            s.setAttribute('aria-checked','true');
            setStarsForValue(val, true);
          });
        });
      }

      if(submitBtn){
        submitBtn.addEventListener('click', ()=>{
          if(!selectedValue){ alert('Por favor selecciona una puntuación antes de enviar.'); return; }
          if(localStorage.getItem(ratedFlag)){
            alert('Gracias — ya has valorado este tutorial.');
            return;
          }
          const votes = loadVotes();
          votes.push(selectedValue);
          saveVotes(votes);
          localStorage.setItem(ratedFlag, 'true');
          localStorage.setItem(ratedValueKey, String(selectedValue));
          if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Valoración enviada'; }
          // lock visual
          if(stars && stars.length) stars.forEach(s=> s.classList.add('locked'));
          // show remove button so user can undo
          if(removeBtn) removeBtn.style.display = 'inline-block';
          updateSummary();
        });
      }


      updateSummary();
      if(localStorage.getItem(ratedFlag)){
        const last = parseInt(localStorage.getItem(ratedValueKey),10) || 0;
        selectedValue = last;
        if(stars && stars.length) setStarsForValue(selectedValue, false);
        if(stars && stars.length) stars.forEach(s=> s.classList.add('locked'));
        if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Ya has valorado'; }
        // show remove button when rating exists
        if(removeBtn) removeBtn.style.display = 'inline-block';
      }


      if(removeBtn){
        removeBtn.addEventListener('click', ()=>{
          if(!confirm('¿Quieres eliminar tu valoración de este tutorial?')) return;
          const votes = loadVotes();
          const myVal = parseInt(localStorage.getItem(ratedValueKey),10);
 
          const idx = votes.indexOf(myVal);
          if(idx !== -1){ votes.splice(idx,1); saveVotes(votes); }

          localStorage.removeItem(ratedFlag);
          localStorage.removeItem(ratedValueKey);
          if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = 'Enviar valoración'; }
          if(stars && stars.length) stars.forEach(s=> s.classList.remove('locked'));
          if(removeBtn) removeBtn.style.display = 'none';
          updateSummary();
          alert('Tu valoración ha sido eliminada.');
        });
      }
    })();


    (function setupComments(){
      const USER_KEY = 'tutorial_user_id';
      const COMMENTS_KEY = 'tutorial_comments';

      let userId = localStorage.getItem(USER_KEY);
      if(!userId){ userId = 'user_' + Date.now() + '_' + Math.floor(Math.random()*10000); localStorage.setItem(USER_KEY, userId); }

      const form = document.getElementById('comment-form');
      const listEl = document.getElementById('comments-list');

      function loadComments(){ try{ return JSON.parse(localStorage.getItem(COMMENTS_KEY)) || []; }catch(e){ return []; } }
      function saveComments(list){ try{ localStorage.setItem(COMMENTS_KEY, JSON.stringify(list)); }catch(e){} }

      function renderComments(){
        let items = loadComments();

        const sortOrder = window.getCurrentSortOrder ? window.getCurrentSortOrder() : 'newest';
        if(sortOrder === 'newest'){
          items.sort((a,b)=> b.createdAt - a.createdAt);
        } else {
          items.sort((a,b)=> a.createdAt - b.createdAt);
        }
        if(!listEl) return;
        listEl.innerHTML = '';
        if(items.length === 0){
          const empty = document.createElement('div'); empty.className = 'comment';
          const pa = document.createElement('p'); pa.className = 'comment-author'; pa.innerHTML = '<strong>Sin comentarios aún</strong>';
          const pt = document.createElement('p'); pt.className = 'comment-text'; pt.textContent = 'Sé el primero en comentar.';
          empty.appendChild(pa); empty.appendChild(pt);
          listEl.appendChild(empty);
          return;
        }

        items.forEach(c => {
          const wrapper = document.createElement('div'); wrapper.className = 'comment-wrapper';
          const el = document.createElement('div'); el.className = 'comment';
          const author = document.createElement('p'); author.className = 'comment-author';
          const nameText = document.createElement('strong'); nameText.textContent = c.name || 'Anónimo';
          author.appendChild(nameText);
          if(c.email){ const em = document.createElement('span'); em.style.marginLeft = '8px'; em.style.opacity = '0.8'; em.textContent = c.email; author.appendChild(em); }

          const text = document.createElement('p'); text.className = 'comment-text'; text.textContent = c.text;
          const meta = document.createElement('div'); meta.className = 'comment-meta'; meta.style.fontSize='0.85rem'; meta.style.color='#6b7b82'; meta.style.marginTop='8px';
          meta.textContent = new Date(c.createdAt).toLocaleString();

          el.appendChild(author); el.appendChild(text); el.appendChild(meta);


          const actions = document.createElement('div'); actions.className = 'comment-actions';
          const replyBtn = document.createElement('button'); replyBtn.type = 'button'; replyBtn.className = 'btn-edit'; replyBtn.textContent = 'Responder';
          actions.appendChild(replyBtn);

          if(c.ownerId === userId){
            const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'btn-edit'; edit.textContent = 'Editar';
            const del = document.createElement('button'); del.type = 'button'; del.className = 'btn-delete'; del.textContent = 'Eliminar';
            edit.addEventListener('click', ()=> enterEditMode(c, el));
            del.addEventListener('click', ()=>{
              if(!confirm('¿Eliminar este comentario?')) return;
              const remaining = loadComments().filter(x => x.id !== c.id);
              saveComments(remaining);
              renderComments();
            });
            actions.appendChild(edit); actions.appendChild(del);
          }

          replyBtn.addEventListener('click', ()=> enterReplyMode(c, wrapper));
          el.appendChild(actions);
          wrapper.appendChild(el);

  
          if(c.replies && c.replies.length > 0){
            const repliesContainer = document.createElement('div'); repliesContainer.className = 'replies';
            c.replies.sort((a,b)=> a.createdAt - b.createdAt).forEach(reply => {
              const replyEl = document.createElement('div'); replyEl.className = 'comment reply';
              const rauthor = document.createElement('p'); rauthor.className = 'comment-author';
              const rnameText = document.createElement('strong'); rnameText.textContent = reply.name || 'Anónimo'; rauthor.appendChild(rnameText);
              if(reply.email){ const rem = document.createElement('span'); rem.style.marginLeft = '6px'; rem.style.opacity = '0.8'; rem.textContent = reply.email; rauthor.appendChild(rem); }

              const rtext = document.createElement('p'); rtext.className = 'comment-text'; rtext.textContent = reply.text;
              const rmeta = document.createElement('div'); rmeta.className = 'comment-meta'; rmeta.style.fontSize='0.85rem'; rmeta.style.color='#6b7b82'; rmeta.style.marginTop='6px';
              rmeta.textContent = new Date(reply.createdAt).toLocaleString();

              replyEl.appendChild(rauthor); replyEl.appendChild(rtext); replyEl.appendChild(rmeta);


              if(reply.ownerId === userId){
                const ractions = document.createElement('div'); ractions.className = 'comment-actions';
                const redit = document.createElement('button'); redit.type = 'button'; redit.className = 'btn-edit'; redit.textContent = 'Editar';
                const rdel = document.createElement('button'); rdel.type = 'button'; rdel.className = 'btn-delete'; rdel.textContent = 'Eliminar';
                redit.addEventListener('click', ()=> enterEditReplyMode(c, reply, replyEl));
                rdel.addEventListener('click', ()=>{
                  if(!confirm('¿Eliminar esta respuesta?')) return;
                  const all = loadComments();
                  const parentIdx = all.findIndex(x => x.id === c.id);
                  if(parentIdx !== -1){ all[parentIdx].replies = (all[parentIdx].replies||[]).filter(x => x.id !== reply.id); saveComments(all); }
                  renderComments();
                });
                ractions.appendChild(redit); ractions.appendChild(rdel);
                replyEl.appendChild(ractions);
              }

              repliesContainer.appendChild(replyEl);
            });
            wrapper.appendChild(repliesContainer);
          }

          listEl.appendChild(wrapper);
        });


        function enterEditMode(comment, containerEl){
          containerEl.innerHTML = '';
          const author = document.createElement('p'); author.className = 'comment-author'; const nameText = document.createElement('strong'); nameText.textContent = comment.name || 'Anónimo'; author.appendChild(nameText);
          if(comment.email){ const em = document.createElement('span'); em.style.marginLeft='8px'; em.style.opacity='0.8'; em.textContent = comment.email; author.appendChild(em); }

          const textarea = document.createElement('textarea'); textarea.className = 'comment-edit-text'; textarea.rows = 4; textarea.style.width='100%'; textarea.value = comment.text;

          const controls = document.createElement('div'); controls.className = 'comment-actions'; controls.style.marginTop = '8px';
          const saveBtn = document.createElement('button'); saveBtn.type='button'; saveBtn.className='btn-save'; saveBtn.textContent='Guardar';
          const cancelBtn = document.createElement('button'); cancelBtn.type='button'; cancelBtn.className='btn-cancel'; cancelBtn.textContent='Cancelar';

          saveBtn.addEventListener('click', ()=>{
            const textNew = textarea.value.trim(); if(!textNew){ alert('El comentario no puede estar vacío.'); return; }
            const all = loadComments();
            const idx = all.findIndex(x => x.id === comment.id);
            if(idx === -1) return;
            all[idx].text = textNew;
            all[idx].editedAt = Date.now();
            saveComments(all);
            renderComments();
          });

          cancelBtn.addEventListener('click', ()=>{ renderComments(); });

          containerEl.appendChild(author); containerEl.appendChild(textarea); controls.appendChild(saveBtn); controls.appendChild(cancelBtn); containerEl.appendChild(controls);
        }


        function enterReplyMode(parentComment, wrapperEl){
          const replyForm = document.createElement('div'); replyForm.style.marginTop = '12px'; replyForm.style.padding = '12px'; replyForm.style.background = 'var(--bg-secondary)'; replyForm.style.borderRadius = '6px';
          
          const nameInput = document.createElement('input'); nameInput.type = 'text'; nameInput.placeholder = 'Tu nombre'; nameInput.style.width = '100%'; nameInput.style.padding = '8px'; nameInput.style.marginBottom = '8px'; nameInput.style.borderRadius = '4px'; nameInput.style.border = '1px solid var(--border)';
          nameInput.value = localStorage.getItem('tutorial_user_name') || '';
          
          const emailInput = document.createElement('input'); emailInput.type = 'email'; emailInput.placeholder = 'Tu correo (opcional)'; emailInput.style.width = '100%'; emailInput.style.padding = '8px'; emailInput.style.marginBottom = '8px'; emailInput.style.borderRadius = '4px'; emailInput.style.border = '1px solid var(--border)';
          emailInput.value = localStorage.getItem('tutorial_user_email') || '';
          
          const textarea = document.createElement('textarea'); textarea.placeholder = 'Escribe tu respuesta...'; textarea.rows = 3; textarea.style.width = '100%'; textarea.style.padding = '8px'; textarea.style.marginBottom = '8px'; textarea.style.borderRadius = '4px'; textarea.style.border = '1px solid var(--border)'; textarea.style.fontFamily = 'inherit';
          
          const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.gap = '8px';
          
          const submitReply = document.createElement('button'); submitReply.type = 'button'; submitReply.className = 'btn-submit'; submitReply.textContent = 'Enviar respuesta';
          const cancelReply = document.createElement('button'); cancelReply.type = 'button'; cancelReply.className = 'btn-cancel'; cancelReply.textContent = 'Cancelar';
          
          submitReply.addEventListener('click', ()=>{
            const name = nameInput.value.trim(); const email = emailInput.value.trim(); const text = textarea.value.trim();
            if(!name || !text){ alert('Por favor escribe tu nombre y respuesta.'); return; }
            const all = loadComments();
            const parentIdx = all.findIndex(x => x.id === parentComment.id);
            if(parentIdx === -1) return;
            if(!all[parentIdx].replies) all[parentIdx].replies = [];
            const reply = { id: 'r_' + Date.now() + '_' + Math.floor(Math.random()*10000), ownerId: userId, name, email, text, createdAt: Date.now() };
            all[parentIdx].replies.push(reply);
            try{ localStorage.setItem('tutorial_user_name', name); if(email) localStorage.setItem('tutorial_user_email', email); }catch(e){}
            saveComments(all);
            renderComments();
          });
          
          cancelReply.addEventListener('click', ()=>{ renderComments(); });
          
          actions.appendChild(submitReply); actions.appendChild(cancelReply);
          replyForm.appendChild(nameInput); replyForm.appendChild(emailInput); replyForm.appendChild(textarea); replyForm.appendChild(actions);
          wrapperEl.appendChild(replyForm);
        }


        function enterEditReplyMode(parentComment, reply, replyEl){
          replyEl.innerHTML = '';
          const textarea = document.createElement('textarea'); textarea.placeholder = 'Edita tu respuesta...'; textarea.rows = 3; textarea.style.width = '100%'; textarea.style.padding = '8px'; textarea.style.marginBottom = '8px'; textarea.style.borderRadius = '4px'; textarea.style.border = '1px solid var(--border)'; textarea.style.fontFamily = 'inherit'; textarea.value = reply.text;
          
          const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.gap = '8px';
          const saveBtn = document.createElement('button'); saveBtn.type = 'button'; saveBtn.className = 'btn-save'; saveBtn.textContent = 'Guardar';
          const cancelBtn = document.createElement('button'); cancelBtn.type = 'button'; cancelBtn.className = 'btn-cancel'; cancelBtn.textContent = 'Cancelar';
          
          saveBtn.addEventListener('click', ()=>{
            const textNew = textarea.value.trim(); if(!textNew){ alert('La respuesta no puede estar vacía.'); return; }
            const all = loadComments();
            const parentIdx = all.findIndex(x => x.id === parentComment.id);
            if(parentIdx !== -1){ const replyIdx = all[parentIdx].replies.findIndex(x => x.id === reply.id); if(replyIdx !== -1){ all[parentIdx].replies[replyIdx].text = textNew; all[parentIdx].replies[replyIdx].editedAt = Date.now(); } }
            saveComments(all);
            renderComments();
          });
          
          cancelBtn.addEventListener('click', ()=>{ renderComments(); });
          
          actions.appendChild(saveBtn); actions.appendChild(cancelBtn);
          replyEl.appendChild(textarea); replyEl.appendChild(actions);
        }
      }

      if(form){

        const savedName = localStorage.getItem('tutorial_user_name');
        const savedEmail = localStorage.getItem('tutorial_user_email');
        if(savedName){ const n = form.querySelector('#name'); if(n) n.value = savedName; }
        if(savedEmail){ const e = form.querySelector('#email'); if(e) e.value = savedEmail; }

        form.addEventListener('submit', (ev)=>{
          ev.preventDefault();
          const nameEl = form.querySelector('#name');
          const emailEl = form.querySelector('#email');
          const commentEl = form.querySelector('#comment');
          if(!nameEl || !commentEl) return;
          const name = nameEl.value.trim();
          const email = (emailEl? emailEl.value.trim() : '');
          const text = commentEl.value.trim();
          if(!name || !text){ alert('Por favor escribe tu nombre y comentario.'); return; }

          const comments = loadComments();
          const obj = {
            id: 'c_' + Date.now() + '_' + Math.floor(Math.random()*10000),
            ownerId: userId,
            name: name,
            email: email,
            text: text,
            createdAt: Date.now()
          };
          comments.push(obj);
          saveComments(comments);
       
          try{ localStorage.setItem('tutorial_user_name', name); if(email) localStorage.setItem('tutorial_user_email', email); }catch(e){}
          form.reset();
          renderComments();

          setTimeout(()=>{ const first = listEl.querySelector('.comment'); if(first) first.scrollIntoView({behavior:'smooth'}); },50);
        });
      }


      renderComments();
    })();
  });


  (function setupDarkMode(){
    const toggle = document.getElementById('dark-mode-toggle');
    const darkModeKey = 'tutorial_dark_mode';
    
    // Check localStorage for preference
    const isDarkMode = localStorage.getItem(darkModeKey) === 'true';
    if(isDarkMode){ document.documentElement.classList.add('dark-mode'); toggle.textContent = '☀️'; }
    
    if(toggle){
      toggle.addEventListener('click', ()=>{
        const isNowDark = document.documentElement.classList.toggle('dark-mode');
        localStorage.setItem(darkModeKey, String(isNowDark));
        toggle.textContent = isNowDark ? '☀️' : '🌙';
      });
    }
  })();


  (function setupCommentsFilter(){
    const sortSelect = document.getElementById('sort-comments');
    const listEl = document.getElementById('comments-list');
    const sortKey = 'comments_sort_order';
    
 
    const savedSort = localStorage.getItem(sortKey) || 'newest';
    if(sortSelect) sortSelect.value = savedSort;
    
    if(sortSelect){
      sortSelect.addEventListener('change', (e)=>{
        const sortOrder = e.target.value;
        localStorage.setItem(sortKey, sortOrder);
        // re-render with new sort order
        renderComments();
      });
    }

    window.getCurrentSortOrder = ()=> sortSelect ? sortSelect.value : 'newest';
  })();

})();
