from dotenv import load_dotenv
import asyncio
from pathlib import Path
from claude_agent_sdk import query, ClaudeAgentOptions

load_dotenv(override=True)

PROMPT = """
Make a vanilla HTML + JS + CSS website for a game of space Invaders. Write the code to files in the current directory, including index.html, style.css, and script.js.

"""

TOOLS = ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "AskUserQuestion"]
GAME_DIR = Path(__file__).resolve().parent / "public"

async def main():
    GAME_DIR.mkdir(exist_ok=True)
    options = ClaudeAgentOptions(allowed_tools=TOOLS, model="claude-opus-4-6", cwd=str(GAME_DIR))
    async for message in query(prompt=PROMPT, options=options):
        print(str(message).encode("utf-8", errors="replace").decode("utf-8"))

if __name__ == "__main__":
    asyncio.run(main())
