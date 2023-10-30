from django.urls import path
from .views import (PostListView, PostDetailView, PostCreateView, CommentCreateView, PostUpdateView, PostDeleteView, UserPostListView, CurrUserPostListView,FollowPostListView,follow_view, unfollow_view)
from . import views #. is current dir
#sets structure of website
urlpatterns = [ 
    path("", PostListView.as_view(), name = "feed-home"),
    path("myfeed/", FollowPostListView.as_view(), name = "my-feed"),
    path("user/<str:username>", UserPostListView.as_view(), name = "user-posts"),
    path("myposts/", CurrUserPostListView.as_view(), name = "curr-user-posts"),
    path('follow/<int:profile_id>/', follow_view, name='follow'),
    path('unfollow/<int:profile_id>/', unfollow_view, name='unfollow'),
    path("post/<int:pk>/", PostDetailView.as_view(), name = "post-detail"),
    path("post/<int:pk>/comment/", CommentCreateView.as_view(), name = "post-comment"),
    path("post/new/", PostCreateView.as_view(), name = "post-create"),#int pk tells to get integers after prim key to grab posts
    path("post/<int:pk>/update", PostUpdateView.as_view(), name = "post-update"),
    path("post/<int:pk>/delete", PostDeleteView.as_view(), name = "post-delete"),
    path("post/memes/", views.meme_templates, name = 'post-memes'),
]