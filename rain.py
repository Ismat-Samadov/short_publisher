import urllib.request
import urllib.parse
import json
import csv
import os
from io import StringIO
from typing import Dict, List, Optional

class WeatherDataFetcher:
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        if params is None:
            params = {}
            
        query_string = urllib.parse.urlencode(params)
        
        # Try different API path patterns
        api_paths = [
            f"/api/3/action/{endpoint}",
            f"/api/action/{endpoint}",
            f"/data/api/3/action/{endpoint}"
        ]
        
        headers = {'User-Agent': 'WeatherDataFetcher/1.0'}
        if self.api_key:
            headers['Authorization'] = self.api_key
            
        for api_path in api_paths:
            url = f"{self.base_url}{api_path}"
            if query_string:
                url += f"?{query_string}"
                
            request = urllib.request.Request(url, headers=headers)
            
            try:
                with urllib.request.urlopen(request, timeout=10) as response:
                    data = json.loads(response.read().decode())
                    if data.get('success') is not False:
                        return data
            except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as error:
                continue
                
        raise Exception(f'All API endpoints failed for {self.base_url}')
    
    def search_weather_datasets(self, query: str = "weather", rows: int = 10) -> List[Dict]:
        params = {
            'q': query,
            'rows': rows,
            'sort': 'metadata_modified desc'
        }
        
        result = self._make_request('package_search', params)
        
        if result.get('success'):
            return result['result']['results']
        else:
            raise Exception(f"Search failed: {result.get('error', 'Unknown error')}")
    
    def get_dataset_details(self, dataset_id: str) -> Dict:
        params = {'id': dataset_id}
        result = self._make_request('package_show', params)
        
        if result.get('success'):
            return result['result']
        else:
            raise Exception(f"Failed to get dataset {dataset_id}: {result.get('error', 'Unknown error')}")
    
    def get_resource_data(self, resource_id: str) -> Dict:
        params = {'id': resource_id}
        result = self._make_request('resource_show', params)
        
        if result.get('success'):
            return result['result']
        else:
            raise Exception(f"Failed to get resource {resource_id}: {result.get('error', 'Unknown error')}")
    
    def download_data_from_url(self, url: str, max_rows: int = 10) -> Dict:
        """Download and parse actual data from resource URL"""
        headers = {'User-Agent': 'WeatherDataFetcher/1.0'}
        request = urllib.request.Request(url, headers=headers)
        
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                content = response.read().decode('utf-8')
                
                # Determine format and parse
                if url.endswith('.csv') or 'csv' in url.lower():
                    return self._parse_csv_data(content, max_rows)
                elif url.endswith('.json') or 'json' in response.headers.get('content-type', ''):
                    return json.loads(content)
                else:
                    # Try to parse as JSON first, then CSV
                    try:
                        return json.loads(content)
                    except json.JSONDecodeError:
                        return self._parse_csv_data(content, max_rows)
                        
        except Exception as error:
            raise Exception(f"Failed to download data from {url}: {error}")
    
    def download_and_save_file(self, url: str, filename: str, data_dir: str = "data") -> str:
        """Download file and save it locally"""
        # Create data directory if it doesn't exist
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
        
        headers = {'User-Agent': 'WeatherDataFetcher/1.0'}
        request = urllib.request.Request(url, headers=headers)
        
        filepath = os.path.join(data_dir, filename)
        
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                content = response.read()
                
                # Save as binary first, then try to decode if needed
                with open(filepath, 'wb') as f:
                    f.write(content)
                
                return filepath
                
        except Exception as error:
            raise Exception(f"Failed to download and save {url}: {error}")
    
    def _parse_csv_data(self, content: str, max_rows: int = 10) -> Dict:
        """Parse CSV content and return structured data"""
        csv_reader = csv.reader(StringIO(content))
        rows = list(csv_reader)
        
        if not rows:
            return {"error": "Empty CSV file"}
        
        headers = rows[0] if rows else []
        data_rows = rows[1:max_rows+1] if len(rows) > 1 else []
        
        return {
            "format": "CSV",
            "headers": headers,
            "total_rows": len(rows) - 1,
            "sample_data": data_rows,
            "showing_rows": len(data_rows)
        }

# Common weather data sources with CKAN endpoints
WEATHER_SOURCES = {
    'azerbaijan': 'https://admin.opendata.az',
    'canada': 'https://open.canada.ca/data/en',
    'usa_data': 'https://catalog.data.gov',
    'opendatani': 'https://www.opendatani.gov.uk'
}

