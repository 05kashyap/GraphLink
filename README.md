![image](https://github.com/05kashyap/GraphLink/assets/120780494/e585e0f8-9f52-483a-9665-2001efdd6264)

# GraphLink 
This Web-Application was created to demonstrate and analyse the graph theory based recommender model (https://github.com/05kashyap/SocialNet_RecSys).

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

# ScreenShots
![image](https://github.com/05kashyap/GraphLink/assets/120780494/a94296c7-215c-4a39-aa42-887e34c92f7e)
### Control flow of the recommendations system

![image](https://github.com/05kashyap/GraphLink/assets/120780494/09f2a391-9c93-4158-a677-cd5b16175da5)
### Real-Time graph generated using a matplotlib + networkx backend

![image](https://github.com/05kashyap/GraphLink/assets/120780494/7d5bd8e6-ef57-4283-a06f-13c11bbd100b)
### Recommended users carousel 

# Results

| Evaluation Metrics  | Result |
| ------------- | ------------- |
| Accuracy  | 0.7877  |
| Precision (at k=5)  | 1.0  |
| Recall (at k=5)  | 0.538095  |
| F1 Score  | 0.6996  |

| Graph Matching Metrics  | Result |
| ------------- | ------------- |
| GED  | 0.6  |
| Edge overlap ratio  | 0.91044  |
| Recall (at k=5)  | 0.538095  |
| Structural Hammering Distance  | 0.19999  |

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


