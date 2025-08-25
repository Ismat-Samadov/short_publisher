import pandas as pd
import json
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import os
from datetime import datetime
from scipy import stats
from sklearn.cluster import KMeans
from scipy.signal import savgol_filter
import warnings
warnings.filterwarnings('ignore')

# Create charts directory
os.makedirs('charts', exist_ok=True)

# Set style for better-looking charts
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

def load_rainfall_data():
    """Load and process rainfall data"""
    df = pd.read_csv('data/rainfall_yagintinin-miqdari.csv', encoding='utf-8', sep=';')
    
    # Clean and process the data
    years = ['2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', 
             '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', 
             '2020', '2021', '2022', '2023']
    
    # Extract country-wide annual rainfall data
    country_rainfall = []
    baku_rainfall = []
    ganja_rainfall = []
    
    # Row 4 contains country annual rainfall
    country_row = df.iloc[3]
    for year in years:
        try:
            val = str(country_row[year]).replace(',', '.').strip()
            if val and val != 'nan' and val != '':
                country_rainfall.append(float(val))
            else:
                country_rainfall.append(None)
        except:
            country_rainfall.append(None)
    
    # Row 8 contains Baku annual rainfall  
    baku_row = df.iloc[7]
    for year in years:
        try:
            val = str(baku_row[year]).replace(',', '.').strip()
            if val and val != 'nan' and val != '':
                baku_rainfall.append(float(val))
            else:
                baku_rainfall.append(None)
        except:
            baku_rainfall.append(None)
    
    # Row 14 contains Ganja annual rainfall
    ganja_row = df.iloc[13]
    for year in years:
        try:
            val = str(ganja_row[year]).replace(',', '.').strip()
            if val and val != 'nan' and val != '':
                ganja_rainfall.append(float(val))
            else:
                ganja_rainfall.append(None)
        except:
            ganja_rainfall.append(None)
    
    return pd.DataFrame({
        'Year': years,
        'Country': country_rainfall,
        'Baku': baku_rainfall,
        'Ganja': ganja_rainfall
    })

def load_temperature_data():
    """Load and process temperature data"""
    df = pd.read_csv('data/temperature_havanin-temperaturu.csv', encoding='utf-8', sep=';')
    
    years = ['2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', 
             '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', 
             '2020', '2021', '2022', '2023']
    
    # Extract temperature data
    country_temp = []
    baku_temp = []
    ganja_temp = []
    
    # Row 4 contains country annual temperature
    country_row = df.iloc[3]
    for year in years:
        try:
            val = str(country_row[year]).replace(',', '.').strip()
            if val and val != 'nan' and val != '':
                country_temp.append(float(val))
            else:
                country_temp.append(None)
        except:
            country_temp.append(None)
    
    # Row 10 contains Baku annual temperature
    baku_row = df.iloc[9]
    for year in years:
        try:
            val = str(baku_row[year]).replace(',', '.').strip()
            if val and val != 'nan' and val != '':
                baku_temp.append(float(val))
            else:
                baku_temp.append(None)
        except:
            baku_temp.append(None)
    
    # Row 16 contains Ganja annual temperature
    ganja_row = df.iloc[15]
    for year in years:
        try:
            val = str(ganja_row[year]).replace(',', '.').strip()
            if val and val != 'nan' and val != '':
                ganja_temp.append(float(val))
            else:
                ganja_temp.append(None)
        except:
            ganja_temp.append(None)
    
    return pd.DataFrame({
        'Year': years,
        'Country': country_temp,
        'Baku': baku_temp,
        'Ganja': ganja_temp
    })

