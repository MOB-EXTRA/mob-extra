(() => {
  const root = document.querySelector('[data-ptb-root]');
  if (!root) return;

  const sourceUrls = [1, 2, 3].map(number =>
    `https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.${number}/codm-test-server/codm-config.js`
  );

  function loadConfig(index = 0) {
    if (index >= sourceUrls.length) {
      return Promise.reject(new Error('All PTB repositories are unavailable.'));
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = sourceUrls[index];
      script.async = true;
      script.onload = () => {
        try {
          if (typeof testServerData === 'undefined') {
            throw new Error('No test build data was provided.');
          }

          const data = testServerData;
          resolve({
            data: {
              isOpen: data.status === 1,
              lastUpdated: data.lastUpdated || '',
              season: data.season || '',
              releaseDate: data.releaseDate || '',
              description: data.updateDescription || '',
              links: Array.isArray(data.links) ? data.links.map(link => ({
                platform: link.device || '',
                url: link.url || ''
              })).filter(link => link.platform && /^https:\/\//.test(link.url)) : [],
              verification: typeof notARobot === 'undefined' ? null : {
                code: String(notARobot.code || ''),
                source: notARobot.codeSource || ''
              }
            },
            repository: index + 1
          });
        } catch {
          script.remove();
          loadConfig(index + 1).then(resolve, reject);
        }
      };
      script.onerror = () => {
        script.remove();
        loadConfig(index + 1).then(resolve, reject);
      };
      document.head.append(script);
    });
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function render(data, repository) {
    root.replaceChildren();
    root.append(element('span', 'small-label', `LIVE TEST BUILD STATUS · REPOSITORY ${repository}`));

    const status = element('div', 'ptb-status', data.isOpen ? 'OPEN' : 'CLOSED');
    status.prepend(element('span', `ptb-status-dot${data.isOpen ? ' is-open' : ''}`));
    root.append(status, element('h2', '', data.season || 'CODM public test build'));

    if (data.description) root.append(element('p', '', data.description));

    const updated = element('p', 'ptb-last-updated');
    updated.textContent = `Source update: ${data.lastUpdated || 'not listed'} · Build date: ${data.releaseDate || 'not listed'}`;
    root.append(updated);

    if (!data.isOpen) {
      root.append(element('p', 'ptb-closed-note', 'The latest shared source reports that the public test is closed. Active links will appear here when the source repository publishes a new open test period.'));
      return;
    }

    if (!data.links.length) {
      root.append(element('p', 'ptb-closed-note', 'The source reports an open test period but has no valid download links yet.'));
      return;
    }

    if (data.verification?.code && data.verification?.source) {
      const verificationBox = element('div', 'ptb-verification');
      verificationBox.append(
        element('h3', '', 'Community access check'),
        element('p', '', 'Watch the source video for the current access code, then enter it below. Check the box to confirm you understand that external test builds are provided by their publishers and can change without notice.')
      );

      const video = element('a', 'text-link', 'Open verification source ↗');
      video.href = data.verification.source;
      video.target = '_blank';
      video.rel = 'noopener noreferrer';
      verificationBox.append(video);

      const codeInput = document.createElement('input');
      codeInput.type = 'text';
      codeInput.inputMode = 'numeric';
      codeInput.autocomplete = 'off';
      codeInput.placeholder = 'Access code';
      codeInput.setAttribute('aria-label', 'Community access code');

      const disclaimerLabel = element('label', 'ptb-disclaimer');
      const disclaimer = document.createElement('input');
      disclaimer.type = 'checkbox';
      disclaimerLabel.append(disclaimer, document.createTextNode(' I understand the test build and external link notes above.'));

      const unlockButton = element('button', 'button button-primary', 'Show test build links');
      unlockButton.type = 'button';
      const feedback = element('p', 'ptb-feedback');
      feedback.setAttribute('aria-live', 'polite');
      unlockButton.addEventListener('click', () => {
        if (codeInput.value.trim() !== data.verification.code) {
          feedback.textContent = 'That access code does not match the current source.';
          return;
        }
        if (!disclaimer.checked) {
          feedback.textContent = 'Please confirm the test build notes before continuing.';
          return;
        }
        feedback.textContent = 'Links unlocked.';
        renderLinks(root, data.links);
      });

      verificationBox.append(codeInput, disclaimerLabel, unlockButton, feedback);
      root.append(verificationBox);
    } else {
      renderLinks(root, data.links);
    }
  }

  function renderLinks(container, links) {
    const grid = element('div', 'ptb-download-list');
    links.forEach(item => {
      const link = element('a', 'ptb-download-item');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.append(element('span', '', item.platform), element('strong', '', 'Open download ↗'));
      grid.append(link);
    });
    container.append(grid);
  }

  loadConfig()
    .then(({ data, repository }) => render(data, repository))
    .catch(() => {
      root.replaceChildren(
        element('span', 'small-label', 'LIVE TEST BUILD STATUS'),
        element('h2', '', 'Status unavailable'),
        element('p', '', 'We could not reach any of the shared test build repositories. Please try again later.')
      );
    });
})();
