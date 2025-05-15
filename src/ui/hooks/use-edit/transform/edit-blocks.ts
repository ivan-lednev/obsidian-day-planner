interface Block {
  id: string;
  start: number;
  end: number;
}

type BlockInteraction = "none" | "shrink" | "push";
type EditType = "start" | "end" | "move";

/**
 * This lets us apply updates both to following and preceding blocks in the same way.
 */
function mirror(block: Block, center: number) {
  return {
    ...block,
    start: center * 2 - block.end,
    end: center * 2 - block.start,
  };
}

function mirrorBlocks(blocks: Block[], center: number) {
  return blocks.toReversed().map((it) => mirror(it, center));
}

function setStartWithMinDuration(
  block: Block,
  newStart: number,
  minDuration: number,
) {
  const newDuration = Math.max(block.end - newStart, minDuration);

  return {
    ...block,
    start: newStart,
    end: newStart + newDuration,
  };
}

function move(block: Block, newCoords: number) {
  return {
    ...block,
    start: newCoords,
    end: newCoords + block.end - block.start,
  };
}

function propagate(
  blocks: Block[],
  pusher: Block,
  interaction: BlockInteraction,
  minDuration: number,
) {
  let interactionFn = move;

  if (interaction === "shrink") {
    interactionFn = (block: Block, newCoords: number) =>
      setStartWithMinDuration(block, newCoords, minDuration);
  }

  const idToBlock = new Map(blocks.map((it) => [it.id, it]));

  function initiallyOverlap(a: Block, b: Block) {
    const initialA = idToBlock.get(a.id);
    const initialB = idToBlock.get(b.id);

    return initialA && initialB && initialA.end > initialB.start;
  }

  const result = blocks.slice();

  for (let index = -1; index < result.length; index++) {
    const block = result[index] || pusher;

    for (
      let nextOfTheRestIndex = index + 1;
      nextOfTheRestIndex < result.length;
      nextOfTheRestIndex++
    ) {
      const nextOfTheRest = result[nextOfTheRestIndex];

      if (
        block.end > nextOfTheRest.start &&
        !initiallyOverlap(block, nextOfTheRest)
      ) {
        result[nextOfTheRestIndex] = interactionFn(nextOfTheRest, block.end);
      }
    }
  }

  return result;
}

function editBlock(
  block: Block,
  newCoords: number,
  changeType: EditType,
  minDuration: number,
) {
  if (changeType === "start") {
    return setStartWithMinDuration(block, newCoords, minDuration);
  }

  if (changeType === "end") {
    const mirrored = mirror(block, newCoords);
    const updated = setStartWithMinDuration(mirrored, newCoords, minDuration);

    return mirror(updated, newCoords);
  }

  if (changeType === "move") {
    return move(block, newCoords);
  }

  throw new Error("Invalid change type");
}

export function editBlocks(
  blocks: Block[],
  editTargetId: string,
  newCoords: number,
  editType: EditType,
  interaction: BlockInteraction,
  minDuration = 5,
) {
  const targetIndex = blocks.findIndex((block) => block.id === editTargetId);

  if (targetIndex === -1) {
    throw new Error("Target block not found");
  }

  const updatedBlocks = blocks.map((block) => ({ ...block }));

  const targetBlock = updatedBlocks[targetIndex];
  const updatedBlock = editBlock(targetBlock, newCoords, editType, minDuration);

  if (interaction === "none") {
    return updatedBlocks.with(targetIndex, updatedBlock);
  }

  const precedingBlocks = updatedBlocks.slice(0, targetIndex);
  const followingBlocks = updatedBlocks.slice(targetIndex + 1);

  const updatedFollowingBlocks = propagate(
    followingBlocks,
    updatedBlock,
    interaction,
    minDuration,
  );
  const mirroredPrecedingBlocks = mirrorBlocks(precedingBlocks, newCoords);
  const mirroredPrecedingBlocksWithChangeApplied = propagate(
    mirroredPrecedingBlocks,
    mirror(updatedBlock, newCoords),
    interaction,
    minDuration,
  );
  const updatedPrecedingBlocks = mirrorBlocks(
    mirroredPrecedingBlocksWithChangeApplied,
    newCoords,
  );

  return updatedPrecedingBlocks.concat(updatedBlock, updatedFollowingBlocks);
}
