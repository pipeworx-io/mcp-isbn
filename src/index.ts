interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * ISBN validation & conversion MCP.
 *
 * Keyless, offline: validate ISBN-10 and ISBN-13 check digits and convert
 * between the two formats. Pure algorithm — no API, no key. Validates the
 * NUMBER; it does not look up the book (use a books-data pack for that).
 */


function clean(s: string): string { return s.toUpperCase().replace(/[\s-]/g, ''); }

function isbn10Check(first9: string): string { // returns check char ('0'-'9' or 'X')
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (first9.charCodeAt(i) - 48) * (10 - i);
  const c = (11 - (sum % 11)) % 11;
  return c === 10 ? 'X' : String(c);
}

function isbn13Check(first12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += (first12.charCodeAt(i) - 48) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10;
}

function validate(isbn: string) {
  const s = clean(isbn);
  if (/^\d{9}[\dX]$/.test(s)) {
    const ok = isbn10Check(s.slice(0, 9)) === s[9];
    return { type: 'ISBN-10', valid: ok, expected_check: isbn10Check(s.slice(0, 9)), given_check: s[9] };
  }
  if (/^\d{13}$/.test(s)) {
    const ok = isbn13Check(s.slice(0, 12)) === +s[12];
    return { type: 'ISBN-13', valid: ok, expected_check: isbn13Check(s.slice(0, 12)), given_check: +s[12] };
  }
  return null;
}

const tools: McpToolExport['tools'] = [
  {
    name: 'validate_isbn',
    description: 'Validate an ISBN-10 or ISBN-13 (keyless, offline): detects the format and checks the check digit (ISBN-10 uses mod-11 with an "X" for 10). Hyphens/spaces ignored. Validates the number, not the book.',
    inputSchema: { type: 'object', properties: { isbn: { type: 'string', description: 'An ISBN-10 or ISBN-13, e.g. "978-0-306-40615-7".' } }, required: ['isbn'] },
  },
  {
    name: 'convert_isbn',
    description: 'Convert an ISBN between ISBN-10 and ISBN-13 (recomputing the check digit). ISBN-10 -> ISBN-13 prefixes "978"; ISBN-13 -> ISBN-10 works only for the 978 prefix.',
    inputSchema: { type: 'object', properties: { isbn: { type: 'string', description: 'The ISBN to convert.' } }, required: ['isbn'] },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const isbn = reqStr(args, 'isbn', '"9780306406157"');
  switch (name) {
    case 'validate_isbn': {
      const r = validate(isbn);
      if (!r) return { input: isbn, valid: false, reason: 'Not a well-formed ISBN-10 or ISBN-13 (expected 10 or 13 digits, ISBN-10 may end in X).' };
      return { input: isbn, ...r, reason: r.valid ? `Valid ${r.type} check digit.` : `Check digit is wrong; expected ${r.expected_check}.` };
    }
    case 'convert_isbn': {
      const s = clean(isbn);
      if (/^\d{9}[\dX]$/.test(s)) {
        const core = s.slice(0, 9);
        const isbn13 = '978' + core + isbn13Check('978' + core);
        return { input: isbn, from: 'ISBN-10', isbn10: s, isbn13 };
      }
      if (/^\d{13}$/.test(s)) {
        if (!s.startsWith('978')) return { input: isbn, from: 'ISBN-13', isbn13: s, isbn10: null, reason: 'Only 978-prefixed ISBN-13s have an ISBN-10 equivalent.' };
        const core = s.slice(3, 12);
        const isbn10 = core + isbn10Check(core);
        return { input: isbn, from: 'ISBN-13', isbn13: s, isbn10 };
      }
      return { input: isbn, valid: false, reason: 'Not a well-formed ISBN.' };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, ex: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${ex}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
