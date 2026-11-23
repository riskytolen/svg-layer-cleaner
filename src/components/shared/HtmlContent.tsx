"use client";

import { useCallback } from "react";

type HtmlContentProps = {
  html: string;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Mounts raw SVG/HTML and rewrites it only when `html` changes.
 *
 * Do not switch this back to `dangerouslySetInnerHTML` directly: the inline
 * `{ __html }` prop object is recreated on every render, and React re-applies
 * it during host updates even when the string is unchanged. That recreates the
 * SVG subtree, wiping selection highlights that are applied imperatively via
 * classList (the review canvas loses its selection whenever autosave, an
 * option update or pan/zoom re-renders the preview).
 */
export function HtmlContent({ html, className, style }: HtmlContentProps) {
  const setNode = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) node.innerHTML = html;
    },
    [html],
  );

  return <div ref={setNode} className={className} style={style} />;
}
