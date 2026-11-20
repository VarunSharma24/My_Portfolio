import type { ReactNode } from "react";
import { safeWebUrl } from "@/lib/public-assets";

function inline(text: string): ReactNode[] {
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;
  const result: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) result.push(text.slice(cursor, match.index));
    if (match[1]) result.push(<strong key={match.index}>{match[1]}</strong>);
    else if (match[2]) result.push(<em key={match.index}>{match[2]}</em>);
    else {
      const href = safeWebUrl(match[4]);
      result.push(
        href ? (
          <a key={match.index} href={href} target="_blank" rel="noreferrer">
            {match[3]}
          </a>
        ) : (
          match[3]
        ),
      );
    }
    cursor = pattern.lastIndex;
  }
  if (cursor < text.length) result.push(text.slice(cursor));
  return result;
}

export function SafeMarkdown({ content }: { content: string }) {
  const lines = content.split(/\r?\n/),
    blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`list-${blocks.length}`}>
          {list.map((line, index) => (
            <li key={index}>{inline(line)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      return;
    }
    const item = trimmed.match(/^[-*]\s+(.+)$/);
    if (item) {
      list.push(item[1]);
      return;
    }
    flush();
    const heading = trimmed.match(/^#{1,3}\s+(.+)$/);
    blocks.push(
      heading ? <h3 key={index}>{inline(heading[1])}</h3> : <p key={index}>{inline(trimmed)}</p>,
    );
  });
  flush();
  return <div className="safe-markdown">{blocks}</div>;
}
