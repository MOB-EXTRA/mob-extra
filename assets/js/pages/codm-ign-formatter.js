(() => {
  const input = document.querySelector('#ignText');
  if (!input) return;

  const preview = document.querySelector('#ignPreview');
  const characterCount = document.querySelector('#charCount');
  const message = document.querySelector('#toolMessage');
  const controlPanel = document.querySelector('#formatterControlPanel');
  const mobileViewport = window.matchMedia('(max-width: 760px)');
  const spaces = {
    hangul: '\u3164',
    nbsp: '\u00a0',
    braille: '\u2800',
    enquad: '\u2000'
  };
  let selectedSpace = spaces.hangul;

  function updateMobileEditorLayout() {
    const activeElement = document.activeElement;
    const hasFocus = activeElement === input || controlPanel.contains(activeElement);
    document.documentElement.classList.toggle(
      'formatter-mobile-editor-active',
      mobileViewport.matches && hasFocus
    );
  }

  function updatePreview() {
    const text = input.value;
    preview.textContent = text ? text.replace(/ /g, selectedSpace) : 'Your formatted name appears here';
    characterCount.textContent = [...text].length;
  }

  function insertSelectedSpace() {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const replacedLength = [...input.value.slice(start, end)].length;
    if ([...input.value].length - replacedLength + 1 > 14) return;

    input.setRangeText(selectedSpace, start, end, 'end');
    updatePreview();
  }

  input.addEventListener('input', () => {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const normalized = input.value.replace(/ /g, selectedSpace);
    if (normalized !== input.value) {
      input.value = normalized;
      input.setSelectionRange(start, end);
    }
    updatePreview();
  });
  input.addEventListener('focus', () => {
    updateMobileEditorLayout();
    if (mobileViewport.matches) input.scrollIntoView({ block: 'start' });
  });
  input.addEventListener('blur', () => requestAnimationFrame(updateMobileEditorLayout));
  controlPanel.addEventListener('focusin', updateMobileEditorLayout);
  controlPanel.addEventListener('focusout', () => requestAnimationFrame(updateMobileEditorLayout));
  window.addEventListener('resize', updateMobileEditorLayout);

  document.querySelector('#insertSpace').addEventListener('click', () => {
    insertSelectedSpace();
    input.focus();
  });

  document.querySelector('#copyBlank').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(selectedSpace);
      message.textContent = 'Selected Unicode space copied.';
    } catch {
      message.textContent = 'Clipboard access is unavailable in this browser.';
    }
  });

  document.querySelector('#clearIgn').addEventListener('click', () => {
    input.value = '';
    updatePreview();
    message.textContent = 'Text cleared.';
  });

  document.querySelectorAll('[data-space]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-space]').forEach(candidate => {
        candidate.classList.toggle('active', candidate === button);
        candidate.setAttribute('aria-pressed', String(candidate === button));
      });

      const previousSpace = selectedSpace;
      selectedSpace = spaces[button.dataset.space] || spaces.hangul;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.value = input.value.split(previousSpace).join(selectedSpace).replace(/ /g, selectedSpace);
      input.setSelectionRange(start, end);
      updatePreview();
      if (mobileViewport.matches) input.focus({ preventScroll: true });
    });
  });

  document.querySelector('#copyIgn').addEventListener('click', async () => {
    if (!input.value) {
      message.textContent = 'Enter a name or phrase first.';
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(input.value.replace(/ /g, selectedSpace));
      message.textContent = 'Formatted text copied. Test it in-game before saving.';
    } catch {
      message.textContent = 'Clipboard access is unavailable in this browser.';
    }
  });

  updatePreview();
  updateMobileEditorLayout();
})();
