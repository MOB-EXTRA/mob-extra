(() => {
  "use strict";

  const REPOSITORY_BASE =
    "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.";
  const REPOSITORY_NUMBERS = [1, 2, 3];
  const REQUEST_TIMEOUT_MS = 10000;
  const REDEEM_CODE_GAMES = {
    codm: "codm-redeem-code",
    mlbb: "mlbb-redeem-code",
  };
  const DATA_FILES = {
    redeemCodes: (game) =>
      `/${REDEEM_CODE_GAMES[game]}/redeem-codes.js`,
    testServer: "/codm-test-server/codm-config.js",
  };

  function stripComments(source) {
    let output = "";
    let quote = "";
    let escaped = false;
    let lineComment = false;
    let blockComment = false;

    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      const next = source[index + 1];

      if (lineComment) {
        if (character === "\n") {
          lineComment = false;
          output += character;
        }
        continue;
      }
      if (blockComment) {
        if (character === "*" && next === "/") {
          blockComment = false;
          index += 1;
        } else if (character === "\n") {
          output += character;
        }
        continue;
      }
      if (quote) {
        output += character;
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === quote) {
          quote = "";
        }
        continue;
      }
      if (character === "/" && next === "/") {
        lineComment = true;
        index += 1;
      } else if (character === "/" && next === "*") {
        blockComment = true;
        index += 1;
      } else {
        output += character;
        if (character === '"' || character === "'") quote = character;
      }
    }

    return output;
  }

  function readAssignmentObject(source, name) {
    const assignment = new RegExp(
      `\\b(?:const|let|var)\\s+${name}\\s*=\\s*`,
    ).exec(source);
    if (!assignment) {
      throw new Error(`The shared source does not define ${name}.`);
    }

    const start = source.indexOf("{", assignment.index + assignment[0].length);
    if (start < 0) {
      throw new Error(`The shared source has an invalid ${name} object.`);
    }

    let depth = 0;
    let quote = "";
    let escaped = false;
    let lineComment = false;
    let blockComment = false;
    let end = -1;

    for (let index = start; index < source.length; index += 1) {
      const character = source[index];
      const next = source[index + 1];

      if (lineComment) {
        if (character === "\n") lineComment = false;
        continue;
      }
      if (blockComment) {
        if (character === "*" && next === "/") {
          blockComment = false;
          index += 1;
        }
        continue;
      }
      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === quote) {
          quote = "";
        }
        continue;
      }
      if (character === "/" && next === "/") {
        lineComment = true;
        index += 1;
        continue;
      }
      if (character === "/" && next === "*") {
        blockComment = true;
        index += 1;
        continue;
      }
      if (character === '"' || character === "'") {
        quote = character;
        continue;
      }
      if (character === "{") depth += 1;
      if (character === "}") {
        depth -= 1;
        if (depth === 0) {
          end = index + 1;
          break;
        }
      }
    }

    if (end < 0) {
      throw new Error(`The shared source has an unterminated ${name} object.`);
    }

    let json = stripComments(source.slice(start, end));
    json = json.replace(/(^|[,{]\s*)([A-Za-z_$][\w$]*)\s*:/gm, '$1"$2":');
    json = json.replace(/,\s*([}\]])/g, "$1");

    try {
      return JSON.parse(json);
    } catch (error) {
      throw new Error(`The shared source has invalid ${name} data: ${error.message}`);
    }
  }

  function parseRedeemCodes(source) {
    const match = source.match(
      /\b(?:const|let|var)\s+redeemCodesData\s*=\s*`([\s\S]*?)`\s*;/,
    );
    if (!match || !/^\s*r-code\s*:/im.test(match[1])) {
      throw new Error("The shared source contains no redeem-code data.");
    }
    return match[1];
  }

  function parseTestServer(source) {
    const testServerData = readAssignmentObject(source, "testServerData");
    const notARobot = readAssignmentObject(source, "notARobot");
    if (
      !testServerData ||
      typeof testServerData !== "object" ||
      Array.isArray(testServerData) ||
      !Array.isArray(testServerData.links)
    ) {
      throw new Error("The shared source contains invalid test-server data.");
    }
    return { testServerData, notARobot };
  }

  async function loadFromRepositories(path, parse) {
    const failures = [];

    for (const number of REPOSITORY_NUMBERS) {
      const url = `${REPOSITORY_BASE}${number}${path}`;
      const controller = new AbortController();
      const timeout = window.setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      try {
        const response = await fetch(url, {
          cache: "no-store",
          credentials: "omit",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const source = await response.text();
        if (!source.trim()) {
          throw new Error("The shared source returned an empty file.");
        }

        const data = parse(source);
        return {
          data,
          repository: `Repository ${number}`,
          repositoryNumber: number,
        };
      } catch (error) {
        failures.push(`Repository ${number}: ${error.message}`);
        console.warn(`[Shared Data] ${failures[failures.length - 1]}`);
      } finally {
        window.clearTimeout(timeout);
      }
    }

    throw new Error(`All shared data repositories failed. ${failures.join("; ")}`);
  }

  function loadRedeemCodes(game) {
    const key = String(game || "").toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(REDEEM_CODE_GAMES, key)) {
      return Promise.reject(new Error(`Unknown redeem-code game: ${game}`));
    }
    return loadFromRepositories(DATA_FILES.redeemCodes(key), parseRedeemCodes);
  }

  function loadTestServer() {
    return loadFromRepositories(DATA_FILES.testServer, parseTestServer);
  }

  window.MobExtraDataClient = Object.freeze({
    loadRedeemCodes,
    loadTestServer,
  });
})();
