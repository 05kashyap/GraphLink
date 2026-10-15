from rest_framework.routers import SimpleRouter

from .api import PostViewSet

router = SimpleRouter(trailing_slash=False)
router.register("posts", PostViewSet, basename="post")

urlpatterns = router.urls
