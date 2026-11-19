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
    if (tag === 'i' && className?.includes('fa-')) node.setAttribute('aria-hidden', 'true');
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

    // Keep the external links in the document but blurred and non-interactive
    // until the visitor completes the same source-code/disclaimer step.
    const downloadGrid = createLinks(data.links);
    downloadGrid.classList.add('is-locked');
    root.append(downloadGrid);

    if (!data.links.length) {
      downloadGrid.remove();
      root.append(element('p', 'ptb-closed-note', data.isOpen
        ? 'The source reports an open test period but has no valid download links yet.'
        : 'The latest shared source reports that the public test is closed. No active download links are currently available.'));
      return;
    }

    // Treat this as a community acknowledgement gate, not authentication: the
    // shared configuration and comparison code are public to every browser.
    if (data.verification?.code && data.verification?.source) {
      const verificationBox = element('div', 'ptb-verification');
      const verificationLayout = element('div', 'ptb-verification-layout');
      const verificationForm = element('section', 'ptb-verification-form');
      verificationForm.setAttribute('aria-labelledby', 'ptb-verification-title');
      const heading = element('div', 'ptb-verification-heading');
      const verificationIcon = element('span', 'ptb-verification-icon');
      verificationIcon.append(element('i', 'fa-solid fa-shield-halved'));
      heading.append(verificationIcon);
      const title = element('div', 'ptb-verification-title');
      const titleHeading = element('h3', '', 'Access Verification');
      titleHeading.id = 'ptb-verification-title';
      title.append(titleHeading, element('p', '', 'Confirm the source code to view community links'));
      heading.append(title);
      verificationForm.append(heading);

      const steps = element('div', 'ptb-verification-steps');
      const stepOne = element('div', 'ptb-verification-step');
      stepOne.append(element('span', 'ptb-step-number', '1'));
      const sourceStep = element('div', 'ptb-step-content');
      sourceStep.append(element('p', '', 'Find the current access code in the community video guide.'));

      const video = element('a', 'button button-primary ptb-source-button', 'Open video guide ');
      video.append(element('i', 'fa-solid fa-arrow-up-right-from-square'));
      video.href = data.verification.source;
      video.target = '_blank';
      video.rel = 'noopener noreferrer';
      sourceStep.append(video);
      stepOne.append(sourceStep);
      const stepTwo = element('div', 'ptb-verification-step');
      stepTwo.append(element('span', 'ptb-step-number', '2'));
      const inputStep = element('div', 'ptb-step-content');
      inputStep.append(element('p', '', 'Enter the access code below to display the download links.'));

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

      const unlockButton = element('button', 'button button-primary ptb-unlock-button', 'Show test build links');
      unlockButton.type = 'button';
      const feedback = element('p', 'ptb-feedback');
      feedback.setAttribute('aria-live', 'polite');
      const unlock = () => {
        if (codeInput.value.trim() !== data.verification.code) {
          feedback.textContent = 'That access code does not match the current source.';
          return;
        }
        if (!disclaimer.checked) {
          feedback.textContent = 'Please confirm the test build notes before continuing.';
          return;
        }
        feedback.textContent = data.isOpen
          ? 'Links unlocked.'
          : 'Verification complete. The test is currently closed; these links may not work until the publisher reopens it.';
        downloadGrid.classList.remove('is-locked');
        verificationBox.remove();
        requestAnimationFrame(() => {
          downloadGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          downloadGrid.classList.add('is-revealed');
        });
      };
      unlockButton.addEventListener('click', unlock);
      codeInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') unlock();
      });

      inputStep.append(codeInput, disclaimerLabel, unlockButton, feedback);
      stepTwo.append(inputStep);
      steps.append(stepOne, stepTwo);
      verificationForm.append(steps);

      const availability = element('aside', `ptb-availability${data.isOpen ? ' is-open' : ' is-closed'}`);
      availability.setAttribute('aria-live', 'polite');
      const availabilityIcon = element('span', 'ptb-availability-icon');
      availabilityIcon.append(element('i', data.isOpen ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'));
      availability.append(availabilityIcon);
      availability.append(element('span', 'ptb-availability-label', 'CURRENT TEST WINDOW'));
      availability.append(element('h3', '', data.isOpen ? 'Test build reported open' : 'Public test build unavailable'));
      availability.append(element('p', '', data.isOpen
        ? 'The shared source reports an active test period. Availability can change, so confirm the latest publisher details before installing.'
        : 'The shared source reports that testing is closed. Players may be unable to sign in or reach game servers until the publisher opens another test period.'));

      const availabilityNote = element('div', 'ptb-availability-note');
      const noteIcon = element('i', data.isOpen ? 'fa-solid fa-circle-info' : 'fa-solid fa-bell');
      noteIcon.setAttribute('aria-hidden', 'true');
      availabilityNote.append(noteIcon, document.createTextNode(data.isOpen
        ? 'Only install a package that matches your device and comes from a source you trust.'
        : 'Wait for a new publisher announcement. This hub updates when its community sources publish new links.'));
      availability.append(availabilityNote);

      const sourceLink = element('a', 'ptb-availability-source', 'View source video ');
      sourceLink.append(element('i', 'fa-solid fa-arrow-up-right-from-square'));
      sourceLink.href = data.verification.source;
      sourceLink.target = '_blank';
      sourceLink.rel = 'noopener noreferrer';
      availability.append(sourceLink);

      verificationLayout.append(verificationForm, availability);
      verificationBox.append(verificationLayout);
      root.append(verificationBox);
    } else if (data.links.length) {
      root.append(
        element('p', 'ptb-closed-note', 'Links are being held until the source publishes its verification code and source video. Check back when those details are available.')
      );
    } else {
      root.append(
        element('p', 'ptb-closed-note', 'No active download links are currently available. The test build is reported closed.')
      );
    }
  }

  function createLinks(links) {
    const grid = element('div', 'ptb-download-list');
    links.forEach(item => {
      const platform = item.platform.toLowerCase();
      const isIos = platform.includes('ios') || platform.includes('testflight');
      const bitness = platform.includes('32') ? '32-bit' : platform.includes('64') ? '64-bit' : '';
      const card = element('article', `ptb-download-card${isIos ? ' is-ios' : ' is-android'}`);
      const icon = element('span', 'ptb-download-icon');
      icon.append(element('i', isIos ? 'fa-brands fa-apple' : 'fa-brands fa-android'));
      icon.setAttribute('aria-hidden', 'true');
      const type = element('span', 'ptb-download-platform', isIos ? 'iOS · TESTFLIGHT' : `ANDROID${bitness ? ` · ${bitness.toUpperCase()}` : ''}`);
      const title = element('h3', '', isIos ? 'Install with TestFlight' : bitness ? `Android ${bitness} package` : 'Android test build');
      const details = element('p', '', isIos
        ? 'Open the invitation on your iPhone or iPad. TestFlight will show eligibility, available slots, and install steps.'
        : `Choose this ${bitness || 'Android'} package for your device. Review the publisher, file details, and storage prompt before installing.`);
      const compatibility = element('p', 'ptb-device-note', isIos
        ? 'For iPhone and iPad · Apple TestFlight required'
        : bitness ? `For compatible ${bitness} Android devices` : 'For compatible Android devices');
      const notes = element('ul', 'ptb-download-notes');
      const cardNotes = isIos
        ? ['Requires Apple TestFlight', 'Invitation capacity and expiry may apply']
        : [bitness === '32-bit' ? 'For compatible 32-bit devices' : bitness === '64-bit' ? 'For compatible 64-bit devices' : 'Check device compatibility', 'Allow installs only from a source you trust'];
      cardNotes.forEach(note => {
        const noteItem = element('li');
        noteItem.append(element('i', 'fa-solid fa-check'), document.createTextNode(note));
        notes.append(noteItem);
      });
      const link = element('a', 'button button-primary ptb-download-action', isIos ? 'Open iOS invitation ' : `Open ${bitness || 'Android'} download `);
      link.append(element('i', 'fa-solid fa-arrow-up-right-from-square'));
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const guideLink = element('a', 'ptb-guide-action', `View ${isIos ? 'iOS' : 'Android'} installation guide `);
      guideLink.append(element('i', 'fa-solid fa-arrow-down'));
      guideLink.href = isIos ? '#ios' : '#android';
      card.append(type, icon, title, details, compatibility, notes, link, guideLink);
      grid.append(card);
    });
    return grid;
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
