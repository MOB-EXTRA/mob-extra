(() => {
  const input = document.querySelector('#ignText');
  if (!input) return;

  const preview = document.querySelector('#ignPreview');
  const characterCount = document.querySelector('#charCount');
  const message = document.querySelector('#toolMessage');
  let selectedSpace = '\u3164';

  function updatePreview() {
    const text = input.value;
    preview.textContent = text ? text.replace(/ /g, selectedSpace) : 'Your formatted name appears here';
    characterCount.textContent = [...text].length;
  }

  input.addEventListener('input', updatePreview);

  document.querySelector('#insertSpace').addEventListener('click', () => {
    if ([...input.value].length >= 14) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.slice(0, start) + selectedSpace + input.value.slice(end);
    input.setSelectionRange(start + 1, start + 1);
    input.focus();
    updatePreview();
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

      const spaces = {
        hangul: '\u3164',
        nbsp: '\u00a0',
        braille: '\u2800',
        enquad: '\u2000'
      };
      selectedSpace = spaces[button.dataset.space] || spaces.hangul;
      updatePreview();
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
})();
