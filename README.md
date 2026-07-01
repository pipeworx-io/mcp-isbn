# mcp-isbn

ISBN validation & conversion MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1137+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `validate_isbn` | Validate an ISBN-10 or ISBN-13 (keyless, offline): detects the format and checks the check digit (ISBN-10 uses mod-11 with an "X" for 10). Hyphens/spaces ignored. Validates the number, not the book. |
| `convert_isbn` | Convert an ISBN between ISBN-10 and ISBN-13 (recomputing the check digit). ISBN-10 -> ISBN-13 prefixes "978"; ISBN-13 -> ISBN-10 works only for the 978 prefix. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "isbn": {
      "url": "https://gateway.pipeworx.io/isbn/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1137+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Isbn data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
