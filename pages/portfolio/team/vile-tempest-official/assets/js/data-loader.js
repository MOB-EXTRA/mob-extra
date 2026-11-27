(function (window) {
  "use strict";

  async function loadSharedData(identifier) {
    const client = window.MobExtraDataClient;
    if (!client) {
      throw new Error("Shared data client is not loaded.");
    }

    if (identifier === "redeem-codes") {
      const result = await client.loadRedeemCodes("codm");
      return result.data;
    }
    if (identifier === "test-server") {
      const result = await client.loadTestServer();
      return result.data;
    }

    throw new Error(
      `Invalid shared-data identifier: "${identifier}". Use "redeem-codes" or "test-server".`,
    );
  }

  window.loadSharedData = loadSharedData;
  window.testRepoFetch = async function (identifier = "redeem-codes") {
    try {
      const data = await loadSharedData(identifier);
      console.info(`[Shared Data] Successfully loaded "${identifier}".`, data);
      return data;
    } catch (error) {
      console.error(`[Shared Data] Failed to load "${identifier}".`, error);
      throw error;
    }
  };
})(window);
