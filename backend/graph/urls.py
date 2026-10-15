from django.urls import path

from . import api

urlpatterns = [
    path("graph", api.network, name="api-graph"),
    path("recommendations", api.recommendations, name="api-recommendations"),
]
