/* Conversations stay in page memory; the server owns the model and knowledge. */
(() => {
  const launcher = document.querySelector('.ask-launcher');
  const dialog = document.querySelector('.ask-dialog');
  if (!launcher || !dialog || !dialog.showModal) return;
  launcher.hidden = false;
  const form = dialog.querySelector('form');
  const input = dialog.querySelector('textarea');
  const send = dialog.querySelector('.ask-send');
  const transcript = dialog.querySelector('.ask-transcript');
  const status = dialog.querySelector('.ask-status');
  const suggestions = dialog.querySelector('.ask-suggestions');
  const greeting = transcript.firstElementChild.cloneNode(true);
  let messages = [];
  let pending = null;
  let generation = 0;

  function addMessage(role, text) {
    const bubble = document.createElement('div');
    bubble.className = 'ask-message';
    bubble.dataset.role = role;
    const label = document.createElement('span');
    label.className = 'ask-message-label';
    label.textContent = role === 'user' ? 'YOU' : 'SPLAIN';
    bubble.append(label, document.createTextNode(text));
    transcript.insertBefore(bubble, suggestions);
    transcript.scrollTop = transcript.scrollHeight;
  }
  function close() {
    dialog.close();
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }
  launcher.addEventListener('click', () => {
    dialog.showModal();
    launcher.setAttribute('aria-expanded', 'true');
    input.focus();
  });
  dialog.querySelector('[data-ask-close]').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.querySelector('[data-ask-reset]').addEventListener('click', () => {
    generation++;
    pending?.abort();
    pending = null;
    messages = [];
    transcript.querySelectorAll('.ask-message').forEach(item => item.remove());
    transcript.prepend(greeting.cloneNode(true));
    suggestions.hidden = false;
    status.textContent = 'New conversation started.';
    input.value = '';
    input.disabled = false;
    send.disabled = false;
    input.focus();
  });
  dialog.querySelectorAll('.ask-links a').forEach(link => {
    if (link.getAttribute('href').startsWith('/')) link.addEventListener('click', close);
  });
  async function ask(text) {
    text = text.trim();
    if (!text || pending) return;
    if (text.length > 600) { status.textContent = 'Please keep your question under 600 characters.'; return; }
    const turn = generation;
    const controller = new AbortController();
    pending = controller;
    addMessage('user', text);
    input.value = '';
    suggestions.hidden = true;
    input.disabled = true;
    send.disabled = true;
    status.textContent = 'Splain is thinking…';
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch('/api/ask-splain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: text }].slice(-9) }),
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error('A few too many questions at once. Please try again in a minute.');
        throw new Error('The AI is unavailable right now. Please try again shortly, or explore the links below.');
      }
      const data = await response.json();
      if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('Splain couldn’t finish that reply. Please try again.');
      if (turn !== generation) return;
      addMessage('assistant', data.answer);
      messages.push({ role: 'user', content: text }, { role: 'assistant', content: data.answer });
      messages = messages.slice(-8);
      status.textContent = 'Reply ready.';
    } catch (error) {
      if (turn !== generation) return;
      status.textContent = error.name === 'AbortError' ? 'That reply took too long. Please try again.' : error.message;
      input.value = text;
    } finally {
      clearTimeout(timeout);
      if (turn === generation) {
        pending = null;
        input.disabled = false;
        send.disabled = false;
        if (dialog.open) input.focus();
      }
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); ask(input.value); }
  });
  suggestions.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button) ask(button.textContent);
  });
})();
