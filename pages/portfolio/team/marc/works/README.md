# Portfolio work data

Project metadata and images in this folder are loaded directly by the portfolio's browser scripts. Add a project folder, put its `project.json` and thumbnails inside it, then add that metadata path to `manifest.json`.

Use `thumbnail` in `project.json` to select a file relative to the project folder. For gallery projects, number images in order (`1.png`, `2.png`, and so on) and update that project's gallery manifest when adding new images.

Projects with a `siteUrl` link to the external work. Projects without one open the portfolio image gallery. No build step is required; edit the JSON and files directly.
