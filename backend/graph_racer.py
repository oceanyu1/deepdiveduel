import os
import json
import re
import requests
import time
from typing import List, TypedDict, Literal
from collections import deque
from bs4 import BeautifulSoup
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

# --- SETUP ---
load_dotenv()

# 1. THE BRAIN (OpenRouter)
def get_llm(model_name: str):
    """Create an LLM instance with the specified model."""
    return ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
        model=model_name,
        temperature=0.1,  # Very low temp for more consistent JSON and reasoning
        max_tokens=200  # Keep responses concise
    )

# 2. THE EYES (Scraper)
def get_wikipedia_links(topic: str) -> List[str]:
    """Scrapes Wikipedia for links. Returns a clean list of topics."""
    url = f"https://en.wikipedia.org/wiki/{topic.replace(' ', '_')}"
    try:
        response = requests.get(url, headers={'User-Agent': 'HackathonBot/1.0'}, timeout=5)
        if response.status_code != 200: return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        # Focus on the main article content only, not sidebars/footers
        content = soup.find('div', {'id': 'mw-content-text'})
        if not content:
            return []
        
        links = []
        # Only get links from paragraphs and lists in the main content
        for element in content.find_all(['p', 'ul', 'ol']):
            for a in element.find_all('a', href=True):
                href = a['href']
                # Filter: only main wiki articles, no special pages
                if href.startswith('/wiki/') and ':' not in href and '#' not in href:
                    clean = href.replace('/wiki/', '').replace('_', ' ')
                    # Skip common noise
                    if not any(skip in clean.lower() for skip in ['cite note', 'isbn', 'issn', 'disambiguation']):
                        links.append(clean)

        unique_links = list(dict.fromkeys(links))
        return unique_links[:100]  # Cap at 100 to avoid overload
    except Exception:
        return []

# 3. THE STATE (Memory)
class AgentState(TypedDict):
    target: str
    mode: Literal["bfs", "dfs"]
    model_name: str  # e.g., "meta-llama/llama-3-70b-instruct"
    
    # The Queue contains tuples: (topic_name, path_to_get_here)
    queue: List[tuple]
    visited: List[str]
    
    # The current topic being examined
    current_topic: str
    current_path: List[str]
    
    # Timing
    node_start_time: float
    duration_ms: float
    
    # Output for the frontend
    status: str 

# 4. THE NODES (Actions)