def load_current_weather_data():
    """Load and process current city weather data"""
    with open('data/city_weather_seher-merkezleri-uzre-cari-hava-melumatlari.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    cities_data = []
    for city in data['datas']:
        cities_data.append({
            'lat': float(city['lat']),
            'lon': float(city['lon']),
            'temp': float(city['temp']),
            'temp_day': city.get('temp_day', None),
            'temp_night': city.get('temp_night', None),
            'icon': city.get('icon', 'unknown')
        })
    
    return pd.DataFrame(cities_data)

def create_rainfall_charts(rainfall_df):
    """Create rainfall analysis charts"""
    # Chart 1: Annual Rainfall Trends
    plt.figure(figsize=(12, 8))
    
    years_int = [int(y) for y in rainfall_df['Year']]
    
    plt.subplot(2, 2, 1)
    plt.plot(years_int, rainfall_df['Country'], marker='o', linewidth=2, label='Country Average')
    plt.plot(years_int, rainfall_df['Baku'], marker='s', linewidth=2, label='Baku')
    plt.plot(years_int, rainfall_df['Ganja'], marker='^', linewidth=2, label='Ganja')
    plt.title('Annual Rainfall Trends (2002-2023)', fontsize=14, fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Rainfall (mm)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    
    # Chart 2: Average Rainfall Comparison
    plt.subplot(2, 2, 2)
    avg_rainfall = [
        rainfall_df['Country'].mean(),
        rainfall_df['Baku'].mean(),
        rainfall_df['Ganja'].mean()
    ]
    locations = ['Country', 'Baku', 'Ganja']
    bars = plt.bar(locations, avg_rainfall, color=['#1f77b4', '#ff7f0e', '#2ca02c'])
    plt.title('Average Annual Rainfall (2002-2023)', fontsize=14, fontweight='bold')
    plt.ylabel('Rainfall (mm)')
    
    # Add value labels on bars
    for bar, value in zip(bars, avg_rainfall):
        plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 5, 
                f'{value:.1f}mm', ha='center', va='bottom')
    
    # Chart 3: Rainfall Variability
    plt.subplot(2, 2, 3)
    rainfall_data = [rainfall_df['Country'].dropna(), rainfall_df['Baku'].dropna(), rainfall_df['Ganja'].dropna()]
    plt.boxplot(rainfall_data, labels=['Country', 'Baku', 'Ganja'])
    plt.title('Rainfall Variability Distribution', fontsize=14, fontweight='bold')
    plt.ylabel('Rainfall (mm)')
    
    # Chart 4: Drought/Wet Years Analysis
    plt.subplot(2, 2, 4)
    country_mean = rainfall_df['Country'].mean()
    rainfall_anomaly = rainfall_df['Country'] - country_mean
    colors = ['red' if x < 0 else 'blue' for x in rainfall_anomaly]
    plt.bar(years_int, rainfall_anomaly, color=colors, alpha=0.7)
    plt.title('Rainfall Anomaly (Deviation from Mean)', fontsize=14, fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Anomaly (mm)')
    plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig('charts/rainfall_analysis.png', dpi=300, bbox_inches='tight')
    plt.close()

def create_temperature_charts(temp_df):
    """Create temperature analysis charts"""
    plt.figure(figsize=(12, 8))
    
    years_int = [int(y) for y in temp_df['Year']]
    
    # Chart 1: Temperature Trends
    plt.subplot(2, 2, 1)
    plt.plot(years_int, temp_df['Country'], marker='o', linewidth=2, label='Country Average')
    plt.plot(years_int, temp_df['Baku'], marker='s', linewidth=2, label='Baku')
    plt.plot(years_int, temp_df['Ganja'], marker='^', linewidth=2, label='Ganja')
    plt.title('Annual Temperature Trends (2002-2023)', fontsize=14, fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Temperature (°C)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    
    # Chart 2: Temperature Comparison
    plt.subplot(2, 2, 2)
    avg_temp = [
        temp_df['Country'].mean(),
        temp_df['Baku'].mean(),
        temp_df['Ganja'].mean()
    ]
    locations = ['Country', 'Baku', 'Ganja']
    bars = plt.bar(locations, avg_temp, color=['#d62728', '#ff7f0e', '#2ca02c'])
    plt.title('Average Annual Temperature (2002-2023)', fontsize=14, fontweight='bold')
    plt.ylabel('Temperature (°C)')
    
    # Add value labels
    for bar, value in zip(bars, avg_temp):
        plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.1, 
                f'{value:.1f}°C', ha='center', va='bottom')
    
    # Chart 3: Temperature Warming Trend
    plt.subplot(2, 2, 3)
    z = np.polyfit(years_int, temp_df['Country'], 1)
    p = np.poly1d(z)
    plt.plot(years_int, temp_df['Country'], 'o-', alpha=0.7, label='Annual Temperature')
    plt.plot(years_int, p(years_int), "r--", alpha=0.8, linewidth=2, label=f'Trend: +{z[0]:.3f}°C/year')
    plt.title('Climate Change Trend - Country Average', fontsize=14, fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Temperature (°C)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    
    # Chart 4: Temperature Anomaly
    plt.subplot(2, 2, 4)
    baseline_temp = temp_df['Country'][:10].mean()  # 2002-2011 baseline
    temp_anomaly = temp_df['Country'] - baseline_temp
    colors = ['blue' if x < 0 else 'red' for x in temp_anomaly]
    plt.bar(years_int, temp_anomaly, color=colors, alpha=0.7)
    plt.title(f'Temperature Anomaly (vs 2002-2011 baseline: {baseline_temp:.1f}°C)', fontsize=12, fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Anomaly (°C)')
    plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig('charts/temperature_analysis.png', dpi=300, bbox_inches='tight')
    plt.close()

def create_current_weather_charts(current_df):
    """Create current weather analysis charts"""
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    
    # Chart 1: Temperature Distribution
    axes[0, 0].hist(current_df['temp'], bins=20, alpha=0.7, color='skyblue', edgecolor='black')
    axes[0, 0].set_title('Current Temperature Distribution Across Cities', fontsize=14, fontweight='bold')
    axes[0, 0].set_xlabel('Temperature (°C)')
    axes[0, 0].set_ylabel('Number of Cities')
    axes[0, 0].axvline(current_df['temp'].mean(), color='red', linestyle='--', 
                      label=f'Mean: {current_df["temp"].mean():.1f}°C')
    axes[0, 0].legend()
    axes[0, 0].grid(True, alpha=0.3)
    
    # Chart 2: Geographic Temperature Map
    scatter = axes[0, 1].scatter(current_df['lon'], current_df['lat'], c=current_df['temp'], 
                               s=50, cmap='coolwarm', alpha=0.8)
    axes[0, 1].set_title('Temperature by Geographic Location', fontsize=14, fontweight='bold')
    axes[0, 1].set_xlabel('Longitude')
    axes[0, 1].set_ylabel('Latitude')
    plt.colorbar(scatter, ax=axes[0, 1], label='Temperature (°C)')
    
    # Chart 3: Day/Night Temperature Comparison
    day_temps = current_df['temp_day'].dropna()
    night_temps = current_df['temp_night'].dropna()
    
    x = np.arange(len(['Day', 'Night']))
    temps = [day_temps.mean(), night_temps.mean()]
    bars = axes[1, 0].bar(x, temps, color=['orange', 'navy'], alpha=0.7)
    axes[1, 0].set_title('Average Day vs Night Temperature', fontsize=14, fontweight='bold')
    axes[1, 0].set_xticks(x)
    axes[1, 0].set_xticklabels(['Day', 'Night'])
    axes[1, 0].set_ylabel('Temperature (°C)')
    
    # Add value labels
    for bar, temp in zip(bars, temps):
        axes[1, 0].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5, 
                       f'{temp:.1f}°C', ha='center', va='bottom')
    
    # Chart 4: Weather Conditions Distribution
    weather_counts = current_df['icon'].value_counts()
    weather_labels = [label.replace('_', ' ').title() for label in weather_counts.index[:6]]
    
    axes[1, 1].pie(weather_counts.values[:6], labels=weather_labels, autopct='%1.1f%%', 
                  startangle=90)
    axes[1, 1].set_title('Current Weather Conditions Distribution', fontsize=14, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('charts/current_weather_analysis.png', dpi=300, bbox_inches='tight')
    plt.close()

def generate_statistics():
    """Generate comprehensive weather statistics"""
    rainfall_df = load_rainfall_data()
    temp_df = load_temperature_data()
    current_df = load_current_weather_data()
    
    stats = {
        'rainfall': {
            'country_avg': rainfall_df['Country'].mean(),
            'country_std': rainfall_df['Country'].std(),
            'baku_avg': rainfall_df['Baku'].mean(),
            'ganja_avg': rainfall_df['Ganja'].mean(),
            'wettest_year': rainfall_df.loc[rainfall_df['Country'].idxmax(), 'Year'],
            'driest_year': rainfall_df.loc[rainfall_df['Country'].idxmin(), 'Year'],
            'max_rainfall': rainfall_df['Country'].max(),
            'min_rainfall': rainfall_df['Country'].min()
        },
        'temperature': {
            'country_avg': temp_df['Country'].mean(),
            'country_std': temp_df['Country'].std(),
            'baku_avg': temp_df['Baku'].mean(),
            'ganja_avg': temp_df['Ganja'].mean(),
            'warmest_year': temp_df.loc[temp_df['Country'].idxmax(), 'Year'],
            'coolest_year': temp_df.loc[temp_df['Country'].idxmin(), 'Year'],
            'warming_trend': np.polyfit([int(y) for y in temp_df['Year']], temp_df['Country'], 1)[0]
        },
        'current': {
            'cities_count': len(current_df),
            'temp_avg': current_df['temp'].mean(),
            'temp_std': current_df['temp'].std(),
            'temp_max': current_df['temp'].max(),
            'temp_min': current_df['temp'].min(),
            'day_temp_avg': current_df['temp_day'].mean(),
            'night_temp_avg': current_df['temp_night'].mean()
        }
    }
    
    return stats

def create_correlation_analysis(rainfall_df, temp_df):
    """Create correlation analysis between rainfall and temperature"""
    plt.figure(figsize=(15, 10))
    
    # Merge data for correlation analysis
    years = [int(y) for y in rainfall_df['Year']]
    
    # Chart 1: Rainfall vs Temperature Correlation
    plt.subplot(2, 3, 1)
    plt.scatter(rainfall_df['Country'], temp_df['Country'], alpha=0.7, s=60)
    
    # Add correlation coefficient
    corr_coef = np.corrcoef(rainfall_df['Country'].dropna(), temp_df['Country'].dropna())[0,1]
    plt.title(f'Rainfall vs Temperature\nCorrelation: {corr_coef:.3f}', fontweight='bold')
    plt.xlabel('Annual Rainfall (mm)')
    plt.ylabel('Annual Temperature (°C)')
    
    # Add trend line
    z = np.polyfit(rainfall_df['Country'].dropna(), temp_df['Country'].dropna(), 1)
    p = np.poly1d(z)
    x_trend = np.linspace(rainfall_df['Country'].min(), rainfall_df['Country'].max(), 100)
    plt.plot(x_trend, p(x_trend), "r--", alpha=0.8)
    plt.grid(True, alpha=0.3)
    
    # Chart 2: Year-over-year changes
    plt.subplot(2, 3, 2)
    rainfall_changes = rainfall_df['Country'].diff()
    temp_changes = temp_df['Country'].diff()
    plt.scatter(rainfall_changes[1:], temp_changes[1:], alpha=0.7, s=60, c=years[1:], cmap='viridis')
    plt.colorbar(label='Year')
    plt.title('Annual Changes: Rainfall vs Temperature', fontweight='bold')
    plt.xlabel('Rainfall Change (mm)')
    plt.ylabel('Temperature Change (°C)')
    plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
    plt.axvline(x=0, color='black', linestyle='-', alpha=0.3)
    plt.grid(True, alpha=0.3)
    
    # Chart 3: Rainfall-Temperature Index
    plt.subplot(2, 3, 3)
    # Create drought index (lower rainfall + higher temp = higher drought risk)
    drought_index = (temp_df['Country'] - temp_df['Country'].mean()) / temp_df['Country'].std() - \
                   (rainfall_df['Country'] - rainfall_df['Country'].mean()) / rainfall_df['Country'].std()
    
    colors = ['red' if x > 1 else 'orange' if x > 0.5 else 'yellow' if x > 0 else 'lightblue' if x > -0.5 else 'blue' 
             for x in drought_index]
    bars = plt.bar(years, drought_index, color=colors, alpha=0.7)
    plt.title('Climate Stress Index\n(High temp + Low rainfall)', fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Stress Index')
    plt.axhline(y=0, color='black', linestyle='-', alpha=0.5)
    plt.xticks(rotation=45)
    
    # Chart 4: Moving averages
    plt.subplot(2, 3, 4)
    rainfall_smooth = savgol_filter(rainfall_df['Country'], window_length=5, polyorder=2)
    temp_smooth = savgol_filter(temp_df['Country'], window_length=5, polyorder=2)
    
    ax1 = plt.gca()
    ax1.plot(years, rainfall_smooth, 'b-', linewidth=2, label='Rainfall (5yr avg)')
    ax1.set_xlabel('Year')
    ax1.set_ylabel('Rainfall (mm)', color='b')
    ax1.tick_params(axis='y', labelcolor='b')
    
    ax2 = ax1.twinx()
    ax2.plot(years, temp_smooth, 'r-', linewidth=2, label='Temperature (5yr avg)')
    ax2.set_ylabel('Temperature (°C)', color='r')
    ax2.tick_params(axis='y', labelcolor='r')
    
    plt.title('Smoothed Climate Trends', fontweight='bold')
    
    # Chart 5: Extreme Events Matrix
    plt.subplot(2, 3, 5)
    # Define extreme events
    hot_years = temp_df['Country'] > temp_df['Country'].quantile(0.8)
    dry_years = rainfall_df['Country'] < rainfall_df['Country'].quantile(0.2)
    wet_years = rainfall_df['Country'] > rainfall_df['Country'].quantile(0.8)
    cold_years = temp_df['Country'] < temp_df['Country'].quantile(0.2)
    
    # Create matrix
    extreme_matrix = np.zeros((2, 2))
    extreme_matrix[0, 0] = sum(hot_years & dry_years)  # Hot & Dry
    extreme_matrix[0, 1] = sum(hot_years & wet_years)  # Hot & Wet  
    extreme_matrix[1, 0] = sum(cold_years & dry_years) # Cold & Dry
    extreme_matrix[1, 1] = sum(cold_years & wet_years) # Cold & Wet
    
    sns.heatmap(extreme_matrix, annot=True, fmt='.0f', cmap='Reds',
                xticklabels=['Dry', 'Wet'], yticklabels=['Hot', 'Cold'])
    plt.title('Extreme Weather Combinations\n(Count of Years)', fontweight='bold')
    
    # Chart 6: Statistical relationships
    plt.subplot(2, 3, 6)
    # Calculate rolling correlations
    window = 7
    rolling_corr = []
    years_corr = []
    
    for i in range(window, len(rainfall_df)):
        rf_window = rainfall_df['Country'].iloc[i-window:i]
        temp_window = temp_df['Country'].iloc[i-window:i]
        if len(rf_window.dropna()) >= 5 and len(temp_window.dropna()) >= 5:
            corr = np.corrcoef(rf_window.dropna(), temp_window.dropna())[0,1]
            rolling_corr.append(corr)
            years_corr.append(int(rainfall_df['Year'].iloc[i]))
    
    plt.plot(years_corr, rolling_corr, 'o-', linewidth=2, markersize=4)
    plt.title(f'Rolling Correlation ({window}-year window)', fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Correlation Coefficient')
    plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('charts/correlation_analysis.png', dpi=300, bbox_inches='tight')
    plt.close()

def create_geographic_analysis(current_df):
    """Create geographic clustering and regional analysis"""
    plt.figure(figsize=(16, 12))
    
    # Chart 1: Temperature Clustering
    plt.subplot(2, 3, 1)
    
    # Perform k-means clustering on geographic coordinates
    coords = current_df[['lat', 'lon']].values
    kmeans = KMeans(n_clusters=5, random_state=42)
    clusters = kmeans.fit_predict(coords)
    current_df['cluster'] = clusters
    
    scatter = plt.scatter(current_df['lon'], current_df['lat'], c=current_df['temp'], 
                         s=60, cmap='coolwarm', alpha=0.8)
    plt.colorbar(scatter, label='Temperature (°C)')
    plt.title('Temperature Distribution Map', fontweight='bold')
    plt.xlabel('Longitude')
    plt.ylabel('Latitude')
    
    # Add cluster centers
    centers = kmeans.cluster_centers_
    plt.scatter(centers[:, 1], centers[:, 0], c='black', marker='x', s=200, linewidths=3)
    
    # Chart 2: Regional Temperature Analysis
    plt.subplot(2, 3, 2)
    cluster_temps = []
    cluster_labels = []
    for i in range(5):
        cluster_data = current_df[current_df['cluster'] == i]['temp']
        if len(cluster_data) > 0:
            cluster_temps.append(cluster_data.values)
            cluster_labels.append(f'Region {i+1}\n({len(cluster_data)} cities)')
    
    bp = plt.boxplot(cluster_temps, labels=cluster_labels, patch_artist=True)
    colors = plt.cm.Set3(np.linspace(0, 1, len(bp['boxes'])))
    for patch, color in zip(bp['boxes'], colors):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)
    
    plt.title('Temperature Distribution by Region', fontweight='bold')
    plt.ylabel('Temperature (°C)')
    plt.xticks(rotation=45)
    
    # Chart 3: Elevation vs Temperature (estimated)
    plt.subplot(2, 3, 3)
    # Estimate elevation based on latitude (rough approximation)
    estimated_elevation = (current_df['lat'] - current_df['lat'].min()) * 1000
    
    plt.scatter(estimated_elevation, current_df['temp'], alpha=0.6, s=50)
    
    # Add trend line
    z = np.polyfit(estimated_elevation, current_df['temp'], 1)
    p = np.poly1d(z)
    plt.plot(estimated_elevation, p(estimated_elevation), "r--", alpha=0.8, linewidth=2)
    
    plt.title(f'Temperature vs Estimated Elevation\nSlope: {z[0]:.4f}°C/m', fontweight='bold')
    plt.xlabel('Estimated Elevation (m)')
    plt.ylabel('Temperature (°C)')
    plt.grid(True, alpha=0.3)
    
    # Chart 4: Distance from Caspian Sea effect
    plt.subplot(2, 3, 4)
    # Approximate Caspian Sea center coordinates
    caspian_lat, caspian_lon = 40.0, 50.0
    
    # Calculate distance from Caspian Sea
    distances = np.sqrt((current_df['lat'] - caspian_lat)**2 + (current_df['lon'] - caspian_lon)**2)
    current_df['distance_from_sea'] = distances
    
    plt.scatter(distances, current_df['temp'], alpha=0.6, s=50, c=current_df['temp'], cmap='coolwarm')
    plt.colorbar(label='Temperature (°C)')
    
    # Add trend line
    z = np.polyfit(distances, current_df['temp'], 1)
    p = np.poly1d(z)
    plt.plot(distances, p(distances), "r--", alpha=0.8, linewidth=2)
    
    plt.title(f'Temperature vs Distance from Caspian Sea\nSlope: {z[0]:.2f}°C/degree', fontweight='bold')
    plt.xlabel('Distance from Caspian Sea (degrees)')
    plt.ylabel('Temperature (°C)')
    plt.grid(True, alpha=0.3)
    
    # Chart 5: Temperature Gradient Analysis
    plt.subplot(2, 3, 5)
    # Create temperature contour plot
    from scipy.interpolate import griddata
    
    # Create grid
    lon_min, lon_max = current_df['lon'].min(), current_df['lon'].max()
    lat_min, lat_max = current_df['lat'].min(), current_df['lat'].max()
    
    grid_lon, grid_lat = np.mgrid[lon_min:lon_max:50j, lat_min:lat_max:50j]
    grid_temp = griddata((current_df['lon'], current_df['lat']), current_df['temp'], 
                        (grid_lon, grid_lat), method='linear')
    
    contour = plt.contourf(grid_lon, grid_lat, grid_temp, levels=15, cmap='coolwarm', alpha=0.8)
    plt.colorbar(contour, label='Temperature (°C)')
    plt.scatter(current_df['lon'], current_df['lat'], c='black', s=10, alpha=0.5)
    plt.title('Temperature Contour Map', fontweight='bold')
    plt.xlabel('Longitude')
    plt.ylabel('Latitude')
    
    # Chart 6: Regional Statistics
    plt.subplot(2, 3, 6)
    
    # Calculate regional statistics
    region_stats = current_df.groupby('cluster').agg({
        'temp': ['mean', 'std', 'min', 'max'],
        'lat': 'mean',
        'lon': 'mean'
    }).round(2)
    
    # Create a summary plot
    regions = range(1, 6)
    means = [current_df[current_df['cluster'] == i]['temp'].mean() for i in range(5)]
    stds = [current_df[current_df['cluster'] == i]['temp'].std() for i in range(5)]
    
    bars = plt.bar(regions, means, yerr=stds, capsize=5, alpha=0.7, 
                  color=plt.cm.Set3(np.linspace(0, 1, 5)))
    plt.title('Regional Temperature Statistics', fontweight='bold')
    plt.xlabel('Region')
    plt.ylabel('Temperature (°C)')
    
    # Add value labels
    for bar, mean, std in zip(bars, means, stds):
        plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + std + 0.5,
                f'{mean:.1f}±{std:.1f}°C', ha='center', va='bottom', fontsize=9)
    
    plt.tight_layout()
    plt.savefig('charts/geographic_analysis.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    return current_df

def create_extreme_weather_analysis(rainfall_df, temp_df, current_df):
    """Analyze extreme weather events and patterns"""
    plt.figure(figsize=(16, 10))
    
    years_int = [int(y) for y in rainfall_df['Year']]
    
    # Chart 1: Extreme Temperature Events
    plt.subplot(2, 3, 1)
    temp_mean = temp_df['Country'].mean()
    temp_std = temp_df['Country'].std()
    
    # Define extreme thresholds
    extreme_hot = temp_mean + 2 * temp_std
    extreme_cold = temp_mean - 2 * temp_std
    
    colors = ['darkred' if t > extreme_hot else 'red' if t > temp_mean + temp_std 
             else 'darkblue' if t < extreme_cold else 'blue' if t < temp_mean - temp_std 
             else 'gray' for t in temp_df['Country']]
    
    bars = plt.bar(years_int, temp_df['Country'], color=colors, alpha=0.7)
    plt.axhline(y=extreme_hot, color='darkred', linestyle='--', alpha=0.8, label='Extreme Hot')
    plt.axhline(y=temp_mean + temp_std, color='red', linestyle='--', alpha=0.6, label='Very Hot')
    plt.axhline(y=temp_mean, color='black', linestyle='-', alpha=0.5, label='Average')
    plt.axhline(y=temp_mean - temp_std, color='blue', linestyle='--', alpha=0.6, label='Very Cold')
    plt.axhline(y=extreme_cold, color='darkblue', linestyle='--', alpha=0.8, label='Extreme Cold')
    
    plt.title('Extreme Temperature Events', fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Temperature (°C)')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.xticks(rotation=45)
    
    # Chart 2: Drought Analysis
    plt.subplot(2, 3, 2)
    rainfall_mean = rainfall_df['Country'].mean()
    rainfall_std = rainfall_df['Country'].std()
    
    # Define drought categories
    severe_drought = rainfall_mean - 2 * rainfall_std
    moderate_drought = rainfall_mean - rainfall_std
    
    drought_colors = ['darkred' if r < severe_drought else 'orange' if r < moderate_drought 
                     else 'yellow' if r < rainfall_mean else 'lightblue' if r < rainfall_mean + rainfall_std 
                     else 'blue' for r in rainfall_df['Country']]
    
    bars = plt.bar(years_int, rainfall_df['Country'], color=drought_colors, alpha=0.7)
    plt.axhline(y=severe_drought, color='darkred', linestyle='--', alpha=0.8, label='Severe Drought')
    plt.axhline(y=moderate_drought, color='orange', linestyle='--', alpha=0.6, label='Moderate Drought')
    plt.axhline(y=rainfall_mean, color='black', linestyle='-', alpha=0.5, label='Average')
    
    plt.title('Drought Analysis', fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Rainfall (mm)')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.xticks(rotation=45)
    
    # Chart 3: Heat Wave Analysis (Current Data)
    plt.subplot(2, 3, 3)
    current_temp_mean = current_df['temp'].mean()
    current_temp_std = current_df['temp'].std()
    
    heat_wave_threshold = current_temp_mean + 1.5 * current_temp_std
    
    heat_wave_cities = current_df[current_df['temp'] > heat_wave_threshold]
    normal_cities = current_df[current_df['temp'] <= heat_wave_threshold]
    
    plt.scatter(normal_cities['lon'], normal_cities['lat'], 
               c=normal_cities['temp'], s=50, cmap='coolwarm', alpha=0.6, vmin=current_df['temp'].min(), vmax=current_df['temp'].max())
    plt.scatter(heat_wave_cities['lon'], heat_wave_cities['lat'], 
               c=heat_wave_cities['temp'], s=100, cmap='coolwarm', alpha=1.0, 
               edgecolors='red', linewidths=2, vmin=current_df['temp'].min(), vmax=current_df['temp'].max())
    
    plt.colorbar(label='Temperature (°C)')
    plt.title(f'Heat Wave Locations\n({len(heat_wave_cities)} cities above {heat_wave_threshold:.1f}°C)', fontweight='bold')
    plt.xlabel('Longitude')
    plt.ylabel('Latitude')
    
    # Chart 4: Consecutive Extreme Years
    plt.subplot(2, 3, 4)
    
    # Identify consecutive hot/dry years
    hot_years = temp_df['Country'] > temp_mean + temp_std
    dry_years = rainfall_df['Country'] < rainfall_mean - rainfall_std
    
    # Find consecutive patterns
    consecutive_hot = []
    consecutive_dry = []
    current_hot_streak = 0
    current_dry_streak = 0
    
    for i, (hot, dry) in enumerate(zip(hot_years, dry_years)):
        if hot:
            current_hot_streak += 1
        else:
            if current_hot_streak > 0:
                consecutive_hot.append(current_hot_streak)
            current_hot_streak = 0
            
        if dry:
            current_dry_streak += 1
        else:
            if current_dry_streak > 0:
                consecutive_dry.append(current_dry_streak)
            current_dry_streak = 0
    
    # Add final streaks if they end with the data
    if current_hot_streak > 0:
        consecutive_hot.append(current_hot_streak)
    if current_dry_streak > 0:
        consecutive_dry.append(current_dry_streak)
    
    # Plot histogram of consecutive years
    if consecutive_hot:
        plt.hist(consecutive_hot, bins=range(1, max(consecutive_hot)+2), alpha=0.7, 
                color='red', label='Hot Streaks', edgecolor='black')
    if consecutive_dry:
        plt.hist(consecutive_dry, bins=range(1, max(consecutive_dry)+2), alpha=0.7, 
                color='orange', label='Dry Streaks', edgecolor='black')
    
    plt.title('Consecutive Extreme Weather Years', fontweight='bold')
    plt.xlabel('Consecutive Years')
    plt.ylabel('Frequency')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Chart 5: Compound Extreme Events
    plt.subplot(2, 3, 5)
    
    # Create compound event matrix over time
    compound_events = pd.DataFrame({
        'Year': years_int,
        'Hot': hot_years,
        'Dry': dry_years,
        'HotAndDry': hot_years & dry_years
    })
    
    # Plot time series of compound events
    plt.fill_between(years_int, 0, hot_years.astype(int), alpha=0.3, color='red', label='Hot Years')
    plt.fill_between(years_int, 0, dry_years.astype(int), alpha=0.3, color='orange', label='Dry Years')
    plt.fill_between(years_int, 0, compound_events['HotAndDry'].astype(int), 
                    alpha=0.8, color='darkred', label='Hot & Dry')
    
    plt.title('Compound Extreme Events Over Time', fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Event Occurrence')
    plt.legend()
    plt.xticks(rotation=45)
    
    # Chart 6: Return Period Analysis
    plt.subplot(2, 3, 6)
    
    # Calculate return periods for temperature extremes
    temp_sorted = np.sort(temp_df['Country'])[::-1]  # Sort descending
    n = len(temp_sorted)
    return_periods = [(n + 1) / (i + 1) for i in range(n)]
    
    plt.semilogy(temp_sorted, return_periods, 'o-', alpha=0.7, label='Temperature')
    
    # Add current extreme temperatures
    current_extremes = [current_df['temp'].min(), current_df['temp'].quantile(0.1), 
                       current_df['temp'].quantile(0.9), current_df['temp'].max()]
    
    for i, temp in enumerate(current_extremes):
        if temp <= temp_sorted.max() and temp >= temp_sorted.min():
            # Find approximate return period
            idx = np.argmin(np.abs(temp_sorted - temp))
            plt.scatter(temp, return_periods[idx], s=100, c='red', marker='x', linewidth=3)
    
    plt.title('Temperature Return Period Analysis', fontweight='bold')
    plt.xlabel('Temperature (°C)')
    plt.ylabel('Return Period (Years)')
    plt.grid(True, alpha=0.3)
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('charts/extreme_weather_analysis.png', dpi=300, bbox_inches='tight')
    plt.close()

def create_time_series_analysis(rainfall_df, temp_df):
    """Create detailed time series analysis"""
    plt.figure(figsize=(16, 12))
    
    years_int = [int(y) for y in rainfall_df['Year']]
    
    # Chart 1: Decomposed Temperature Trend
    plt.subplot(3, 2, 1)
    
    # Detrend temperature data
    from scipy.signal import detrend
    temp_detrended = detrend(temp_df['Country'])
    temp_trend = temp_df['Country'] - temp_detrended
    
    plt.plot(years_int, temp_df['Country'], 'o-', alpha=0.6, label='Original')
    plt.plot(years_int, temp_trend, 'r-', linewidth=2, label='Trend')
    plt.plot(years_int, temp_detrended + temp_df['Country'].mean(), 'g--', alpha=0.7, label='Detrended')
    
    plt.title('Temperature Trend Decomposition', fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Temperature (°C)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Chart 2: Rainfall Cycles and Patterns
    plt.subplot(3, 2, 2)
    
    # Apply moving average to identify cycles
    window_sizes = [3, 5, 7]
    for window in window_sizes:
        if len(rainfall_df) >= window:
            moving_avg = rainfall_df['Country'].rolling(window=window, center=True).mean()
            plt.plot(years_int, moving_avg, label=f'{window}-year average', linewidth=2)
    
    plt.plot(years_int, rainfall_df['Country'], 'o-', alpha=0.5, color='gray', label='Annual')
    
    plt.title('Rainfall Smoothing Analysis', fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Rainfall (mm)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Chart 3: Rate of Change Analysis
    plt.subplot(3, 2, 3)
    
    # Calculate year-over-year changes
    temp_changes = temp_df['Country'].diff()
    rainfall_changes = rainfall_df['Country'].diff()
    
    plt.bar([y-0.2 for y in years_int[1:]], temp_changes[1:], width=0.4, alpha=0.7, 
           label='Temperature Change', color='red')
    
    # Secondary axis for rainfall
    ax2 = plt.gca().twinx()
    ax2.bar([y+0.2 for y in years_int[1:]], rainfall_changes[1:], width=0.4, alpha=0.7, 
           label='Rainfall Change', color='blue')
    
    plt.title('Year-over-Year Changes', fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Temperature Change (°C)', color='red')
    ax2.set_ylabel('Rainfall Change (mm)', color='blue')
    
    # Add zero lines
    plt.axhline(y=0, color='red', linestyle='-', alpha=0.3)
    ax2.axhline(y=0, color='blue', linestyle='-', alpha=0.3)
    
    plt.xticks(rotation=45)
    
    # Chart 4: Volatility Analysis
    plt.subplot(3, 2, 4)
    
    # Calculate rolling standard deviation (volatility)
    temp_volatility = temp_df['Country'].rolling(window=5).std()
    rainfall_volatility = rainfall_df['Country'].rolling(window=5).std()
    
    plt.plot(years_int, temp_volatility, 'r-o', label='Temperature Volatility', markersize=4)
    
    ax2 = plt.gca().twinx()
    ax2.plot(years_int, rainfall_volatility, 'b-s', label='Rainfall Volatility', markersize=4)
    
    plt.title('Climate Volatility (5-year rolling std)', fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Temperature Volatility (°C)', color='red')
    ax2.set_ylabel('Rainfall Volatility (mm)', color='blue')
    plt.xticks(rotation=45)
    
    # Chart 5: Anomaly Persistence
    plt.subplot(3, 2, 5)
    
    # Calculate standardized anomalies
    temp_anomaly = (temp_df['Country'] - temp_df['Country'].mean()) / temp_df['Country'].std()
    rainfall_anomaly = (rainfall_df['Country'] - rainfall_df['Country'].mean()) / rainfall_df['Country'].std()
    
    # Calculate persistence (correlation with previous year)
    temp_persistence = [np.nan]
    rainfall_persistence = [np.nan]
    
    for i in range(1, len(temp_anomaly)):
        temp_persistence.append(temp_anomaly.iloc[i] * temp_anomaly.iloc[i-1])
        rainfall_persistence.append(rainfall_anomaly.iloc[i] * rainfall_anomaly.iloc[i-1])
    
    plt.scatter(years_int, temp_persistence, c='red', alpha=0.7, s=60, label='Temperature')
    plt.scatter(years_int, rainfall_persistence, c='blue', alpha=0.7, s=60, label='Rainfall')
    
    plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
    plt.title('Anomaly Persistence\n(Positive = same sign as previous year)', fontweight='bold')
    plt.xlabel('Year')
    plt.ylabel('Persistence Index')
    plt.legend()
    plt.xticks(rotation=45)
    
    # Chart 6: Spectral Analysis (Periodicity)
    plt.subplot(3, 2, 6)
    
    # Simple periodogram for temperature
    from scipy.signal import periodogram
    
    # Remove trend first
    temp_detrended_clean = detrend(temp_df['Country'].dropna())
    rainfall_detrended_clean = detrend(rainfall_df['Country'].dropna())
    
    if len(temp_detrended_clean) > 10:  # Need enough data points
        freqs_temp, psd_temp = periodogram(temp_detrended_clean)
        freqs_rain, psd_rain = periodogram(rainfall_detrended_clean)
        
        # Convert frequencies to periods (years)
        periods_temp = 1 / freqs_temp[1:]  # Skip DC component
        periods_rain = 1 / freqs_rain[1:]
        
        # Only show periods between 2 and 20 years
        valid_temp = (periods_temp >= 2) & (periods_temp <= 20)
        valid_rain = (periods_rain >= 2) & (periods_rain <= 20)
        
        if np.any(valid_temp):
            plt.semilogy(periods_temp[valid_temp], psd_temp[1:][valid_temp], 
                        'r-o', markersize=4, label='Temperature')
        if np.any(valid_rain):
            plt.semilogy(periods_rain[valid_rain], psd_rain[1:][valid_rain], 
                        'b-s', markersize=4, label='Rainfall')
    
    plt.title('Periodicity Analysis', fontweight='bold')
    plt.xlabel('Period (Years)')
    plt.ylabel('Power Spectral Density')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('charts/time_series_analysis.png', dpi=300, bbox_inches='tight')
    plt.close()

if __name__ == "__main__":
    print("🌦️  Starting Enhanced Weather Data Analysis...")
    
    # Load data
    print("📊 Loading data...")
    rainfall_df = load_rainfall_data()
    temp_df = load_temperature_data()
    current_df = load_current_weather_data()
    
    # Create original charts
    print("📈 Creating rainfall charts...")
    create_rainfall_charts(rainfall_df)
    
    print("🌡️  Creating temperature charts...")
    create_temperature_charts(temp_df)
    
    print("🌤️  Creating current weather charts...")
    create_current_weather_charts(current_df)
    
    # Create enhanced analysis
    print("🔗 Creating correlation analysis...")
    create_correlation_analysis(rainfall_df, temp_df)
    
    print("🗺️  Creating geographic analysis...")
    current_df = create_geographic_analysis(current_df)
    
    print("⚡ Creating extreme weather analysis...")
    create_extreme_weather_analysis(rainfall_df, temp_df, current_df)
    
    print("📊 Creating time series analysis...")
    create_time_series_analysis(rainfall_df, temp_df)
    
    # Generate statistics
    print("📋 Generating enhanced statistics...")
    stats = generate_statistics()
    
    print("\n✅ Enhanced analysis complete! Charts saved to 'charts/' directory")
    print("\n🔍 Key Findings:")
    print(f"• Average annual rainfall: {stats['rainfall']['country_avg']:.1f}mm")
    print(f"• Average annual temperature: {stats['temperature']['country_avg']:.1f}°C") 
    print(f"• Climate warming trend: +{stats['temperature']['warming_trend']:.3f}°C per year")
    print(f"• Current temperature range: {stats['current']['temp_min']:.1f}°C to {stats['current']['temp_max']:.1f}°C")
    print(f"• Weather data from {stats['current']['cities_count']} cities")
    print(f"• Total charts generated: 7 comprehensive visualizations")