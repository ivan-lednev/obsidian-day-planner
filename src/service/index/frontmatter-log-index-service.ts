import { createId } from "../../redux/index/index-slice";
import { removeMarkdownExtension } from "../../util/markdown";
import { type Props, propsSchema } from "../../util/props";

import type { FileWithMetadata, IndexService } from "./index-service";
import { createLogEntry } from "./log-entry";

function getBasename(path: string) {
  return removeMarkdownExtension(path.slice(path.lastIndexOf("/") + 1));
}

export class FrontmatterLogIndexService implements IndexService {
  index(props: FileWithMetadata) {
    const { path, metadata } = props;

    if (!metadata.frontmatter) {
      return {};
    }

    let parsed: Props;

    try {
      parsed = propsSchema.parse(metadata.frontmatter);
    } catch (error) {
      console.error(error);

      return {};
    }

    const log = parsed.planner?.log ?? [];

    if (log.length === 0) {
      return {};
    }

    const fileEntryId = createId(path, "frontmatter");

    const logEntries = log.map(({ start, end }, index) =>
      createLogEntry({
        start,
        end,
        parent: fileEntryId,
        id: createId(fileEntryId, index),
        source: "frontmatterLog",
      }),
    );

    return {
      fileEntries: [{ id: fileEntryId, text: getBasename(path), path }],
      logEntries,
    };
  }
}
