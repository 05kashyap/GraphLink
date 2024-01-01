# GraphLink 
This Web-Application was created to demonstrate and analyse the graph theory based recommender model (https://github.com/05kashyap/SocialNet_RecSys).
![image](https://github.com/05kashyap/GraphLink/assets/120780494/e585e0f8-9f52-483a-9665-2001efdd6264)

It has been hosted at: http://kashyap05.pythonanywhere.com/
#### Note: This project was created as a part of our discrete mathematics course project.
Project Report: 
# Feature Overview:
#### -User registration and authentication.
#### -Reset Password

#### -Inbuilt graph recommender system with 3 cases. (Details can be found in graph/alterutil.py)
#### -Social Network graph updated in real time with community detection. 

#### -Follow users
#### -Create Posts
#### -Like and commend under posts
#### -personalized "your feed" to view content from users who are being followed
#### -Featured section with top liked posts


Setup Instructions(To run the application locally):
(Ideally inside a virtual env)
- Clone the repository
```python
  git clone https://github.com/05kashyap/GDSC_meme_feed
```
- Install requirements.txt
  ```python
  pip install -r requirements.txt
  ```
- Make migrations
  ```python
  python manage.py makemigrations
  ```
- Apply migrations
  ```python
  python manage.py migrate
  ```
- Apply migrations
  ```python
  python manage.py runserver
  ```


