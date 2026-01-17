import os
import json
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
llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    model="meta-llama/llama-3-70b-instruct", # Cheap & Fast
    temperature=0
)

# 2. THE EYES (Scraper)
def get_wikipedia_links(topic: str) -> List[str]:
    """Scrapes Wikipedia for links. Returns a clean list of topics."""
    url = f"https://en.wikipedia.org/wiki/{topic.replace(' ', '_')}"
    try:
        response = requests.get(url, headers={'User-Agent': 'HackathonBot/1.0'}, timeout=5)
        if response.status_code != 200: return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        content = soup.find('div', {'id': 'bodyContent'})
        
        links = []
        for a in content.find_all('a', href=True):
            href = a['href']
            if href.startswith('/wiki/') and ':' not in href:
                clean = href.replace('/wiki/', '').replace('_', ' ')
                links.append(clean)
        return list(set(links))
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
        return {"status": "failed"} # Queue empty, gave up

    # --- CRITICAL: BFS vs DFS Logic happens here ---
    # BFS = FIFO (Pop from front)
    # DFS = LIFO (Pop from front... because we ADD to front later)
    if state["mode"] == "bfs":
        current_topic, path = queue.pop(0)  # FIFO (front)
    else:
        current_topic, path = queue.pop(0)   # LIFO (back) for DFS
    
    print(f"🕵️ Visiting: {current_topic} (Depth: {len(path)})")

    if current_topic in state["visited"]:
        duration_ms = (time.time() - start_time) * 1000
        return {
            "queue": queue,
            "visited": state["visited"],
            "status": "searching",
            "duration_ms": duration_ms
        }
    
    # Check Success
    if current_topic.lower() == state["target"].lower():
        duration_ms = (time.time() - start_time) * 1000
        return {
            "current_topic": current_topic,
            "status": "success", 
            "current_path": path,
            "duration_ms": duration_ms
        }

    # Scrape
    links = get_wikipedia_links(current_topic)
    
    # Optimization: Check if target is in links before asking LLM
    if any(state["target"].lower() == l.lower() for l in links):
        print("   🎯 Target spotted in links!")
        # Add target to front of queue immediately to win next turn
        new_queue = [(state["target"], path + [state["target"]])] + queue
        duration_ms = (time.time() - start_time) * 1000
        return {
            "queue": new_queue, 
            "visited": state["visited"] + [current_topic],
            "current_topic": current_topic,
            "current_path": path,
            "duration_ms": duration_ms,
            "status": "searching"
        }

    # Ask Brain to filter links (Beam Search: Top 3 only)
    # We do this to prevent the queue from exploding with 300 links
    prompt = f"""
    I am at: {current_topic}. Target: {state['target']}.
    Links available: {json.dumps(links[:60])}
    
    Return JSON with the top 3 semantically relevant links:
    {{ "links": ["Link A", "Link B"] }}
    """
    try:
        response = llm.invoke(prompt)
        content = response.content.replace("```json", "").replace("```", "")
        best_links = json.loads(content).get("links", [])
    except:
        best_links = links[:3] # Fallback if LLM fails

    # Format new items: (link, path_to_link)
    new_items = [(l, path + [l]) for l in best_links if l not in state["visited"]]

    # --- RE-QUEUE STRATEGY ---
    if state["mode"] == "bfs":
        # Add to BACK (Standard Queue)
        updated_queue = queue + new_items
    else:
        # Add to FRONT (Stack behavior for DFS)
        updated_queue = new_items + queue

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