def search_node(state: AgentState):
    """
    Picks the next item from the queue, checks if it's the target,
    and finds new links.
    """
    start_time = time.time()
    queue = state["queue"]
    
    if not queue:
        return {"status": "failed"} 

    # 1. SELECT NODE
    if state["mode"] == "bfs":
        current_topic, path = queue.pop(0)  # FIFO 
    else:
        current_topic, path = queue.pop()   # LIFO (DFS)
    
    print(f"🕵️ Visiting: {current_topic} (Depth: {len(path)})")

    # 2. CHECK IF VISITED OR TOO DEEP
    # Safety: If we are too deep, don't waste time scraping. 
    # This lets the agent BACKTRACK to a shallower node in the queue!
    MAX_DEPTH = 20 
    if len(path) > MAX_DEPTH:
        print(f"   ⚠️ Depth limit reached at {current_topic}. Backtracking...")
        return {
            "queue": queue, # Return existing queue (effectively drops this node)
            "visited": state["visited"],
            "status": "searching",
            "duration_ms": 0
        }

    if current_topic in state["visited"]:
        return {
            "queue": queue,
            "visited": state["visited"],
            "status": "searching",
            "duration_ms": 0
        }
    
    # 3. CHECK SUCCESS (Instant Win)
    target_lower = state["target"].lower()
    if current_topic.lower() == target_lower:
        print(f"   🎯 TARGET FOUND: {current_topic}")
        duration_ms = (time.time() - start_time) * 1000
        return {
            "current_topic": current_topic,
            "status": "success", 
            "current_path": path,
            "duration_ms": duration_ms
        }

    # 4. SCRAPE
    links = get_wikipedia_links(current_topic)
    
    # Optimization: Instant win check in links
    for link in links:
        if link.lower() == target_lower:
            print(f"   🎯 Target spotted in links: {link}!")
            # Add target to front/back depending on mode to win next turn
            new_queue = queue + [(link, path + [link])]
            duration_ms = (time.time() - start_time) * 1000
            return {
                "queue": new_queue, 
                "visited": state["visited"] + [current_topic],
                "current_topic": current_topic,
                "current_path": path,
                "duration_ms": duration_ms,
                "status": "searching"
            }

    # 5. STRATEGY SELECTION
    if state["mode"] == "bfs":
        limit = 5
        strategy_instruction = f"Pick {limit} links that broaden the search towards '{state['target']}'."
    else:
        # SOFT DFS (The Fix: Pick 3 instead of 1)
        limit = 3
        strategy_instruction = f"Pick exactly {limit} links. Rank them: 1. The Absolute Best, 2. A Good Backup, 3. A Hail Mary."

    # ... Hint generation code (Keep your existing code here) ...
    hints = "related topics, concepts" 

    # 6. PROMPT (The Fix: Show ALL links)
    prompt = f"""Task: Find Wikipedia path from "{current_topic}" to "{state['target']}"

Current page: {current_topic}
Target: {state['target']}
Available Wikipedia links: {json.dumps(links)} 

Strategy: {strategy_instruction}

CRITICAL:
1. Return JSON: {{"links":["Link1", "Link2", "Link3"]}}
2. Choose exactly {limit} links.
3. Links must be exact strings from the list.
"""
    
    best_links = []
    try:
        llm = get_llm(state["model_name"])
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        # Clean JSON
        content = content.replace("```json", "").replace("```", "").strip()
        if '{' in content: content = content[content.index('{'):content.rindex('}')+1]
        
        parsed = json.loads(content)
        suggested_links = parsed.get("links", [])
        
        # Validate
        for suggested in suggested_links:
            match = next((l for l in links if l.lower() == suggested.lower()), None)
            if match:
                best_links.append(match)
        
        best_links = best_links[:limit]
        print(f"   🧠 LLM picked ({state['mode']}): {best_links}")

    except Exception as e:
        print(f"   ⚠️ LLM failed, fallback used.")
        best_links = links[:limit]

    # 7. QUEUE UPDATE (The "Reverse" Trick)
    new_items = [(l, path + [l]) for l in best_links if l not in state["visited"]]

    if state["mode"] == "bfs":
        updated_queue = queue + new_items
    else:
        # DFS: Add to END, but REVERSE so the #1 pick is at the very end (popped next)
        # Since we now pick 3, this creates a "Stack" of backups.
        updated_queue = queue + new_items[::-1]

    duration_ms = (time.time() - start_time) * 1000
    return {
        "current_topic": current_topic,
        "current_path": path,
        "queue": updated_queue,
        "visited": state["visited"] + [current_topic],
        "status": "searching",
        "duration_ms": duration_ms
    }

def check_goal(state: AgentState):
    """Conditional Edge to decide where to go next."""
    if state["status"] == "success":
        return END
    if state["status"] == "failed":
        return END
    return "search"

# 5. BUILD THE GRAPH
workflow = StateGraph(AgentState)

workflow.add_node("search", search_node)
workflow.set_entry_point("search")

workflow.add_conditional_edges(
    "search",
    check_goal,
    {
        "search": "search",
        END: END
    }
)

app = workflow.compile()

# --- 6. RUNNER (Mock Frontend) ---
if __name__ == "__main__":
    import sys
    
    # Change this to "dfs" to see the difference!
    MODE = "dfs" 
    START = "Microwave"
    TARGET = "Chocolate"

    initial_state = {
        "target": TARGET,
        "mode": MODE,
        "model_name": "meta-llama/llama-3-70b-instruct",
        "queue": [(START, [START])],
        "visited": [],
        "current_topic": START,
        "current_path": [START],
        "status": "start",
        "node_start_time": 0.0,
        "duration_ms": 0.0
    }

    print(f"🚀 Starting {MODE.upper()} Race: {START} -> {TARGET}\n")

    max_iterations = 50  # Prevent infinite loops
    iteration = 0

    for event in app.stream(initial_state):
        iteration += 1
        if iteration > max_iterations:
            print("❌ Max iterations reached!")
            break
            
        data = event.get("search")
        if data:
            topic = data.get("current_topic")
            print(f"📡 UPDATE: Node '{topic}' added to graph.")
            
            if data.get("status") == "success":
                print(f"\n🏆 WINNER! Path found: {data['current_path']}")
                break