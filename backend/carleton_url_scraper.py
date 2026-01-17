from duckduckgo_search import DDGS

def find_target_urls(university_name, job_role, city):
    results = {}
    
    # 1. Find the University Course Calendar (The "Hub" Page)
    # We search for the "Calendar" because it usually lists ALL courses on one page.
    # Much easier than finding 50 separate PDFs.
    query_school = f"{university_name} computer science undergraduate calendar courses site:.edu OR site:.ca"
    
    with DDGS() as ddgs:
        # Get the top 1 result for the school
        school_search = list(ddgs.text(query_school, max_results=1))
        if school_search:
            results['syllabus_url'] = school_search[0]['href']
        
        # 2. Find Job Postings (Targeting specific boards for cleaner data)
        # We look for 5 recent job links
        query_jobs = f"{job_role} jobs {city} site:greenhouse.io OR site:lever.co"
        job_search = list(ddgs.text(query_jobs, max_results=5))
        
        results['job_urls'] = [item['href'] for item in job_search]
        
    return results

# --- TEST IT ---
data = find_target_urls("Carleton University", "Software Engineer", "Ottawa")
print(f"Found Syllabus Hub: {data['syllabus_url']}")
print(f"Found Job Links: {data['job_urls']}")