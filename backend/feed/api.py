from django.db.models import Count
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotAuthenticated
from rest_framework.response import Response

from .models import Comment, Like, Post
from .serializers import CommentSerializer, PostSerializer, annotate_posts


class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.method in permissions.SAFE_METHODS or obj.author == request.user


class PostViewSet(viewsets.ModelViewSet):
    '''
    list      GET    /api/posts?feed=latest|following
    featured  GET    /api/posts/featured
    detail    GET    /api/posts/<id>      (PATCH / DELETE for the author)
    like      POST   /api/posts/<id>/like (DELETE to unlike)
    comments  GET    /api/posts/<id>/comments (POST to add one)
    '''
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        queryset = Post.objects.all()
        if self.action == "list" and self.request.query_params.get("feed") == "following":
            if not self.request.user.is_authenticated:
                raise NotAuthenticated("Log in to see posts from people you follow.")
            queryset = queryset.filter(author__in=self.request.user.profile.following.all())
        return annotate_posts(queryset, self.request).order_by("-date_posted")

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=False, permission_classes=[permissions.AllowAny])
    def featured(self, request):
        '''The most liked post, or null if nothing has been posted yet'''
        post = (self.get_queryset().filter(like_count__gt=0)
                .order_by("-like_count", "-date_posted").first())
        data = self.get_serializer(post).data if post else None
        return Response({"post": data})

    @action(detail=True, methods=["post", "delete"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        existing = Like.objects.filter(user=request.user, post=post).first()
        if request.method == "POST" and existing is None:
            Like(user=request.user, post=post, post_user=post.author).save()
        elif request.method == "DELETE" and existing is not None:
            existing.delete()
        return Response(self.get_serializer(self.get_object()).data)

    @action(detail=True, methods=["get", "post"],
            permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == "GET":
            comments = (Comment.objects.filter(post=post)
                        .select_related("author__profile").order_by("created_on"))
            return Response(CommentSerializer(comments, many=True, context={"request": request}).data)

        serializer = CommentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(post=post, author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
