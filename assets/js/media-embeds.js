document.querySelectorAll(".media-embed[data-media-embed]").forEach((preview) => {
  const thumbnail = preview.querySelector(".media-embed-thumbnail");

  if (!(thumbnail instanceof HTMLImageElement)) {
    return;
  }

  const showLoadedState = () => {
    preview.classList.remove("is-error");
    preview.classList.add("is-loaded");
  };

  const showErrorState = () => {
    preview.classList.remove("is-loaded");
    preview.classList.add("is-error");
  };

  thumbnail.addEventListener("load", showLoadedState, { once: true });
  thumbnail.addEventListener("error", showErrorState, { once: true });

  if (thumbnail.complete) {
    if (thumbnail.naturalWidth > 0) {
      showLoadedState();
    } else {
      showErrorState();
    }
  }
});
