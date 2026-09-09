import type { ContentItem, WebsiteConfig } from "./types";
import { isRow } from "./types";

function walkContentBlocks(items: ContentItem[], visit: (block: { type: string; visible: boolean; branchStoreIds?: string[] }) => void) {
  for (const item of items) {
    if (isRow(item)) {
      for (const col of item.columns) {
        for (const block of col.blocks) visit(block);
      }
    } else {
      visit(item);
    }
  }
}

/** Store IDs selected on visible Branches blocks. */
export function getEnabledBranchStoreIds(config: WebsiteConfig | null | undefined): string[] {
  if (!config?.content?.length) return [];
  const ids = new Set<string>();
  walkContentBlocks(config.content, (block) => {
    if (block.type !== "branches" || block.visible === false) return;
    for (const id of block.branchStoreIds ?? []) {
      if (typeof id === "string" && id.trim()) ids.add(id.trim());
    }
  });
  return [...ids];
}

/** True when the site has a Branches block with at least one store selected. */
export function isBranchSellingMode(config: WebsiteConfig | null | undefined): boolean {
  return getEnabledBranchStoreIds(config).length > 0;
}
