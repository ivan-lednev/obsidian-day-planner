import type { Overlap, TimeBlock } from "../types";
import Fraction from "fraction.js";
import { partition } from "lodash/fp";

const EMPTY = "empty";
const TAKEN = "taken";

export function computeOverlap(items: Array<TimeBlock>): Map<string, Overlap> {
  return items.reduce((overlapLookup, item) => {
    const overlapGroup = getItemsOverlappingItemAndEachOther(item, items);

    return computeOverlapForGroup(overlapGroup, overlapLookup);
  }, new Map());
}

function getItemsOverlappingItemAndEachOther(
  item: TimeBlock,
  items: Array<TimeBlock>,
) {
  return items
    .reduce(
      (result, current) => {
        if (current === item) {
          return result;
        }

        const currentOverlapsWithPreviousItems = result.every(
          (intersectingItem) => overlaps(intersectingItem, current),
        );

        if (currentOverlapsWithPreviousItems) {
          result.push(current);
        }

        return result;
      },
      [item],
    )
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

function computeOverlapForGroup(
  overlapGroup: Array<TimeBlock>,
  previousLookup: Map<string, Overlap>,
) {
  const newLookup = new Map([...previousLookup]);

  const [itemsPlacedPreviously, itemsToBePlaced] = partition(
    ({ id }) => newLookup.has(id),
    overlapGroup,
  );

  if (itemsToBePlaced.length === 0) {
    return newLookup;
  }

  const fractionOfPlacedItems = itemsPlacedPreviously.reduce((sum, current) => {
    const { span, columns } = newLookup.get(current.id);
    return new Fraction(span, columns).add(sum);
  }, new Fraction(0));

  const fractionForNewItems = new Fraction(1).sub(fractionOfPlacedItems);
  const fractionForEachNewItem = fractionForNewItems.div(
    itemsToBePlaced.length,
  );

  const columnsForNewGroup = fractionForEachNewItem.d;
  const newItemInherentSpan = fractionForEachNewItem.n;

  const slots = Array(columnsForNewGroup).fill(EMPTY);

  itemsPlacedPreviously.forEach((item) => {
    const { start, span, columns: previousColumns } = newLookup.get(item.id);

    const scale = columnsForNewGroup / previousColumns;
    const scaledStart = scale * start;
    const scaledSpan = scale * span;
    const scaledEnd = scaledStart + scaledSpan;

    slots.fill(TAKEN, scaledStart, scaledEnd);
  });

  itemsToBePlaced.forEach((itemInGroup) => {
    const firstFreeSlotIndex = slots.findIndex((slot) => slot === EMPTY);
    const nextTakenSlotIndex = slots.findIndex(
      (slot, i) => i > firstFreeSlotIndex && slot === TAKEN,
    );

    const fromFreeToNextTakenSlot = nextTakenSlotIndex - firstFreeSlotIndex;
    const onlyEmptySlotsLeft = nextTakenSlotIndex === -1;

    const span = onlyEmptySlotsLeft
      ? newItemInherentSpan
      : Math.min(newItemInherentSpan, fromFreeToNextTakenSlot);

    const fillEnd = firstFreeSlotIndex + span;

    slots.fill(TAKEN, firstFreeSlotIndex, fillEnd);

    newLookup.set(itemInGroup.id, {
      start: firstFreeSlotIndex,
      span,
      columns: columnsForNewGroup,
    });
  });

  return newLookup;
}

function overlaps(a: TimeBlock, b: TimeBlock) {
  const [early, late] = a.startMinutes < b.startMinutes ? [a, b] : [b, a];

  return early.endMinutes > late.startMinutes;
}
