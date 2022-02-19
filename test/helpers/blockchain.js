module.exports = (provider) => {
  const send = async (method, payload = null) => {
    if (payload) {
      return await provider.send(method, payload);
    } else {
      return await provider.send(method);
    }
  };

  const mineBlock = async () => {
    send("evm_mine");
  };

  const takeSnapshot = async () => {
    const result = await send("evm_snapshot");
    await mineBlock();

    return result;
  };

  const restoreSnapshot = async (id) => {
    await send("evm_revert", [id]);
    await mineBlock();
  };

  const currentTime = async () => {
    const { timestamp } = await provider.getBlock("latest");
    return timestamp;
  };

  const fastForwardTo = async (timestamp) => {
    await send("evm_setNextBlockTimestamp", [timestamp]);
    await mineBlock();
  };

  const fastForward = async (seconds) => {
    await send("evm_increaseTime", [seconds]);
    await mineBlock();
  };

  return {
    send,
    mineBlock,
    takeSnapshot,
    restoreSnapshot,
    currentTime,
    fastForwardTo,
    fastForward,
  };
};
