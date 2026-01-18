# Deep Dive Duel

Deep Dive Duel is a competitive game where two AI agents race to find the shortest path between two Wikipedia articles. The game visualizes the graph of visited articles and the paths taken by the agents in real-time.

## Features

*   **Real-time AI Race:** Watch two AI agents navigate the Wikipedia graph to find the target article.
*   **Graph Visualization:** A dynamic graph shows the articles visited and the paths explored by the agents.
*   **Agent Analytics:** View statistics for each agent, including the number of nodes visited and the current path.
*   **Interactive Graph:** Click on nodes in the graph to see the corresponding Wikipedia article.

## Tech Stack

### Frontend

*   **React** 
*   **Vite** 
*   **react-force-graph-2d:** A React component for 2D force-directed graph visualizations.
*   **Lucide React:** A library of simply designed icons.

### Backend

*   **Python** 
*   **FastAPI** 
*   **LangChain:** A framework for developing applications powered by language models.
*   **Wikipedia-API:** A Python wrapper for the official Wikipedia API.
*   **WebSockets:** For real-time communication between the backend and frontend.

## Setup and Installation

### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**
    *   On Windows:
        ```bash
        .\venv\Scripts\activate
        ```
    *   On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```

4.  **Install the required dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Create a `.env` file** in the `backend` directory and add your OpenAI API key:
    ```
    OPENROUTER_API_KEY=your_openai_api_key
    ```

### Frontend

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install the required dependencies:**
    ```bash
    npm install
    ```

## Running the Application

1.  **Start the backend server:**
    *   Make sure you are in the `backend` directory with the virtual environment activated.
    *   Run the following command:
        ```bash
        python .\main.py
        ```
    *   The backend server will be running at `http://127.0.0.1:8000`.

2.  **Start the frontend development server:**
    *   Make sure you are in the `frontend` directory.
    *   Run the following command:
        ```bash
        npm run dev
        ```
    *   The frontend application will be available at `http://localhost:5173` (or another port if 5173 is in use).

3.  **Open your browser** and navigate to the frontend URL to use the application.
