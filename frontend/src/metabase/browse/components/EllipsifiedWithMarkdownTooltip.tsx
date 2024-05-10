import { Ellipsified } from "metabase/core/components/Ellipsified";
import type { EllipsifiedProps } from "metabase/core/components/Ellipsified/Ellipsified";
import Markdown from "metabase/core/components/Markdown";
import { MultilineEllipsified } from "./BrowseModels.styled";

export const EllipsifiedWithMarkdownTooltip = ({
  children,
  multiline,
  ...props
}: {
  children: string;
  multiline?: boolean;
} & EllipsifiedProps) => {
  props.tooltip = (
    <Markdown disallowHeading unstyleLinks lineClamp={12}>
      {children.replace(/\s/g, " ")}
    </Markdown>
  );
  return multiline ? (
    <MultilineEllipsified {...props}>{children}</MultilineEllipsified>
  ) : (
    <Ellipsified {...props}>{children}</Ellipsified>
  );
};
