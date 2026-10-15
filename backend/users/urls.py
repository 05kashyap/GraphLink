from django.urls import path

from . import api

urlpatterns = [
    path("auth/csrf", api.csrf, name="api-csrf"),
    path("auth/me", api.me, name="api-me"),
    path("auth/login", api.login_view, name="api-login"),
    path("auth/logout", api.logout_view, name="api-logout"),
    path("auth/register", api.register, name="api-register"),
    path("auth/password-reset", api.password_reset, name="api-password-reset"),
    path("auth/password-reset/confirm", api.password_reset_confirm, name="api-password-reset-confirm"),
    path("users", api.UserListView.as_view(), name="api-users"),
    path("users/<str:username>", api.UserDetailView.as_view(), name="api-user"),
    path("users/<str:username>/posts", api.UserPostsView.as_view(), name="api-user-posts"),
    path("users/<str:username>/followers",
         api.UserConnectionsView.as_view(relation="followers"), name="api-user-followers"),
    path("users/<str:username>/following",
         api.UserConnectionsView.as_view(relation="following"), name="api-user-following"),
    path("users/<str:username>/follow", api.follow, name="api-follow"),
]
