import requests
import json
import random
from typing import Optional
from .models import Post

IMG_API_URL = "https://api.imgflip.com/caption_image" 
API_URL = "https://api.memegen.link/templates/"


def get_meme_url() -> Optional[str]:
    try:
        # Make the request to imgflip API
        r = requests.get("https://api.imgflip.com/get_memes")
        if r.status_code != 200:
            return None
        
        # Get details of a random meme
        meme_details = r.json()["data"]["memes"]
        meme_object = random.choice(meme_details)
        return str(meme_object["url"])
    
    except Exception as e:
        print(f"Error occured: {e}")
        return None

def generate_meme(template_id, top_text, bottom_text):
    '''Generate meme from id, top and bottom text POST'''
    top_text = str(top_text)
    bottom_text = str(bottom_text)
    API_URL = "https://api.memegen.link/templates/"
    params = {
    "style": [
        "string"
    ],
    "text": [
        top_text, bottom_text
    ],
    }
    ur = API_URL + str(template_id)
    #r = requests.get("https://api.imgflip.com/get_memes")
    #API_URL = "https://api.imgflip.com/caption_image" 
    response = requests.post(ur, data=params)
    data = response.json()
    meme_details = data
    return (data['url'])

def get_templates():
    '''Retrieve available templates GET'''
    API_URL = "https://api.memegen.link/templates"
    ids = []
    links = []
    response = requests.get(API_URL)
    data = response.json()
    #meme_details = data
    for temp in data:
        ids.append(temp['id'])
        links.append(temp['blank'])
    return (ids,links)
    