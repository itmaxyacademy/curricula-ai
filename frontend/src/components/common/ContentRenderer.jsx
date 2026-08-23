import React from 'react';

export function parseInlineMarkdown(text) {
  if (!text) return '';
  const tokens = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  let match;
  let lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    const plainText = text.substring(lastIndex, match.index);
    if (plainText) {
      tokens.push(plainText);
    }
    const matchedToken = match[0];
    if (matchedToken.startsWith('**') && matchedToken.endsWith('**')) {
      tokens.push(<strong key={match.index}>{matchedToken.slice(2, -2)}</strong>);
    } else if (matchedToken.startsWith('*') && matchedToken.endsWith('*')) {
      tokens.push(<em key={match.index}>{matchedToken.slice(1, -1)}</em>);
    } else if (matchedToken.startsWith('`') && matchedToken.endsWith('`')) {
      tokens.push(<code key={match.index} className="inline-code">{matchedToken.slice(1, -1)}</code>);
    } else if (matchedToken.startsWith('[') && matchedToken.includes('](')) {
      const closingBracket = matchedToken.indexOf('](');
      const linkText = matchedToken.slice(1, closingBracket);
      const linkUrl = matchedToken.slice(closingBracket + 2, -1);
      tokens.push(
        <a key={match.index} href={linkUrl} target="_blank" rel="noopener noreferrer" className="content-link">
          {linkText}
        </a>
      );
    } else {
      tokens.push(matchedToken);
    }
    lastIndex = regex.lastIndex;
  }
  const remainingText = text.substring(lastIndex);
  if (remainingText) {
    tokens.push(remainingText);
  }
  return tokens.length > 0 ? tokens : text;
}

export function ContentRenderer({ text }) {
  if (!text) return <p style={{ color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic' }}>No content available.</p>;
  
  try {
    const rawStr = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
    const lines = rawStr.split('\n');
    const elements = [];
    let codeBuffer = [];
    let inCode = false;
    let listBuffer = [];

    const flushList = (keyPrefix) => {
      if (listBuffer.length > 0) {
        elements.push(
          <ul key={`ul-${keyPrefix}`} className="content-ul">
            {listBuffer}
          </ul>
        );
        listBuffer = [];
      }
    };

    lines.forEach((line, i) => {
      if (typeof line !== 'string') return;
      if (line.startsWith('```')) {
        flushList(i);
        if (inCode) {
          elements.push(<pre key={`code-${i}`} className="code-block">{codeBuffer.join('\n')}</pre>);
          codeBuffer = []; inCode = false;
        } else { inCode = true; }
        return;
      }
      if (inCode) { codeBuffer.push(line); return; }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        listBuffer.push(<li key={`li-${i}`} className="content-li">{parseInlineMarkdown(line.slice(2))}</li>);
      } else if (/^\d+\.\s+/.test(line)) {
        listBuffer.push(<li key={`li-${i}`} className="content-li">{parseInlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>);
      } else {
        flushList(i);
        const trimmed = line.trim();
        if (line.startsWith('###### ')) {
          elements.push(<h6 key={i} className="content-h6" style={{ fontSize: '0.85rem', fontWeight: 700, margin: '8px 0 4px', color: 'var(--text-muted)' }}>{parseInlineMarkdown(line.slice(7))}</h6>);
        } else if (line.startsWith('##### ')) {
          elements.push(<h5 key={i} className="content-h5" style={{ fontSize: '0.9rem', fontWeight: 700, margin: '10px 0 4px', color: 'var(--navy)' }}>{parseInlineMarkdown(line.slice(6))}</h5>);
        } else if (line.startsWith('#### ')) {
          elements.push(<h5 key={i} className="content-h4" style={{ fontSize: '0.98rem', fontWeight: 750, margin: '14px 0 6px', color: 'var(--blue-dark, #1e3a8a)' }}>{parseInlineMarkdown(line.slice(5))}</h5>);
        } else if (line.startsWith('### ')) {
          elements.push(<h4 key={i} className="content-h3">{parseInlineMarkdown(line.slice(4))}</h4>);
        } else if (line.startsWith('## ')) {
          elements.push(<h3 key={i} className="content-h2">{parseInlineMarkdown(line.slice(3))}</h3>);
        } else if (line.startsWith('# ')) {
          elements.push(<h2 key={i} className="content-h1">{parseInlineMarkdown(line.slice(2))}</h2>);
        } else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />);
        } else if (line.startsWith('> ')) {
          elements.push(<blockquote key={i} style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '12px', color: 'var(--text-secondary)', margin: '10px 0', fontStyle: 'italic' }}>{parseInlineMarkdown(line.slice(2))}</blockquote>);
        } else if (trimmed === '') {
          elements.push(<br key={i} />);
        } else {
          elements.push(<p key={i} className="content-p">{parseInlineMarkdown(line)}</p>);
        }
      }
    });

    flushList('end');
    return <div className="content-renderer">{elements}</div>;
  } catch (err) {
    console.warn('[ContentRenderer Error]:', err);
    return <div className="content-renderer" style={{ whiteSpace: 'pre-wrap' }}>{String(text)}</div>;
  }
}
