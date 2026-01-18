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
        return list(set(links))[:100]  # Cap at 100 to avoid overload
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
        current_topic, path = queue.pop()   # LIFO (back) for DFS
    
    print(f"🕵️ Visiting: {current_topic} (Depth: {len(path)})")

    if current_topic in state["visited"]:
        duration_ms = (time.time() - start_time) * 1000
        return {
            "queue": queue,
            "visited": state["visited"],
            "status": "searching",
            "duration_ms": duration_ms
        }
    
    # Check Success (EXACT match only)
    target_lower = state["target"].lower()
    topic_lower = current_topic.lower()
    
    # Only exact match - must be identical
    if topic_lower == target_lower:
        print(f"   🎯 TARGET FOUND: {current_topic}")
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
    target_lower = state["target"].lower()
    
    for link in links:
        link_lower = link.lower()
        # Only exact match - must be identical
        if link_lower == target_lower:
            print(f"   🎯 Target spotted in links: {link}!")
            # Add target to front of queue immediately to win next turn
            new_queue = [(link, path + [link])] + queue
            duration_ms = (time.time() - start_time) * 1000
            return {
                "queue": new_queue, 
                "visited": state["visited"] + [current_topic],
                "current_topic": current_topic,
                "current_path": path,
                "duration_ms": duration_ms,
                "status": "searching"
            }

    # Ask Brain to filter links (Beam Search: Top 5 only)
    # We do this to prevent the queue from exploding with 100+ links
    
    # Build semantic hints based on target
    hints = []
    target_words = state['target'].lower().split()
    
    # Category detection for better prompting
    food_words = ['food', 'chocolate', 'candy', 'cooking', 'recipe', 'cuisine', 'restaurant', 'dessert', 'sugar', 'cocoa']
    tech_words = ['computer', 'software', 'technology', 'internet', 'device', 'electronics']
    person_words = ['person', 'people', 'human', 'actor', 'athlete', 'scientist', 'politician']
    place_words = ['city', 'country', 'place', 'location', 'state', 'continent']
    
    if any(word in state['target'].lower() for word in food_words):
        hints = ['food-related', 'ingredients', 'cooking', 'products', 'cuisine']
    elif any(word in state['target'].lower() for word in tech_words):
        hints = ['technology', 'computers', 'innovation', 'companies', 'inventors']
    elif any(word in state['target'].lower() for word in person_words):
        hints = ['people', 'biography', 'careers', 'achievements', 'nationality']
    elif any(word in state['target'].lower() for word in place_words):
        hints = ['geography', 'locations', 'regions', 'countries', 'cities']
    else:
        hints = ['concepts', 'related topics', 'broader categories']
    
    prompt = f"""Task: Find Wikipedia path from "{current_topic}" to "{state['target']}"

Current page: {current_topic}
Target: {state['target']}
Available Wikipedia links: {json.dumps(links[:40])}

Strategy: Pick 5 links that create the shortest conceptual bridge to "{state['target']}". 

Good links are:
- Directly related to the target topic
- One semantic step closer ({', '.join(hints)})
- Bridge concepts that connect current topic to target
- NOT: random dates, citations, generic terms, unrelated places

Example reasoning:
- If target is "Chocolate" and current is "Microwave", prefer: Food → Cooking → Candy
- If target is "Einstein" and current is "Physics", prefer: Scientists → German → Relativity

CRITICAL: Your response must be ONLY this JSON structure with NO additional text:
{{"links":["Link1","Link2","Link3","Link4","Link5"]}}

The links MUST be chosen from the available links list above. Choose the 5 most relevant."""
    
    try:
        llm = get_llm(state["model_name"])
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        if not content:
            raise ValueError("Empty response from LLM")
        
        # Clean up common markdown artifacts
        content = content.replace("```json", "").replace("```", "").strip()
        
        # Try to extract JSON if there's extra text
        if '{' in content:
            start = content.index('{')
            end = content.rindex('}') + 1
            content = content[start:end]
        
        # Parse and validate
        parsed = json.loads(content)
        
        if not isinstance(parsed, dict):
            raise ValueError("Response is not a JSON object")
        
        suggested_links = parsed.get("links", [])
        
        if not isinstance(suggested_links, list):
            raise ValueError("'links' field is not a list")
        
        # Validate that links exist in the available links (fuzzy matching)
        valid_links = []
        for suggested in suggested_links[:5]:
            if not isinstance(suggested, str):
                continue
            
            # Try exact match first
            if suggested in links:
                valid_links.append(suggested)
                continue
            
            # Try case-insensitive
            for available in links:
                if suggested.lower() == available.lower():
                    valid_links.append(available)
                    break
        
        if not valid_links:
            raise ValueError(f"No valid links matched from {len(suggested_links)} suggestions")
            
        print(f"   🧠 LLM chose: {', '.join(valid_links[:3])}{'...' if len(valid_links) > 3 else ''}")
        best_links = valid_links
        
    except Exception as e:
        print(f"   ⚠️ LLM failed ({str(e)[:60]}), using smart fallback")
        
        # Smarter fallback: semantic scoring
        target_lower = state['target'].lower()
        target_words = set(target_lower.split())
        
        # Extract specific target-related terms instead of broad categories
        # Only use terms that are actually relevant to THIS specific target
        relevant_terms = []
        
        # If target has multiple words, each word is relevant
        target_words_list = [w for w in target_lower.split() if len(w) > 3]
        relevant_terms.extend(target_words_list)
        
        # Very specific semantic neighbors for common targets
        specific_mappings = {
            'chocolate': ['cocoa', 'cacao', 'confection', 'candy', 'dessert', 'sweet'],
            'microwave': ['oven', 'cooking', 'heating', 'radiation', 'electromagnetic', 'appliance'],
            'planet': ['astronomy', 'solar system', 'orbit', 'celestial', 'space'],
            'einstein': ['physics', 'relativity', 'scientist', 'german', 'nobel'],
            'football': ['sport', 'nfl', 'american football', 'game', 'team', 'player'],
            'soccer': ['sport', 'football', 'fifa', 'world cup', 'player'],
            'pizza': ['food', 'italian', 'cheese', 'dough', 'restaurant'],
            'mustard': ['condiment', 'sauce', 'food', 'spice', 'yellow'],
            'car': ['vehicle', 'automobile', 'automotive', 'transportation'],
            'computer': ['technology', 'computing', 'electronic', 'digital', 'software'],
            'obama': ['president', 'politics', 'united states', 'democrat'],
            'brady': ['football', 'quarterback', 'nfl', 'tampa bay', 'new england'],
            'apple': ['fruit', 'tree', 'food', 'orchard'],
            'apple inc': ['technology', 'computer', 'iphone', 'silicon valley'],
            'tesla': ['electric', 'car', 'vehicle', 'elon musk', 'automotive'],
            'mars': ['planet', 'solar system', 'astronomy', 'space'],
            'water': ['liquid', 'h2o', 'chemistry', 'earth'],
            'music': ['sound', 'art', 'song', 'melody', 'instrument'],
            'movie': ['film', 'cinema', 'entertainment', 'hollywood'],
            'book': ['literature', 'writing', 'author', 'publishing'],
            'coffee': ['beverage', 'drink', 'caffeine', 'bean'],
            'tea': ['beverage', 'drink', 'leaf', 'china'],
            'cheese': ['dairy', 'milk', 'food', 'fermentation'],
            'bread': ['food', 'baking', 'flour', 'wheat'],
            'rice': ['grain', 'food', 'cereal', 'asia'],
            'phone': ['telephone', 'mobile', 'communication', 'device'],
            'internet': ['network', 'web', 'online', 'digital'],
            'moon': ['satellite', 'lunar', 'astronomy', 'earth'],
            'sun': ['star', 'solar', 'astronomy', 'light'],
        }
        
        # Only add specific mappings if target matches
        for key, values in specific_mappings.items():
            if key in target_lower:
                relevant_terms.extend(values)
                break  # Only use first match
        
        # Score each link
        scored = []
        for link in links[:50]:  # Check more links for better options
            link_lower = link.lower()
            link_words = set(link_lower.split())
            score = 0
            
            # Exact target match in link
            if target_lower in link_lower or link_lower in target_lower:
                score += 1000
            
            # Target words in link
            common_words = target_words.intersection(link_words)
            score += len(common_words) * 100
            
            # Semantic category match
            for term in relevant_terms:
                if term in link_lower:
                    score += 20
            
            # Penalize very long or very short links (often metadata)
            if len(link) < 4 or len(link) > 50:
                score -= 50
            
            # Bonus for common bridge concepts
            bridge_words = ['list of', 'history of', 'types of', 'outline of']
            if any(bridge in link_lower for bridge in bridge_words):
                score += 15
            
            scored.append((score, link))
        
        # Sort and take top 5
        scored.sort(reverse=True, key=lambda x: x[0])
        best_links = [link for score, link in scored[:5] if score > 0]
        
        # If still no good links, just take first 5
        if not best_links:
            best_links = links[:5]
        
        print(f"   📊 Fallback selected: {', '.join(best_links[:3])}")

    # Format new items: (link, path_to_link)
    new_items = [(l, path + [l]) for l in best_links if l not in state["visited"]]

    # --- RE-QUEUE STRATEGY ---
    if state["mode"] == "bfs":
        # Add to BACK (Standard Queue) - explores siblings first
        updated_queue = queue + new_items
    else:
        # Add to FRONT (Stack behavior for DFS)
        updated_queue = queue + new_items

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