def fetch_weather_from_multiple_sources(sources: Dict[str, str], query: str = "weather"):
    results = {}
    
    for source_name, base_url in sources.items():
        print(f"\n--- Fetching from {source_name.upper()} ---")
        fetcher = WeatherDataFetcher(base_url)
        
        try:
            datasets = fetcher.search_weather_datasets(query=query, rows=3)
            results[source_name] = datasets
            
            print(f"✓ Found {len(datasets)} weather datasets")
            for i, dataset in enumerate(datasets, 1):
                title = dataset.get('title', 'Untitled')[:60]
                print(f"  {i}. {title}")
                
        except Exception as error:
            print(f"✗ Error fetching from {source_name}: {str(error)[:100]}")
            results[source_name] = []
    
    return results

def get_azerbaijan_weather_data():
    """Fetch all Azerbaijan weather datasets (rain, temperature, city weather)"""
    print("=== AZERBAIJAN WEATHER DATA ===")
    az_fetcher = WeatherDataFetcher('https://admin.opendata.az')
    
    datasets = {
        'rainfall': 'yagintinin-miqdari',
        'temperature': 'havanin-temperaturu',
        'city_weather': 'seher-merkezleri-uzre-cari-hava-melumatlari'
    }
    
    results = {}
    
    for weather_type, dataset_id in datasets.items():
        try:
            print(f"\n--- Fetching {weather_type.upper()} data ---")
            data = az_fetcher.get_dataset_details(dataset_id)
            results[weather_type] = data
            
            print(f"✓ {data.get('title', 'N/A')}")
            print(f"  Description: {data.get('notes', 'N/A')[:100]}...")
            print(f"  Resources: {len(data.get('resources', []))}")
            
            # Show resource details and download actual data
            for i, resource in enumerate(data.get('resources', [])[:1], 1):
                print(f"  Resource {i}: {resource.get('name', 'Unnamed')}")
                print(f"    Format: {resource.get('format', 'Unknown')}")
                resource_url = resource.get('url', 'N/A')
                print(f"    URL: {resource_url}")
                
                # Download and save actual data files
                if resource_url != 'N/A':
                    try:
                        # Determine file extension
                        file_ext = 'csv' if resource.get('format', '').lower() == 'csv' else 'json'
                        filename = f"{weather_type}_{dataset_id}.{file_ext}"
                        
                        print(f"    💾 Downloading and saving to file...")
                        saved_path = az_fetcher.download_and_save_file(resource_url, filename)
                        print(f"    ✅ Saved: {saved_path}")
                        
                        # Also show preview of the data
                        actual_data = az_fetcher.download_data_from_url(resource_url, max_rows=3)
                        
                        if actual_data.get('format') == 'CSV':
                            print(f"    📊 Preview - Total rows: {actual_data['total_rows']}")
                            print(f"    Headers: {', '.join(actual_data['headers'][:5])}")
                            print(f"    First 3 rows:")
                            for j, row in enumerate(actual_data['sample_data'], 1):
                                print(f"      {j}: {', '.join(str(cell)[:15] for cell in row[:3])}")
                        else:
                            # JSON data
                            if isinstance(actual_data, dict):
                                print(f"    📊 JSON structure - Keys: {list(actual_data.keys())[:3]}")
                                if 'data' in actual_data:
                                    print(f"    Data entries: {len(actual_data.get('data', []))}")
                                elif 'datas' in actual_data:
                                    print(f"    Data entries: {len(actual_data.get('datas', []))}")
                    
                    except Exception as e:
                        print(f"    ✗ Could not download data: {e}")
                
        except Exception as error:
            print(f"✗ Error fetching {weather_type}: {error}")
            results[weather_type] = None
    
    return results

if __name__ == "__main__":
    # Get all Azerbaijan weather data (combines all 3 original scripts)
    az_weather = get_azerbaijan_weather_data()
    
    # Search across multiple international sources
    print("\n\n=== MULTI-SOURCE SEARCH EXAMPLE ===")
    all_results = fetch_weather_from_multiple_sources(WEATHER_SOURCES, "weather OR climate")
    
    # Summary
    print(f"\n=== SUMMARY ===")
    
    # Azerbaijan specific datasets
    az_count = sum(1 for data in az_weather.values() if data is not None)
    print(f"Azerbaijan weather datasets: {az_count}/3")
    
    # International datasets
    total_international = sum(len(datasets) for datasets in all_results.values())
    print(f"International weather datasets found: {total_international}")
    
    for source, datasets in all_results.items():
        print(f"  {source}: {len(datasets)} datasets")
        
    print(f"\nTotal datasets accessible: {az_count + total_international}") 