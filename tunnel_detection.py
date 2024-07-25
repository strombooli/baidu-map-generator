import coordConvert as ct
import json
import asyncio
import aiohttp

async def search_pano(x, y):
    url = f'https://mapsv0.bdimg.com/?qt=qsdata&x={x}&y={y}&l=17'
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    if data['content']['id']:
                        return data['content']['id']
                    else:
                        return False
                else:
                    raise aiohttp.ClientResponseError(status=response.status)
    except :
        pass


async def check_pano(id):
    # Placeholder implementation, replace with actual check logic
    url = f'https://mapsv0.bdimg.com/?qt=sdata&sid={id}'
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    try:
                        if data['result']['error'] != 404:
                            road_id = data['content'][0]['Roads'][0]['ID']
                            return road_id
                        else:
                            return False
                    except (KeyError, IndexError):
                        return False
                else:
                    raise aiohttp.ClientResponseError(status=response.status)
    except :
        pass


# Load coordinates from JSON file
def load_coordinates_from_file(filename,limit):
    with open(filename, 'r', encoding='utf-8') as fp:
        data = json.load(fp)
    return data[:limit]

# Main function to process coordinates and fetch data with delay
async def process_coordinates(filename,limit,delay=0.1):
    coordinates = load_coordinates_from_file(filename,limit)
    results = {}
    for coord in coordinates:
        bd09 = ct.wgs84_to_bd09(coord['lng'], coord['lat'])
        bdmc = ct.convert_ll2_mc(bd09[1], bd09[0])

        # Search for panorama data with delay
        await asyncio.sleep(delay)
        panoId = await search_pano(bdmc[0], bdmc[1])
        if panoId:
            # If panorama data found, check road ID with delay
            await asyncio.sleep(delay)
            road_id = await check_pano(panoId)
            if road_id:
                # Add to results dictionary
                results[panoId] = road_id

    return results

def save_results_to_json(results, filename):
    with open(filename, 'w', encoding='utf-8') as fp:
        json.dump(results, fp, ensure_ascii=False, indent=4)


async def main():
    filename = 'tunnels.json'
    output_filename = 'results.json'
    final_results = await process_coordinates(filename,7040)
    save_results_to_json(final_results, output_filename)
    print(f"Results saved to {output_filename}")


if __name__ == "__main__":
    asyncio.run(main())
